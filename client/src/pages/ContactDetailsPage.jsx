import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Edit } from 'lucide-react';
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

  if (!contact) return <p>Loading contact...</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{contact.contactCode}</p>
          <h2 className="text-2xl font-bold text-ink">{contact.personName}</h2>
          <p className="text-slate-600">{contact.category.name} · {contact.subcategory.name}</p>
        </div>
        {isAdmin && <Link className="btn-primary" to={`/contacts/${id}/edit`}><Edit size={17} /> Edit</Link>}
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <Info title="Contact information" rows={[
          ['Mobile', contact.mobileNumber],
          ['Alternate mobile', contact.alternateMobile || 'Not provided'],
          ['WhatsApp', contact.whatsappAvailable ? 'Yes' : 'No'],
          ['Gender', prettyEnum(contact.gender)],
          ['Status', <span className={`badge ${statusTone(contact.status)}`}>{contact.status}</span>]
        ]} />
        <Info title="Work information" rows={[
          ['Work types', contact.workTypes.map((item) => item.workType.name).join(', ') || 'Not set'],
          ['Services', contact.services.map((item) => item.service.name).join(', ') || 'Not set'],
          ['Experience', contact.workDetail?.experienceYears ? `${contact.workDetail.experienceYears} years` : 'Not set'],
          ['Working since', contact.workDetail?.workingSince || 'Not set'],
          ['Timing', [contact.workDetail?.preferredStart, contact.workDetail?.preferredEnd].filter(Boolean).join(' - ') || 'Not set'],
          ['Days', contact.workDetail?.workingDays.map((item) => prettyEnum(item.day)).join(', ') || 'Not set'],
          ['Charges', contact.workDetail?.charges || 'Not set']
        ]} />
        <Info title="Medical details" rows={[
          ['Specialization', contact.medicalDetail?.specialization || 'Not applicable'],
          ['Clinic', contact.medicalDetail?.clinicName || 'Not applicable'],
          ['Clinic phone', contact.medicalDetail?.clinicPhone || 'Not applicable'],
          ['Consultation', contact.medicalDetail?.consultationTiming || 'Not applicable'],
          ['Home visit', contact.medicalDetail?.homeVisitStatus === null || contact.medicalDetail?.homeVisitStatus === undefined ? 'Not set' : contact.medicalDetail.homeVisitStatus ? 'Yes' : 'No']
        ]} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-ink">Associated flats</h3>
        <div className="mt-3 divide-y divide-slate-100">
          {contact.flatAssociations.length === 0 ? <p className="text-sm text-slate-500">No flat associations.</p> : contact.flatAssociations.map((item) => (
            <div key={item.id} className="py-3 text-sm">
              <p className="font-semibold">{item.flat.building}-{item.flat.flatNumber}</p>
              <p className="text-slate-500">{[item.relationship, item.timing, item.remarks].filter(Boolean).join(' · ')}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Info({ title, rows }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <dl className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
            <dd className="mt-1 text-sm text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
