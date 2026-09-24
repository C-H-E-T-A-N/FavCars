import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { googleLoginUrl, submitCarRequest } from '../services/api';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { CalendarIcon, CarIcon, CheckIcon, PlusIcon, SearchIcon, XIcon } from './icons';

const NOTE_MAX_LENGTH = 500;

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({ make: '', model: '', year: '', note: '' });
  const [requestStatus, setRequestStatus] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const submitSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/explore?q=${encodeURIComponent(query.trim())}`);
      setMobileOpen(false);
    }
  };

  const openRequestForm = () => {
    setMobileOpen(false);
    if (!user) {
      window.location.href = googleLoginUrl;
      return;
    }
    setRequestStatus(null);
    setShowRequestForm(true);
  };

  useEscapeKey(() => { if (showRequestForm) setShowRequestForm(false); });

  const submitRequestForm = async (e) => {
    e.preventDefault();
    if (!requestForm.make.trim() || !requestForm.model.trim()) return;
    setRequestStatus('sending');
    try {
      await submitCarRequest({
        make: requestForm.make.trim(),
        model: requestForm.model.trim(),
        year: requestForm.year ? Number(requestForm.year) : null,
        note: requestForm.note.trim() || null,
      });
      setRequestStatus('sent');
      setRequestForm({ make: '', model: '', year: '', note: '' });
    } catch {
      setRequestStatus('error');
    }
  };

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand" onClick={() => setMobileOpen(false)}>Fav<span>Cars</span></Link>

      <button
        type="button"
        className="navbar-toggle"
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>

      <div className={`navbar-collapse${mobileOpen ? ' open' : ''}`}>
        <nav className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMobileOpen(false)}>Leaderboard</NavLink>
          <NavLink to="/explore" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMobileOpen(false)}>Explore Cars</NavLink>
          <NavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMobileOpen(false)}>About</NavLink>
          {user?.role === 'ADMIN' && (
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMobileOpen(false)}>Admin</NavLink>
          )}
        </nav>

        <form className="navbar-search" onSubmit={submitSearch} role="search">
          <SearchIcon className="icon" />
          <input
            type="text"
            placeholder="Search"
            aria-label="Search cars"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>

        <div className="navbar-auth">
          {loading ? null : user ? (
            <div className="navbar-profile">
              {user.profileImage && <img className="navbar-avatar" src={user.profileImage} alt="" />}
              <span>{user.name}</span>
              <button className="navbar-logout" onClick={logout}>Logout</button>
            </div>
          ) : (
            <a className="navbar-login" href={googleLoginUrl}>Continue with Google</a>
          )}
        </div>

        <button type="button" className="navbar-request-car" onClick={openRequestForm}>
          <PlusIcon className="icon" /> Request a Car
        </button>
      </div>

      {showRequestForm && createPortal(
        <div className="modal-backdrop" onClick={() => setShowRequestForm(false)}>
          <div className="modal modal-request-car" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" aria-label="Close" onClick={() => setShowRequestForm(false)}>
              <XIcon className="icon icon-sm" />
            </button>
            <div className="modal-request-header">
              <div className="modal-request-icon"><CarIcon className="icon" /></div>
              <div>
                <h2>Request a Vehicle</h2>
                <p>Add a car to the world's car leaderboard.</p>
              </div>
            </div>
            <div className="modal-divider" />
            {requestStatus === 'sent' ? (
              <>
                <p>Thanks! An admin will review your request.</p>
                <div className="modal-actions">
                  <button className="btn-primary" onClick={() => setShowRequestForm(false)}><CheckIcon className="icon icon-sm" /> Close</button>
                </div>
              </>
            ) : (
              <form onSubmit={submitRequestForm} className="modal-form">
                <div className="form-grid">
                  <label className="modal-field">
                    <span className="modal-label">Make *</span>
                    <span className="modal-input-icon">
                      <CarIcon className="icon icon-sm" />
                      <input
                        placeholder="e.g. Toyota"
                        value={requestForm.make}
                        onChange={(e) => setRequestForm({ ...requestForm, make: e.target.value })}
                        required
                      />
                    </span>
                  </label>
                  <label className="modal-field">
                    <span className="modal-label">Model *</span>
                    <span className="modal-input-icon">
                      <CarIcon className="icon icon-sm" />
                      <input
                        placeholder="e.g. Supra"
                        value={requestForm.model}
                        onChange={(e) => setRequestForm({ ...requestForm, model: e.target.value })}
                        required
                      />
                    </span>
                  </label>
                </div>
                <label className="modal-field">
                  <span className="modal-label">Year</span>
                  <span className="modal-input-icon">
                    <CalendarIcon className="icon icon-sm" />
                    <input
                      placeholder="e.g. 2025"
                      type="number"
                      value={requestForm.year}
                      onChange={(e) => setRequestForm({ ...requestForm, year: e.target.value })}
                    />
                  </span>
                </label>
                <label className="modal-field">
                  <span className="modal-label">Why should we add it?</span>
                  <textarea
                    placeholder="Tell us why this vehicle deserves to be in FavCars..."
                    value={requestForm.note}
                    maxLength={NOTE_MAX_LENGTH}
                    onChange={(e) => setRequestForm({ ...requestForm, note: e.target.value })}
                  />
                  <span className="modal-char-count">{requestForm.note.length}/{NOTE_MAX_LENGTH}</span>
                </label>
                {requestStatus === 'error' && <p className="form-error">Something went wrong. Try again.</p>}
                <div className="modal-divider" />
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowRequestForm(false)}><XIcon className="icon icon-sm" /> Cancel</button>
                  <button type="submit" className="btn-primary" disabled={requestStatus === 'sending'}>
                    {requestStatus === 'sending' ? 'Submitting...' : <><CheckIcon className="icon icon-sm" /> Submit Request</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
