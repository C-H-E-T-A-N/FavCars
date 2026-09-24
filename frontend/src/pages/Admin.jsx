import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import { useCountUp } from '../hooks/useCountUp';
import { useEscapeKey } from '../hooks/useEscapeKey';
import {
  ActivityIcon, CarIcon, CheckIcon, ClipboardIcon, PencilIcon,
  PlusIcon, SearchIcon, TrashIcon, UploadIcon, UsersIcon, XIcon,
} from '../components/icons';
import {
  getAdminStats, getAdminCars, createAdminCar, updateAdminCar, deleteAdminCar,
  getAdminCarRequests, approveCarRequest, rejectCarRequest, uploadAdminImage, getStats,
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

function VehicleThumb({ car }) {
  return car.image?.url ? (
    <img className="admin-thumb" src={car.image.url} alt="" />
  ) : (
    <div className="admin-thumb admin-thumb-placeholder"><CarIcon className="icon" /></div>
  );
}

function CarEditModal({ car, onClose, onSaved }) {
  const [form, setForm] = useState(toFormCar(car || {}));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const isNew = !car?.id;

  useEscapeKey(onClose);

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

function CarsTab({ onChanged }) {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
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
    onChanged();
  };

  const remove = async (car) => {
    if (!window.confirm(`Delete ${car.make} ${car.model}? This can't be undone.`)) return;
    await deleteAdminCar(car.id);
    load();
    onChanged();
  };

  const rangeStart = data.totalElements === 0 ? 0 : page * 25 + 1;
  const rangeEnd = Math.min((page + 1) * 25, data.totalElements);

  return (
    <section className="admin-catalog">
      <div className="admin-section-header">
        <div className="admin-section-title">
          <span className="admin-accent-bar" />
          <div>
            <h2>Car Catalog</h2>
            <p>Manage all vehicles in the FavCars database.</p>
          </div>
        </div>
        <div className="admin-toolbar">
          <div className="admin-search-field">
            <SearchIcon className="icon" />
            <input
              className="admin-search"
              placeholder="Search by make, model, or variant..."
              aria-label="Search cars"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={() => setShowAdd(true)}><PlusIcon className="icon icon-sm" /> Add Car</button>
        </div>
      </div>

      {loading ? (
        <p className="status-message status-loading">Loading...</p>
      ) : data.content.length === 0 ? (
        <div className="admin-empty-state">
          <CarIcon className="icon" />
          <p>No cars found.</p>
        </div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Vehicle</th><th>Year</th><th className="admin-votes-header">Votes</th><th>Source</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((car) => (
                  <tr key={car.id}>
                    <td>
                      <div className="admin-vehicle-cell">
                        <VehicleThumb car={car} />
                        <div className="admin-vehicle-identity">
                          <div className="admin-vehicle-name">{car.make} {car.model}</div>
                          {car.variant && <div className="admin-vehicle-variant">{car.variant}</div>}
                        </div>
                      </div>
                    </td>
                    <td>{car.year ?? '—'}</td>
                    <td className="admin-votes-header">
                      <span className="admin-votes-cell"><ActivityIcon className="icon icon-sm" />{car.voteCount}</span>
                    </td>
                    <td><span className="admin-badge">{car.source}</span></td>
                    <td>
                      <div className="admin-row-actions">
                        <button className="btn-secondary btn-icon-only" onClick={() => setEditingCar(car)} aria-label="Edit" title="Edit"><PencilIcon className="icon icon-sm" /></button>
                        <button className="btn-danger btn-icon-only" onClick={() => remove(car)} aria-label="Delete" title="Delete"><TrashIcon className="icon icon-sm" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-pagination-footer">
            <span className="admin-pagination-count">
              Showing {rangeStart}–{rangeEnd} of {data.totalElements.toLocaleString('en-US')} vehicles
            </span>
            <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      {editingCar && <CarEditModal car={editingCar} onClose={() => setEditingCar(null)} onSaved={onSaved} />}
      {showAdd && <CarEditModal car={null} onClose={() => setShowAdd(false)} onSaved={onSaved} />}
    </section>
  );
}

const STATUS_PILL = {
  PENDING: 'admin-status-pending',
  APPROVED: 'admin-status-approved',
  REJECTED: 'admin-status-rejected',
};

function RequestsTab({ onChanged }) {
  const [status, setStatus] = useState('PENDING');
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
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
    onChanged();
  };

  const reject = async (req) => {
    await rejectCarRequest(req.id);
    load();
    onChanged();
  };

  return (
    <section className="admin-catalog">
      <div className="admin-section-header">
        <div className="admin-section-title">
          <span className="admin-accent-bar" />
          <div>
            <h2>Car Requests</h2>
            <p>Review and manage community vehicle requests.</p>
          </div>
        </div>
        <div className="admin-toolbar">
          <select className="admin-status-filter" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="status-message status-loading">Loading...</p>
      ) : data.content.length === 0 ? (
        <div className="admin-empty-state">
          <ClipboardIcon className="icon" />
          <p>No {status.toLowerCase()} requests.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Vehicle</th><th>Requested By</th><th>Date</th><th>Status</th>{status === 'PENDING' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data.content.map((req) => (
                <tr key={req.id}>
                  <td>
                    <div className="admin-vehicle-cell">
                      <div className="admin-thumb admin-thumb-placeholder"><CarIcon className="icon" /></div>
                      <div className="admin-vehicle-identity">
                        <div className="admin-vehicle-name">{req.make} {req.model}</div>
                        {(req.year || req.note) && (
                          <div className="admin-vehicle-variant">{[req.year, req.note].filter(Boolean).join(' · ')}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="admin-vehicle-name">{req.requestedByName}</div>
                    <div className="admin-vehicle-variant">{req.requestedByEmail}</div>
                  </td>
                  <td>{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '—'}</td>
                  <td><span className={`admin-status-pill ${STATUS_PILL[req.status] || ''}`}>{req.status}</span></td>
                  {status === 'PENDING' && (
                    <td>
                      <div className="admin-row-actions">
                        <button className="btn-primary btn-icon-only" onClick={() => approve(req)} aria-label="Approve" title="Approve"><CheckIcon className="icon icon-sm" /></button>
                        <button className="btn-danger btn-icon-only" onClick={() => reject(req)} aria-label="Reject" title="Reject"><XIcon className="icon icon-sm" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
    </section>
  );
}

function MetricCard({ icon, label, value, description }) {
  const animated = useCountUp(value);
  return (
    <div className="admin-metric">
      <div className="admin-metric-icon">{icon}</div>
      <div className="admin-metric-body">
        <span className="admin-metric-label">{label}</span>
        <strong className="admin-metric-value">{animated.toLocaleString('en-US')}</strong>
        <span className="admin-metric-desc">{description}</span>
      </div>
    </div>
  );
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState('cars');
  const [adminStats, setAdminStats] = useState(null);
  const [publicStats, setPublicStats] = useState(null);

  const refreshStats = () => {
    getAdminStats().then(setAdminStats);
    getStats().then(setPublicStats);
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') refreshStats();
  }, [user]);

  if (authLoading) return null;
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div className="admin-hero-content">
          <div className="admin-eyebrow">Admin</div>
          <h1>CONTROL <span className="accent">CENTER</span></h1>
          <p>Manage the FavCars automotive ecosystem.</p>
          <div className="admin-system-status">
            <span className="live-dot" /> System Operational
          </div>
        </div>
      </section>

      {(adminStats || publicStats) && (
        <div className="admin-metrics">
          <MetricCard icon={<CarIcon className="icon" />} label="Total Cars"
            value={adminStats?.totalCars ?? 0} description="In database" />
          <MetricCard icon={<UsersIcon className="icon" />} label="Total Users"
            value={adminStats?.totalUsers ?? 0} description="Registered users" />
          <MetricCard icon={<ClipboardIcon className="icon" />} label="Pending Requests"
            value={adminStats?.pendingRequests ?? 0} description="Awaiting review" />
          <MetricCard icon={<ActivityIcon className="icon" />} label="Total Votes"
            value={publicStats?.totalVotes ?? 0} description="From all cars" />
        </div>
      )}

      <div className="admin-tabs">
        <button className={tab === 'cars' ? 'active' : ''} onClick={() => setTab('cars')}>
          <CarIcon className="icon icon-sm" /> Cars
          {adminStats && <span className="admin-tab-count">{adminStats.totalCars.toLocaleString('en-US')}</span>}
        </button>
        <button className={tab === 'requests' ? 'active' : ''} onClick={() => setTab('requests')}>
          <ClipboardIcon className="icon icon-sm" /> Car Requests
          {adminStats && <span className="admin-tab-count">{adminStats.pendingRequests.toLocaleString('en-US')}</span>}
        </button>
      </div>

      {tab === 'cars'
        ? <CarsTab onChanged={refreshStats} />
        : <RequestsTab onChanged={refreshStats} />}
    </div>
  );
}
