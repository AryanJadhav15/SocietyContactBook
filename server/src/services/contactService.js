import { prisma } from '../config/prisma.js';
import { sqlPool } from '../config/mysql.js';
import { assertCategoryPair } from './referenceService.js';
import { audit } from './auditService.js';
import { formatContactCode } from '../utils/contactCode.js';
import { parsePagination } from '../utils/pagination.js';
import { HttpError, notFound } from '../utils/httpError.js';

const includeGraph = {
  category: true,
  subcategory: true,
  workDetail: { include: { workingDays: true } },
  medicalDetail: true,
  workTypes: { include: { workType: true } },
  services: { include: { service: true } },
  flatAssociations: { include: { flat: true } },
  createdBy: { select: { id: true, name: true } },
  updatedBy: { select: { id: true, name: true } }
};

export async function listContacts(societyId, query) {
  const { page, pageSize, offset } = parsePagination(query);
  const sortColumns = {
    personName: 'co.person_name',
    contactCode: 'co.contact_code',
    createdAt: 'co.created_at',
    updatedAt: 'co.updated_at'
  };
  const orderColumn = sortColumns[query.sortBy] || sortColumns.personName;
  const orderDirection = query.sortOrder === 'desc' ? 'DESC' : 'ASC';
  const params = [societyId];
  const filters = ['co.society_id = ?'];

  if (query.search) {
    params.push(`%${query.search}%`, `%${query.search}%`, `%${query.search}%`);
    filters.push('(co.person_name LIKE ? OR co.mobile_number LIKE ? OR co.contact_code LIKE ?)');
  }
  if (query.categoryId) {
    params.push(query.categoryId);
    filters.push('co.category_id = ?');
  }
  if (query.subcategoryId) {
    params.push(query.subcategoryId);
    filters.push('co.subcategory_id = ?');
  }
  if (query.status) {
    params.push(query.status);
    filters.push('co.status = ?');
  }
  if (query.workTypeId) {
    params.push(query.workTypeId);
    filters.push('EXISTS (SELECT 1 FROM contact_work_types cwt WHERE cwt.contact_id = co.id AND cwt.work_type_id = ?)');
  }

  const whereSql = filters.join(' AND ');
  const [rows] = await sqlPool.execute(
    `SELECT co.id, co.contact_code AS contactCode, co.person_name AS personName,
            co.mobile_number AS mobileNumber, co.whatsapp_available AS whatsappAvailable,
            co.status, co.updated_at AS updatedAt, cat.name AS categoryName, sub.name AS subcategoryName,
            GROUP_CONCAT(DISTINCT wt.name ORDER BY wt.name SEPARATOR ', ') AS workTypes
       FROM contacts co
       INNER JOIN categories cat ON cat.id = co.category_id
       INNER JOIN subcategories sub ON sub.id = co.subcategory_id
       LEFT JOIN contact_work_types cwt ON cwt.contact_id = co.id
       LEFT JOIN work_types wt ON wt.id = cwt.work_type_id
      WHERE ${whereSql}
      GROUP BY co.id, co.contact_code, co.person_name, co.mobile_number, co.whatsapp_available,
               co.status, co.updated_at, cat.name, sub.name
      ORDER BY ${orderColumn} ${orderDirection}
      LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  const [countRows] = await sqlPool.execute(
    `SELECT COUNT(*) AS total FROM contacts co WHERE ${whereSql}`,
    params
  );

  return { items: rows, page, pageSize, total: Number(countRows[0].total) };
}

export async function getContact(societyId, id) {
  const contact = await prisma.contact.findFirst({ where: { id, societyId }, include: includeGraph });
  if (!contact) throw notFound('Contact not found');
  return contact;
}

export async function createContact(societyId, userId, data) {
  await assertCategoryPair(societyId, data.categoryId, data.subcategoryId);
  await assertSocietyReferences(societyId, data);

  const contact = await prisma.$transaction(async (tx) => {
    const sequenceNumber = await nextContactNumber(tx, societyId);
    const contactCode = formatContactCode(sequenceNumber);
    const created = await tx.contact.create({
      data: {
        societyId,
        contactCode,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId,
        personName: data.personName,
        gender: data.gender,
        photoPath: data.photoPath ?? null,
        mobileNumber: data.mobileNumber,
        alternateMobile: emptyToNull(data.alternateMobile),
        whatsappAvailable: data.whatsappAvailable,
        status: data.status,
        createdById: userId,
        updatedById: userId
      }
    });
    await replaceRelated(tx, created.id, societyId, data);
    return tx.contact.findUnique({ where: { id: created.id }, include: includeGraph });
  });

  await audit({ societyId, actorUserId: userId, action: 'CONTACT_CREATED', entityType: 'Contact', entityId: contact.id, metadata: { contactCode: contact.contactCode } });
  return contact;
}

export async function updateContact(societyId, userId, id, data) {
  const existing = await prisma.contact.findFirst({ where: { id, societyId } });
  if (!existing) throw notFound('Contact not found');
  if (data.categoryId || data.subcategoryId) {
    await assertCategoryPair(societyId, data.categoryId || existing.categoryId, data.subcategoryId || existing.subcategoryId);
  }
  await assertSocietyReferences(societyId, data);

  const contact = await prisma.$transaction(async (tx) => {
    await tx.contact.update({
      where: { id },
      data: {
        ...(data.categoryId ? { categoryId: data.categoryId } : {}),
        ...(data.subcategoryId ? { subcategoryId: data.subcategoryId } : {}),
        ...(data.personName ? { personName: data.personName } : {}),
        ...(data.gender ? { gender: data.gender } : {}),
        ...(Object.hasOwn(data, 'photoPath') ? { photoPath: data.photoPath } : {}),
        ...(data.mobileNumber ? { mobileNumber: data.mobileNumber } : {}),
        ...(Object.hasOwn(data, 'alternateMobile') ? { alternateMobile: emptyToNull(data.alternateMobile) } : {}),
        ...(Object.hasOwn(data, 'whatsappAvailable') ? { whatsappAvailable: data.whatsappAvailable } : {}),
        ...(data.status ? { status: data.status } : {}),
        updatedById: userId
      }
    });
    await replaceRelated(tx, id, societyId, data);
    return tx.contact.findUnique({ where: { id }, include: includeGraph });
  });

  await audit({ societyId, actorUserId: userId, action: 'CONTACT_UPDATED', entityType: 'Contact', entityId: id });
  return contact;
}

export async function deactivateContact(societyId, userId, id) {
  const contact = await prisma.contact.findFirst({ where: { id, societyId } });
  if (!contact) throw notFound('Contact not found');
  const updated = await prisma.contact.update({ where: { id }, data: { status: 'INACTIVE', updatedById: userId }, include: includeGraph });
  await audit({ societyId, actorUserId: userId, action: 'CONTACT_DEACTIVATED', entityType: 'Contact', entityId: id });
  return updated;
}

async function nextContactNumber(tx, societyId) {
  await tx.$executeRaw`INSERT INTO contact_sequences (society_id, next_value) VALUES (${societyId}, 1) ON DUPLICATE KEY UPDATE society_id = society_id`;
  const rows = await tx.$queryRaw`SELECT next_value AS nextValue FROM contact_sequences WHERE society_id = ${societyId} FOR UPDATE`;
  const nextValue = Number(rows[0].nextValue);
  await tx.$executeRaw`UPDATE contact_sequences SET next_value = ${nextValue + 1} WHERE society_id = ${societyId}`;
  return nextValue;
}

async function assertSocietyReferences(societyId, data) {
  const [workTypeCount, serviceCount, flatCount] = await Promise.all([
    data.workTypeIds?.length ? prisma.workType.count({ where: { societyId, id: { in: data.workTypeIds } } }) : 0,
    data.serviceIds?.length ? prisma.service.count({ where: { societyId, id: { in: data.serviceIds } } }) : 0,
    data.flatAssociations?.length ? prisma.flat.count({ where: { societyId, id: { in: data.flatAssociations.map((item) => item.flatId) } } }) : 0
  ]);

  if (data.workTypeIds?.length && workTypeCount !== new Set(data.workTypeIds).size) throw new HttpError(400, 'One or more work types do not belong to this society');
  if (data.serviceIds?.length && serviceCount !== new Set(data.serviceIds).size) throw new HttpError(400, 'One or more services do not belong to this society');
  if (data.flatAssociations?.length && flatCount !== new Set(data.flatAssociations.map((item) => item.flatId)).size) throw new HttpError(400, 'One or more flats do not belong to this society');
}

async function replaceRelated(tx, contactId, societyId, data) {
  if (data.workDetail) {
    const workDetail = await tx.contactWorkDetail.upsert({
      where: { contactId },
      update: cleanWorkDetail(data.workDetail),
      create: { contactId, ...cleanWorkDetail(data.workDetail) }
    });
    await tx.contactWorkingDay.deleteMany({ where: { workDetailId: workDetail.id } });
    if (data.workDetail.workingDays?.length) {
      await tx.contactWorkingDay.createMany({
        data: [...new Set(data.workDetail.workingDays)].map((day) => ({ workDetailId: workDetail.id, day }))
      });
    }
  }

  if (data.medicalDetail) {
    await tx.medicalDetail.upsert({
      where: { contactId },
      update: cleanMedicalDetail(data.medicalDetail),
      create: { contactId, ...cleanMedicalDetail(data.medicalDetail) }
    });
  }

  if (data.workTypeIds) {
    await tx.contactWorkType.deleteMany({ where: { contactId } });
    if (data.workTypeIds.length) {
      await tx.contactWorkType.createMany({ data: [...new Set(data.workTypeIds)].map((workTypeId) => ({ contactId, workTypeId })) });
    }
  }

  if (data.serviceIds) {
    await tx.contactService.deleteMany({ where: { contactId } });
    if (data.serviceIds.length) {
      await tx.contactService.createMany({ data: [...new Set(data.serviceIds)].map((serviceId) => ({ contactId, serviceId })) });
    }
  }

  if (data.flatAssociations) {
    await tx.contactFlatAssociation.deleteMany({ where: { contactId } });
    if (data.flatAssociations.length) {
      await tx.contactFlatAssociation.createMany({
        data: data.flatAssociations.map((item) => ({
          societyId,
          contactId,
          flatId: item.flatId,
          relationship: emptyToNull(item.relationship),
          timing: emptyToNull(item.timing),
          remarks: emptyToNull(item.remarks)
        }))
      });
    }
  }
}

function cleanWorkDetail(detail) {
  return {
    experienceYears: detail.experienceYears ?? null,
    workingSince: detail.workingSince ?? null,
    preferredStart: emptyToNull(detail.preferredStart),
    preferredEnd: emptyToNull(detail.preferredEnd),
    serviceArea: emptyToNull(detail.serviceArea),
    availability: emptyToNull(detail.availability),
    charges: emptyToNull(detail.charges),
    remarks: emptyToNull(detail.remarks)
  };
}

function cleanMedicalDetail(detail) {
  return {
    specialization: emptyToNull(detail.specialization),
    clinicName: emptyToNull(detail.clinicName),
    clinicAddress: emptyToNull(detail.clinicAddress),
    clinicPhone: emptyToNull(detail.clinicPhone),
    consultationTiming: emptyToNull(detail.consultationTiming),
    appointmentAvailability: emptyToNull(detail.appointmentAvailability),
    homeVisitStatus: detail.homeVisitStatus ?? null
  };
}

function emptyToNull(value) {
  return value === '' || value === undefined ? null : value;
}
