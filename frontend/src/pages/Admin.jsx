import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import { CheckIcon, PencilIcon, PlusIcon, TrashIcon, UploadIcon, XIcon } from '../components/icons';
import {
  getAdminStats, getAdminCars, createAdminCar, updateAdminCar, deleteAdminCar,
  getAdminCarRequests, approveCarRequest, rejectCarRequest, uploadAdminImage,
} from '../services/api';

const EMPTY_CAR = {
  make: '', model: '', year: '', variant: '', country: '', bodyType: '', fuelType: '',
  transmission: '', drivetrain: '', voteCount: 0,
  engine: { name: '', displacementCc: '', cylinders: '', horsepower: '' },
  image: { url: '', source: '', credit: '', license: '' },
};

function toFormCar(car) {
  return {
    ...EMPTY_CAR,
    ...car,
    year: car.year ?? '',
    engine: { ...EMPTY_CAR.engine, ...(car.engine || {}) },
    image: { ...EMPTY_CAR.image, ...(car.image || {}) },
  };
}

function toApiCar(form) {
  const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
  return {
    ...form,
    year: numOrNull(form.year),
    voteCount: Number(form.voteCount) || 0,
    engine: {
      name: form.engine.name || null,
      displacementCc: numOrNull(form.engine.displacementCc),
      cylinders: numOrNull(form.engine.cylinders),
      horsepower: numOrNull(form.engine.horsepower),
    },
    image: {
      url: form.image.url || null,
      source: form.image.source || null,
      credit: form.image.credit || null,
      license: form.image.license || null,
    },
  };
}

function CarEditModal({ car, onClose, onSaved }) {
  const [form, setForm] = useState(toFormCar(car || {}));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const isNew = !car?.id;

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const setNested = (group, field, value) => setForm((f) => ({ ...f, [group]: { ...f[group], [field]: value } }));

  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { url } = await uploadAdminImage(file);
      setNested('image', 'url', url);
    } catch {
      setUploadError('Upload failed. Use a JPEG, PNG, WebP, or GIF under 5MB.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = toApiCar(form);
      const saved = isNew ? await createAdminCar(payload) : await updateAdminCar(car.id, payload);
      onSaved(saved);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <h2>{isNew ? 'Add Car' : `Edit ${car.make} ${car.model}`}</h2>
        <form onSubmit={save} className="modal-form admin-car-form">
          <div className="form-grid">
            <input placeholder="Make" value={form.make} onChange={(e) => set('make', e.target.value)} required />
            <input placeholder="Model" value={form.model} onChange={(e) => set('model', e.target.value)} required />
            <input placeholder="Year" type="number" value={form.year} onChange={(e) => set('year', e.target.value)} />
            <input placeholder="Variant" value={form.variant || ''} onChange={(e) => set('variant', e.target.value)} />
            <input placeholder="Country" value={form.country || ''} onChange={(e) => set('country', e.target.value)} />
            <input placeholder="Body type" value={form.bodyType || ''} onChange={(e) => set('bodyType', e.target.value)} />
            <input placeholder="Fuel type" value={form.fuelType || ''} onChange={(e) => set('fuelType', e.target.value)} />
            <input placeholder="Transmission" value={form.transmission || ''} onChange={(e) => set('transmission', e.target.value)} />
            <input placeholder="Drivetrain" value={form.drivetrain || ''} onChange={(e) => set('drivetrain', e.target.value)} />
            <input placeholder="Vote count" type="number" value={form.voteCount} onChange={(e) => set('voteCount', e.target.value)} />
          </div>

          <h3>Engine</h3>
          <div className="form-grid">
            <input placeholder="Engine name" value={form.engine.name || ''} onChange={(e) => setNested('engine', 'name', e.target.value)} />
            <input placeholder="Displacement (cc)" type="number" value={form.engine.displacementCc ?? ''} onChange={(e) => setNested('engine', 'displacementCc', e.target.value)} />
            <input placeholder="Cylinders" type="number" value={form.engine.cylinders ?? ''} onChange={(e) => setNested('engine', 'cylinders', e.target.value)} />
            <input placeholder="Horsepower" type="number" value={form.engine.horsepower ?? ''} onChange={(e) => setNested('engine', 'horsepower', e.target.value)} />
          </div>

          <h3>Image</h3>
          <div className="admin-image-editor">
            <div className="admin-image-preview">
              {form.image.url ? (
                <img src={form.image.url} alt="Car preview" />
              ) : (
                <span>No image</span>
              )}
            </div>
            <div className="admin-image-upload">
              <label className="btn-secondary admin-upload-btn">
                {uploading ? 'Uploading...' : <><UploadIcon className="icon icon-sm" /> Upload image</>}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={uploadImage} disabled={uploading} hidden />
              </label>
              {uploadError && <p className="form-error">{uploadError}</p>}
            </div>
          </div>
          <div className="form-grid">
            <input placeholder="Image URL" value={form.image.url || ''} onChange={(e) => setNested('image', 'url', e.target.value)} />
            <input placeholder="Source" value={form.image.source || ''} onChange={(e) => setNested('image', 'source', e.target.value)} />
            <input placeholder="Credit" value={form.image.credit || ''} onChange={(e) => setNested('image', 'credit', e.target.value)} />
            <input placeholder="License" value={form.image.license || ''} onChange={(e) => setNested('image', 'license', e.target.value)} />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}><XIcon className="icon icon-sm" /> Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : <><CheckIcon className="icon icon-sm" /> Save</>}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

function CarsTab() {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [data, setData] = useState({ content: [], totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [editingCar, setEditingCar] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = () => {
    setLoading(true);
    getAdminCars(page, 25, query).then(setData).finally(() => setLoading(false));
  };

  useEffect(load, [page, query]);

  const onQueryChange = (value) => {
    setQuery(value);
    setPage(0);
  };

  const onSaved = () => {
    setEditingCar(null);
    setShowAdd(false);
    load();
  };

  const remove = async (car) => {
    if (!window.confirm(`Delete ${car.make} ${car.model}? This can't be undone.`)) return;
    await deleteAdminCar(car.id);
    load();
  };

  return (
    <div>
      <div className="admin-toolbar">
        <input
          className="admin-search"
          placeholder="Search cars by make, model, or variant..."
          aria-label="Search cars"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <button className="btn-primary" onClick={() => setShowAdd(true)}><PlusIcon className="icon icon-sm" /> Add Car</button>
      </div>

      {loading ? (
        <p className="status-message status-loading">Loading...</p>
      ) : data.content.length === 0 ? (
        <p className="status-message">No cars found.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Make</th><th>Model</th><th>Year</th><th>Votes</th><th>Source</th><th></th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((car) => (
                <tr key={car.id}>
                  <td>{car.make}</td>
                  <td>{car.model}</td>
                  <td>{car.year ?? '—'}</td>
                  <td>{car.voteCount}</td>
                  <td>{car.source}</td>
                  <td className="admin-row-actions">
                    <button className="btn-secondary" onClick={() => setEditingCar(car)}><PencilIcon className="icon icon-sm" /> Edit</button>
                    <button className="btn-danger" onClick={() => remove(car)}><TrashIcon className="icon icon-sm" /> Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />

      {editingCar && <CarEditModal car={editingCar} onClose={() => setEditingCar(null)} onSaved={onSaved} />}
      {showAdd && <CarEditModal car={null} onClose={() => setShowAdd(false)} onSaved={onSaved} />}
    </div>
  );
}

function RequestsTab() {
  const [status, setStatus] = useState('PENDING');
  const [data, setData] = useState({ content: [], totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const load = () => {
    setLoading(true);
    getAdminCarRequests(status, page, 25).then(setData).finally(() => setLoading(false));
  };

  useEffect(load, [status, page]);

  const approve = async (req) => {
    await approveCarRequest(req.id);
    load();
  };

  const reject = async (req) => {
    await rejectCarRequest(req.id);
    load();
  };

  return (
    <div>
      <div className="admin-toolbar">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {loading ? (
        <p className="status-message status-loading">Loading...</p>
      ) : data.content.length === 0 ? (
        <p className="status-message">No {status.toLowerCase()} requests.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Make</th><th>Model</th><th>Year</th><th>Note</th><th>Requested by</th>{status === 'PENDING' && <th></th>}
              </tr>
            </thead>
            <tbody>
              {data.content.map((req) => (
                <tr key={req.id}>
                  <td>{req.make}</td>
                  <td>{req.model}</td>
                  <td>{req.year ?? '—'}</td>
                  <td>{req.note || '—'}</td>
                  <td>{req.requestedByName} ({req.requestedByEmail})</td>
                  {status === 'PENDING' && (
                    <td className="admin-row-actions">
                      <button className="btn-primary" onClick={() => approve(req)}><CheckIcon className="icon icon-sm" /> Approve</button>
                      <button className="btn-danger" onClick={() => reject(req)}><XIcon className="icon icon-sm" /> Reject</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
    </div>
  );
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState('cars');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user?.role === 'ADMIN') getAdminStats().then(setStats);
  }, [user]);

  if (authLoading) return null;
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;

  return (
    <div className="admin-page">
      <h1>Admin Dashboard</h1>

      {stats && (
        <div className="admin-stats">
          <div className="admin-stat"><strong>{stats.totalCars}</strong><span>Total Cars</span></div>
          <div className="admin-stat"><strong>{stats.totalUsers}</strong><span>Total Users</span></div>
          <div className="admin-stat"><strong>{stats.pendingRequests}</strong><span>Pending Requests</span></div>
        </div>
      )}

      <div className="admin-tabs">
        <button className={tab === 'cars' ? 'active' : ''} onClick={() => setTab('cars')}>Cars</button>
        <button className={tab === 'requests' ? 'active' : ''} onClick={() => setTab('requests')}>Car Requests</button>
      </div>

      {tab === 'cars' ? <CarsTab /> : <RequestsTab />}
    </div>
  );
}
