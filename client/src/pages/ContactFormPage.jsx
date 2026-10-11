import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import { api, unwrap } from '../api/client.js';
import Field from '../components/ui/Field.jsx';
import ErrorBanner from '../components/ui/ErrorBanner.jsx';
import TimeSelect from '../components/ui/TimeSelect.jsx';

const emptyForm = {
  categoryId: '',
  subcategoryId: '',
  personName: '',
  gender: 'FEMALE',
  mobileNumber: '',
  alternateMobile: '',
  whatsappAvailable: false,
  status: 'ACTIVE',
  workTypeIds: [],
  serviceIds: [],
  workDetail: { experienceYears: '', workingSince: '', preferredStart: '', preferredEnd: '', serviceArea: '', availability: '', charges: '', remarks: '', workingDays: [] },
  medicalDetail: { specialization: '', clinicName: '', clinicAddress: '', clinicPhone: '', consultationTiming: '', appointmentAvailability: '', homeVisitStatus: null },
  flatAssociations: []
};

const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export default function ContactFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [references, setReferences] = useState({ categories: [], workTypes: [], services: [] });
  const [flats, setFlats] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/references'), api.get('/flats', { params: { pageSize: 100 } })]).then(([refs, flatsResponse]) => {
      setReferences(unwrap(refs));
      setFlats(unwrap(flatsResponse).items);
    });
  }, []);

  useEffect(() => {
    if (!editing) return;
    api.get(`/contacts/${id}`).then((response) => {
      const contact = unwrap(response);
      setForm({
        ...emptyForm,
        categoryId: contact.categoryId,
        subcategoryId: contact.subcategoryId,
        personName: contact.personName,
        gender: contact.gender,
        mobileNumber: contact.mobileNumber,
        alternateMobile: contact.alternateMobile || '',
        whatsappAvailable: contact.whatsappAvailable,
        status: contact.status,
        workTypeIds: contact.workTypes.map((item) => item.workTypeId),
        serviceIds: contact.services.map((item) => item.serviceId),
        workDetail: {
          ...emptyForm.workDetail,
          ...(contact.workDetail || {}),
          workingDays: contact.workDetail?.workingDays.map((item) => item.day) || []
        },
        medicalDetail: { ...emptyForm.medicalDetail, ...(contact.medicalDetail || {}) },
        flatAssociations: contact.flatAssociations.map((item) => ({ flatId: item.flatId, relationship: item.relationship || '', timing: item.timing || '', remarks: item.remarks || '' }))
      });
    });
  }, [editing, id]);

  const category = references.categories.find((item) => item.id === Number(form.categoryId));
  const subcategory = (category?.subcategories || []).find((item) => item.id === Number(form.subcategoryId));
  const defaultRelationship = subcategory?.name || '';
  const isMedical = category?.name === 'Medical';
  const needsFlatContext = !isMedical;
  const selectedFlatIds = new Set(form.flatAssociations.map((item) => Number(item.flatId)));

  function toggleArray(path, value) {
    const current = path.reduce((acc, key) => acc[key], form);
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    if (path.length === 1) setForm({ ...form, [path[0]]: next });
    else setForm({ ...form, [path[0]]: { ...form[path[0]], [path[1]]: next } });
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = normalize(form);
    try {
      const response = editing ? await api.put(`/contacts/${id}`, payload) : await api.post('/contacts', payload);
      navigate(`/contacts/${unwrap(response).id}`);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Unable to save contact');
    } finally {
      setSaving(false);
    }
  }

  const flatOptions = useMemo(() => flats.filter((flat) => !selectedFlatIds.has(flat.id)), [flats, selectedFlatIds]);

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-ink">{editing ? 'Edit contact' : 'Add contact'}</h2>
        <p className="text-sm text-slate-500">Required fields come from the Word document: category, subcategory, name, gender, mobile number, and status.</p>
      </div>
      <ErrorBanner message={error} />

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-ink">Contact information</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Field label="Category"><select className="input" required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value, subcategoryId: '' })}><option value="">Select</option>{references.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
          <Field label="Subcategory"><select className="input" required value={form.subcategoryId} onChange={(e) => setForm({ ...form, subcategoryId: e.target.value })}><option value="">Select</option>{(category?.subcategories || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
          <Field label="Person name"><input className="input" required value={form.personName} onChange={(e) => setForm({ ...form, personName: e.target.value })} /></Field>
          <Field label="Gender"><select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option value="FEMALE">Female</option><option value="MALE">Male</option><option value="NON_BINARY">Non-binary</option><option value="OTHER">Other</option><option value="PREFER_NOT_TO_SAY">Prefer not to say</option></select></Field>
          <Field label="Mobile number"><input className="input" required value={form.mobileNumber} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} /></Field>
          <Field label="Alternate mobile"><input className="input" value={form.alternateMobile} onChange={(e) => setForm({ ...form, alternateMobile: e.target.value })} /></Field>
          <Field label="Status"><select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></Field>
          <label className="flex items-center gap-2 pt-7 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.whatsappAvailable} onChange={(e) => setForm({ ...form, whatsappAvailable: e.target.checked })} /> WhatsApp available</label>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-ink">Work information</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Field label="Experience years"><input className="input" type="number" min="0" value={form.workDetail.experienceYears || ''} onChange={(e) => setForm({ ...form, workDetail: { ...form.workDetail, experienceYears: e.target.value } })} /></Field>
          <Field label="Working since"><input className="input" type="number" min="1950" value={form.workDetail.workingSince || ''} onChange={(e) => setForm({ ...form, workDetail: { ...form.workDetail, workingSince: e.target.value } })} /></Field>
          <Field label="Availability"><input className="input" value={form.workDetail.availability || ''} onChange={(e) => setForm({ ...form, workDetail: { ...form.workDetail, availability: e.target.value } })} /></Field>
          <Field label="Preferred start">
            <TimeSelect
              value={form.workDetail.preferredStart || ''}
              onChange={(val) => setForm({ ...form, workDetail: { ...form.workDetail, preferredStart: val } })}
            />
          </Field>
          <Field label="Preferred end">
            <TimeSelect
              value={form.workDetail.preferredEnd || ''}
              onChange={(val) => setForm({ ...form, workDetail: { ...form.workDetail, preferredEnd: val } })}
            />
          </Field>
          <Field label="Charges"><input className="input" value={form.workDetail.charges || ''} onChange={(e) => setForm({ ...form, workDetail: { ...form.workDetail, charges: e.target.value } })} /></Field>
        </div>
        <CheckboxGroup title="Work types" items={references.workTypes} selected={form.workTypeIds} onToggle={(idValue) => toggleArray(['workTypeIds'], idValue)} />
        <CheckboxGroup title="Services" items={references.services} selected={form.serviceIds} onToggle={(idValue) => toggleArray(['serviceIds'], idValue)} />
        <CheckboxGroup title="Working days" items={days.map((day) => ({ id: day, name: day.replaceAll('_', ' ') }))} selected={form.workDetail.workingDays} onToggle={(day) => toggleArray(['workDetail', 'workingDays'], day)} />
      </section>

      {isMedical && <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-ink">Medical details</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {['specialization', 'clinicName', 'clinicPhone', 'consultationTiming', 'appointmentAvailability'].map((key) => (
            <Field key={key} label={key.replace(/([A-Z])/g, ' $1')}><input className="input" value={form.medicalDetail[key] || ''} onChange={(e) => setForm({ ...form, medicalDetail: { ...form.medicalDetail, [key]: e.target.value } })} /></Field>
          ))}
          <Field label="Clinic address"><textarea className="input" value={form.medicalDetail.clinicAddress || ''} onChange={(e) => setForm({ ...form, medicalDetail: { ...form.medicalDetail, clinicAddress: e.target.value } })} /></Field>
          <label className="flex items-center gap-2 pt-7 text-sm font-medium text-slate-700"><input type="checkbox" checked={Boolean(form.medicalDetail.homeVisitStatus)} onChange={(e) => setForm({ ...form, medicalDetail: { ...form.medicalDetail, homeVisitStatus: e.target.checked } })} /> Home visits available</label>
        </div>
      </section>}

      {needsFlatContext && <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-ink">Associated flats</h3>
        <div className="mt-4 space-y-3">
          {form.flatAssociations.map((item, index) => (
            <div key={`${item.flatId}-${index}`} className="grid gap-3 md:grid-cols-[1fr_1fr_1.4fr_auto]">
              <select className="input" value={item.flatId} onChange={(e) => updateFlatAssociation(index, { flatId: Number(e.target.value) })}>
                <option value="">Select flat</option>
                {flats.map((flat) => <option key={flat.id} value={flat.id}>{flat.building}-{flat.flatNumber}</option>)}
              </select>
              <input className="input" placeholder="Relationship/service" value={item.relationship || ''} onChange={(e) => updateFlatAssociation(index, { relationship: e.target.value })} />
              <TimeSelect value={item.timing || ''} onChange={(val) => updateFlatAssociation(index, { timing: val })} />
              <button type="button" className="btn-secondary" onClick={() => setForm({ ...form, flatAssociations: form.flatAssociations.filter((_, i) => i !== index) })}>Remove</button>
            </div>
          ))}
          <button type="button" className="btn-secondary" disabled={flatOptions.length === 0} onClick={() => setForm({ ...form, flatAssociations: [...form.flatAssociations, { flatId: flatOptions[0]?.id || '', relationship: defaultRelationship, timing: '', remarks: '' }] })}>Add flat association</button>
        </div>
      </section>}

      <div className="flex justify-end">
        <button className="btn-primary" disabled={saving}><Save size={17} /> {saving ? 'Saving...' : 'Save contact'}</button>
      </div>
    </form>
  );

  function updateFlatAssociation(index, patch) {
    setForm({ ...form, flatAssociations: form.flatAssociations.map((item, i) => i === index ? { ...item, ...patch } : item) });
  }
}

function CheckboxGroup({ title, items, selected, onToggle }) {
  return (
    <fieldset className="mt-5">
      <legend className="label mb-2">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <label key={item.id} className={`rounded-md border px-3 py-2 text-sm ${selected.includes(item.id) ? 'border-brand bg-brand text-white' : 'border-slate-300 bg-white text-slate-700'}`}>
            <input className="sr-only" type="checkbox" checked={selected.includes(item.id)} onChange={() => onToggle(item.id)} />
            {item.name}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function normalize(form) {
  return {
    ...form,
    categoryId: Number(form.categoryId),
    subcategoryId: Number(form.subcategoryId),
    workTypeIds: form.workTypeIds.map(Number),
    serviceIds: form.serviceIds.map(Number),
    workDetail: {
      ...form.workDetail,
      experienceYears: form.workDetail.experienceYears === '' ? null : Number(form.workDetail.experienceYears),
      workingSince: form.workDetail.workingSince === '' ? null : Number(form.workDetail.workingSince)
    },
    flatAssociations: form.flatAssociations.filter((item) => item.flatId).map((item) => ({ ...item, flatId: Number(item.flatId) }))
  };
}
