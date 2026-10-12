import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, HeartPulse, Plus, Save, Trash2, User, Wrench } from 'lucide-react';
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
  workDetail: {
    experienceYears: '',
    workingSince: '',
    preferredStart: '',
    preferredEnd: '',
    serviceArea: '',
    availability: '',
    charges: '',
    remarks: '',
    workingDays: []
  },
  medicalDetail: {
    specialization: '',
    clinicName: '',
    clinicAddress: '',
    clinicPhone: '',
    consultationTiming: '',
    appointmentAvailability: '',
    homeVisitStatus: null
  },
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
    Promise.all([api.get('/references'), api.get('/flats', { params: { pageSize: 100 } })]).then(
      ([refs, flatsResponse]) => {
        setReferences(unwrap(refs));
        setFlats(unwrap(flatsResponse).items);
      }
    );
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
        flatAssociations: contact.flatAssociations.map((item) => ({
          flatId: item.flatId,
          relationship: item.relationship || '',
          timing: item.timing || '',
          remarks: item.remarks || ''
        }))
      });
    });
  }, [editing, id]);

  const category = references.categories.find((item) => item.id === Number(form.categoryId));
  const subcategory = (category?.subcategories || []).find(
    (item) => item.id === Number(form.subcategoryId)
  );
  const defaultRelationship = subcategory?.name || '';
  const isMedical = category?.name === 'Medical';
  const needsFlatContext = !isMedical;
  const selectedFlatIds = new Set(form.flatAssociations.map((item) => Number(item.flatId)));

  function toggleArray(path, value) {
    const current = path.reduce((acc, key) => acc[key], form);
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    if (path.length === 1) setForm({ ...form, [path[0]]: next });
    else setForm({ ...form, [path[0]]: { ...form[path[0]], [path[1]]: next } });
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = normalize(form);
    try {
      const response = editing
        ? await api.put(`/contacts/${id}`, payload)
        : await api.post('/contacts', payload);
      navigate(`/contacts/${unwrap(response).id}`);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Unable to save contact');
    } finally {
      setSaving(false);
    }
  }

  const flatOptions = useMemo(
    () => flats.filter((flat) => !selectedFlatIds.has(flat.id)),
    [flats, selectedFlatIds]
  );

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Top back navigation */}
      <div className="flex items-center gap-2 text-xs">
        <Link
          to={editing ? `/contacts/${id}` : '/contacts'}
          className="inline-flex items-center gap-1 font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft size={14} /> Back
        </Link>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
          {editing ? 'Edit Contact' : 'New Contact Entry'}
        </h2>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)] sm:text-sm">
          Please fill in all core personal and professional contact details.
        </p>
      </div>

      <ErrorBanner message={error} />

      {/* Card 1: Contact Information */}
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
        <div className="flex items-center gap-2.5 border-b border-[var(--color-border)] pb-3.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]">
            <User size={16} />
          </div>
          <h3 className="text-base font-bold text-[var(--color-text-primary)]">
            Personal & Contact Information
          </h3>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Field label="Category" required>
            <select
              className="input"
              required
              value={form.categoryId}
              onChange={(e) =>
                setForm({ ...form, categoryId: e.target.value, subcategoryId: '' })
              }
            >
              <option value="">Select category</option>
              {references.categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Subcategory" required>
            <select
              className="input"
              required
              value={form.subcategoryId}
              onChange={(e) => setForm({ ...form, subcategoryId: e.target.value })}
            >
              <option value="">Select subcategory</option>
              {(category?.subcategories || []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Person Name" required>
            <input
              className="input"
              required
              placeholder="e.g. Ramesh Patel"
              value={form.personName}
              onChange={(e) => setForm({ ...form, personName: e.target.value })}
            />
          </Field>

          <Field label="Gender">
            <select
              className="input"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="FEMALE">Female</option>
              <option value="MALE">Male</option>
              <option value="NON_BINARY">Non-binary</option>
              <option value="OTHER">Other</option>
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            </select>
          </Field>

          <Field label="Mobile Number" required>
            <input
              className="input"
              required
              placeholder="10-digit number"
              value={form.mobileNumber}
              onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
            />
          </Field>

          <Field label="Alternate Mobile">
            <input
              className="input"
              placeholder="Optional backup"
              value={form.alternateMobile}
              onChange={(e) => setForm({ ...form, alternateMobile: e.target.value })}
            />
          </Field>

          <Field label="Directory Status">
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </Field>

          <div className="flex items-center gap-2 pt-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-focus-ring)]"
                checked={form.whatsappAvailable}
                onChange={(e) => setForm({ ...form, whatsappAvailable: e.target.checked })}
              />
              <span>WhatsApp Available</span>
            </label>
          </div>
        </div>
      </section>

      {/* Card 2: Work Information */}
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
        <div className="flex items-center gap-2.5 border-b border-[var(--color-border)] pb-3.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]">
            <Wrench size={16} />
          </div>
          <h3 className="text-base font-bold text-[var(--color-text-primary)]">
            Work Details & Schedule
          </h3>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Field label="Experience (Years)">
            <input
              className="input"
              type="number"
              min="0"
              placeholder="e.g. 5"
              value={form.workDetail.experienceYears || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  workDetail: { ...form.workDetail, experienceYears: e.target.value }
                })
              }
            />
          </Field>

          <Field label="Working Since (Year)">
            <input
              className="input"
              type="number"
              min="1950"
              placeholder="e.g. 2018"
              value={form.workDetail.workingSince || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  workDetail: { ...form.workDetail, workingSince: e.target.value }
                })
              }
            />
          </Field>

          <Field label="Availability Note">
            <input
              className="input"
              placeholder="e.g. Morning shifts only"
              value={form.workDetail.availability || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  workDetail: { ...form.workDetail, availability: e.target.value }
                })
              }
            />
          </Field>

          <Field label="Preferred Start Time">
            <TimeSelect
              value={form.workDetail.preferredStart || ''}
              onChange={(val) =>
                setForm({
                  ...form,
                  workDetail: { ...form.workDetail, preferredStart: val }
                })
              }
            />
          </Field>

          <Field label="Preferred End Time">
            <TimeSelect
              value={form.workDetail.preferredEnd || ''}
              onChange={(val) =>
                setForm({
                  ...form,
                  workDetail: { ...form.workDetail, preferredEnd: val }
                })
              }
            />
          </Field>

          <Field label="Charges / Rate">
            <input
              className="input"
              placeholder="e.g. ₹500/day or ₹4000/month"
              value={form.workDetail.charges || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  workDetail: { ...form.workDetail, charges: e.target.value }
                })
              }
            />
          </Field>
        </div>

        {/* Multi-select tag lists */}
        <CheckboxGroup
          title="Work Types"
          items={references.workTypes}
          selected={form.workTypeIds}
          onToggle={(idValue) => toggleArray(['workTypeIds'], idValue)}
        />

        <CheckboxGroup
          title="Specialized Services"
          items={references.services}
          selected={form.serviceIds}
          onToggle={(idValue) => toggleArray(['serviceIds'], idValue)}
        />

        <CheckboxGroup
          title="Working Days"
          items={days.map((day) => ({ id: day, name: day.replaceAll('_', ' ') }))}
          selected={form.workDetail.workingDays}
          onToggle={(day) => toggleArray(['workDetail', 'workingDays'], day)}
        />
      </section>

      {/* Card 3: Medical Details (conditional) */}
      {isMedical && (
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
          <div className="flex items-center gap-2.5 border-b border-[var(--color-border)] pb-3.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]">
              <HeartPulse size={16} />
            </div>
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              Medical Clinic & Consultation
            </h3>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              { key: 'specialization', label: 'Specialization' },
              { key: 'clinicName', label: 'Clinic Name' },
              { key: 'clinicPhone', label: 'Clinic Phone' },
              { key: 'consultationTiming', label: 'Consultation Timing' },
              { key: 'appointmentAvailability', label: 'Appointment Availability' }
            ].map(({ key, label }) => (
              <Field key={key} label={label}>
                <input
                  className="input"
                  value={form.medicalDetail[key] || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      medicalDetail: { ...form.medicalDetail, [key]: e.target.value }
                    })
                  }
                />
              </Field>
            ))}

            <div className="sm:col-span-2">
              <Field label="Clinic Address">
                <textarea
                  className="input min-h-20"
                  rows={2}
                  value={form.medicalDetail.clinicAddress || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      medicalDetail: { ...form.medicalDetail, clinicAddress: e.target.value }
                    })
                  }
                />
              </Field>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-focus-ring)]"
                  checked={Boolean(form.medicalDetail.homeVisitStatus)}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      medicalDetail: {
                        ...form.medicalDetail,
                        homeVisitStatus: e.target.checked
                      }
                    })
                  }
                />
                <span>Home visits available upon request</span>
              </label>
            </div>
          </div>
        </section>
      )}

      {/* Card 4: Associated Flats */}
      {needsFlatContext && (
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]">
                <Building2 size={16} />
              </div>
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                Associated Flats
              </h3>
            </div>
            <button
              type="button"
              className="btn-secondary text-xs"
              disabled={flatOptions.length === 0}
              onClick={() =>
                setForm({
                  ...form,
                  flatAssociations: [
                    ...form.flatAssociations,
                    {
                      flatId: flatOptions[0]?.id || '',
                      relationship: defaultRelationship,
                      timing: '',
                      remarks: ''
                    }
                  ]
                })
              }
            >
              <Plus size={14} /> Add flat link
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {form.flatAssociations.length === 0 ? (
              <p className="py-4 text-xs text-[var(--color-text-secondary)]">
                No flats currently linked. Click &quot;Add flat link&quot; above to associate this contact with specific society residences.
              </p>
            ) : (
              form.flatAssociations.map((item, index) => (
                <div
                  key={`${item.flatId}-${index}`}
                  className="grid items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)]/40 p-3 sm:grid-cols-[1fr_1fr_1.4fr_auto]"
                >
                  <select
                    className="input text-xs sm:text-sm"
                    value={item.flatId}
                    onChange={(e) =>
                      updateFlatAssociation(index, { flatId: Number(e.target.value) })
                    }
                    aria-label="Select flat"
                  >
                    <option value="">Select flat</option>
                    {flats.map((flat) => (
                      <option key={flat.id} value={flat.id}>
                        {flat.building}-{flat.flatNumber}
                      </option>
                    ))}
                  </select>

                  <input
                    className="input text-xs sm:text-sm"
                    placeholder="Role (e.g. Cook, Driver)"
                    value={item.relationship || ''}
                    onChange={(e) =>
                      updateFlatAssociation(index, { relationship: e.target.value })
                    }
                  />

                  <TimeSelect
                    value={item.timing || ''}
                    onChange={(val) => updateFlatAssociation(index, { timing: val })}
                  />

                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-danger-border)] hover:bg-[var(--color-danger-bg)] hover:text-[var(--color-danger)]"
                    title="Remove flat link"
                    onClick={() =>
                      setForm({
                        ...form,
                        flatAssociations: form.flatAssociations.filter((_, i) => i !== index)
                      })
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link to="/contacts" className="btn-secondary">
          Cancel
        </Link>
        <button type="submit" className="btn-primary" disabled={saving}>
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Contact'}
        </button>
      </div>
    </form>
  );

  function updateFlatAssociation(index, patch) {
    setForm({
      ...form,
      flatAssociations: form.flatAssociations.map((item, i) =>
        i === index ? { ...item, ...patch } : item
      )
    });
  }
}

function CheckboxGroup({ title, items, selected, onToggle }) {
  return (
    <fieldset className="mt-5 border-t border-[var(--color-border)] pt-4">
      <legend className="label mb-2.5">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const isSelected = selected.includes(item.id);
          return (
            <label
              key={item.id}
              className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                isSelected
                  ? 'border-[var(--color-accent-border)] bg-[var(--color-accent-subtle)] font-semibold text-[var(--color-accent-emphasis)] shadow-sm'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <input
                className="sr-only"
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(item.id)}
              />
              {item.name}
            </label>
          );
        })}
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
      experienceYears:
        form.workDetail.experienceYears === '' ? null : Number(form.workDetail.experienceYears),
      workingSince:
        form.workDetail.workingSince === '' ? null : Number(form.workDetail.workingSince)
    },
    flatAssociations: form.flatAssociations
      .filter((item) => item.flatId)
      .map((item) => ({ ...item, flatId: Number(item.flatId) }))
  };
}
