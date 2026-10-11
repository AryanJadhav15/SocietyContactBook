import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = {
  'Domestic Help': ['Maid', 'Cook', 'Driver', 'Nanny', 'Babysitter', 'Elder Care', 'Laundry', 'Car Cleaner'],
  'Society Staff': [],
  Security: [],
  Maintenance: ['Electrician', 'Plumber', 'Carpenter', 'AC Technician', 'RO Technician', 'Appliance Technician', 'Painter', 'Mason', 'Pest Control', 'Gardener'],
  'Service Provider': ['Internet', 'Cable/DTH', 'Newspaper', 'Milk', 'Water', 'Gas', 'Courier', 'Delivery'],
  Medical: ['Doctor', 'Dentist', 'Physiotherapist', 'Nurse', 'Clinic', 'Hospital', 'Pharmacy'],
  Vendor: [],
  Emergency: [],
  Other: []
};

const workTypes = [
  ['Full-Time Help'],
  ['Part-Time Help'],
  ['Available on Call'],
  ['Available on Appointment'],
  ['Emergency Service'],
  ['Regular Visit'],
  ['Occasional Visit'],
  ['Does Not Visit Home'],
  ['Society Premises Only'],
  ['Remote / Phone Consultation'],
  ['Home Visit', 'Added because the Word document examples use Home Visit although it is not in the main option list.']
];

const services = [
  'House Cleaning',
  'Cooking',
  'Driving',
  'Laundry',
  'Plumbing repair',
  'Leakage',
  'Bathroom fittings',
  'Water tank',
  'Pipe work',
  'Electrical repair',
  'Medical consultation'
];

async function main() {
  const societyName = process.env.SEED_SOCIETY_NAME || 'Demo Society';
  const societyCode = process.env.SEED_SOCIETY_CODE || 'DEMO';
  const society = await prisma.society.upsert({
    where: { code: societyCode },
    update: { name: societyName },
    create: { name: societyName, code: societyCode }
  });

  for (const [categoryName, subcategoryNames] of Object.entries(categories)) {
    const category = await prisma.category.upsert({
      where: { societyId_name: { societyId: society.id, name: categoryName } },
      update: { isSystem: true },
      create: { societyId: society.id, name: categoryName, isSystem: true }
    });

    for (const subcategoryName of subcategoryNames) {
      await prisma.subcategory.upsert({
        where: { categoryId_name: { categoryId: category.id, name: subcategoryName } },
        update: { isSystem: true, societyId: society.id },
        create: { societyId: society.id, categoryId: category.id, name: subcategoryName, isSystem: true }
      });
    }
  }

  for (const [name, sourceNote] of workTypes) {
    await prisma.workType.upsert({
      where: { societyId_name: { societyId: society.id, name } },
      update: { isSystem: true, sourceNote },
      create: { societyId: society.id, name, isSystem: true, sourceNote }
    });
  }

  for (const name of services) {
    await prisma.service.upsert({
      where: { societyId_name: { societyId: society.id, name } },
      update: { isSystem: true },
      create: { societyId: society.id, name, isSystem: true }
    });
  }

  console.log(`Seeded reference data for ${society.name} (${society.code}).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
