import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Edit, HeartPulse, PhoneCall, User } from 'lucide-react';
import { api, unwrap } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { prettyEnum, statusTone } from '../utils/format.js';

export default function ContactDetailsPage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [contact, setContact] = useState(null);

  useEffect(() => {
    api.get(`/contacts/${id}`).then((response) => setContact(unwrap(response)));
  }, [id]);

  if (!contact) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
          <span>Loading contact details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & top bar */}
      <div className="flex items-center gap-2 text-xs">
        <Link
          to="/contacts"
          className="inline-flex items-center gap-1 font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft size={14} /> Back to Contacts
        </Link>
      </div>

      {/* Main Contact Profile Header Card */}
      <section className="flex flex-col gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-[var(--color-accent-border)] bg-[var(--color-accent-subtle)] text-lg font-bold text-[var(--color-accent-emphasis)]">
            {(contact.personName || 'C').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="badge-code">
                {contact.contactCode}
              </span>
              <span className={`badge ${statusTone(contact.status)}`}>
                {contact.status}
              </span>
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {contact.personName}
            </h2>
            <p className="mt-0.5 text-xs text-[var(--color-text-secondary)] sm:text-sm">
              <span className="font-medium text-[var(--color-text-primary)]">
                {contact.category?.name}
              </span>
              {contact.subcategory?.name && (
                <>
                  <span className="mx-1.5">·</span>
                  <span>{contact.subcategory.name}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {isAdmin && (
          <Link to={`/contacts/${id}/edit`} className="btn-primary self-start sm:self-auto">
            <Edit size={16} /> Edit Contact
          </Link>
        )}
      </section>

      {/* 3 Information Sections */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact Information */}
        <InfoCard
          icon={PhoneCall}
          title="Contact Details"
          rows={[
            ['Mobile Number', contact.mobileNumber],
            ['Alternate Mobile', contact.alternateMobile || 'Not provided'],
            ['WhatsApp Available', contact.whatsappAvailable ? 'Yes' : 'No'],
            ['Gender', prettyEnum(contact.gender)],
            ['Directory Status', contact.status]
          ]}
        />

        {/* Work Information */}
        <InfoCard
          icon={User}
          title="Work Profile"
          rows={[
            [
              'Work Types',
              contact.workTypes.map((item) => item.workType.name).join(', ') || 'Not specified'
            ],
            [
              'Services',
              contact.services.map((item) => item.service.name).join(', ') || 'Not specified'
            ],
            [
              'Experience',
              contact.workDetail?.experienceYears
                ? `${contact.workDetail.experienceYears} years`
                : 'Not specified'
            ],
            ['Working Since', contact.workDetail?.workingSince || 'Not specified'],
            [
              'Preferred Timing',
              [contact.workDetail?.preferredStart, contact.workDetail?.preferredEnd]
                .filter(Boolean)
                .join(' – ') || 'Flexible'
            ],
            [
              'Working Days',
              contact.workDetail?.workingDays.map((item) => prettyEnum(item.day)).join(', ') ||
                'Not specified'
            ],
            ['Standard Charges', contact.workDetail?.charges || 'Not specified']
          ]}
        />

        {/* Medical Details */}
        <InfoCard
          icon={HeartPulse}
          title="Medical Details"
          rows={[
            ['Specialization', contact.medicalDetail?.specialization || 'Not applicable'],
            ['Clinic Name', contact.medicalDetail?.clinicName || 'Not applicable'],
            ['Clinic Phone', contact.medicalDetail?.clinicPhone || 'Not applicable'],
            ['Consultation Timing', contact.medicalDetail?.consultationTiming || 'Not applicable'],
            [
              'Home Visit Availability',
              contact.medicalDetail?.homeVisitStatus === null ||
              contact.medicalDetail?.homeVisitStatus === undefined
                ? 'Not set'
                : contact.medicalDetail.homeVisitStatus
                ? 'Yes'
                : 'No'
            ]
          ]}
        />
      </div>

      {/* Associated Flats Card */}
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-4">
          <div className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]">
            <Building2 size={16} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              Associated Flats
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Resident residences serviced by this contact
            </p>
          </div>
        </div>

        <div className="mt-4 divide-y divide-[var(--color-border)]">
          {contact.flatAssociations.length === 0 ? (
            <p className="py-6 text-sm text-[var(--color-text-secondary)]">
              No flat associations registered for this contact.
            </p>
          ) : (
            contact.flatAssociations.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between gap-2 py-3.5 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="badge-code font-bold">
                    {item.flat.building}-{item.flat.flatNumber}
                  </span>
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {item.relationship || 'Associated Service'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                  {item.timing && <span>Schedule: {item.timing}</span>}
                  {item.remarks && (
                    <>
                      <span>·</span>
                      <span>{item.remarks}</span>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function InfoCard({ icon: Icon, title, rows }) {
  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
      <div className="flex items-center gap-2.5 border-b border-[var(--color-border)] pb-3.5">
        <div className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]">
          <Icon size={16} />
        </div>
        <h3 className="text-base font-bold text-[var(--color-text-primary)]">{title}</h3>
      </div>
      <dl className="mt-4 space-y-3.5">
        {rows.map(([label, value]) => (
          <div key={label} className="border-b border-[var(--color-border-subtle)] pb-2.5 last:border-0 last:pb-0">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              {label}
            </dt>
            <dd className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
