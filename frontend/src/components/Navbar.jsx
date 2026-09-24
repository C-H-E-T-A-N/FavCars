import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { googleLoginUrl, submitCarRequest } from '../services/api';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({ make: '', model: '', year: '', note: '' });
  const [requestStatus, setRequestStatus] = useState(null);

  const submitSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/explore?q=${encodeURIComponent(query.trim())}`);
  };

  const openRequestForm = () => {
    if (!user) {
      window.location.href = googleLoginUrl;
      return;
    }
    setRequestStatus(null);
    setShowRequestForm(true);
  };

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
      <Link to="/" className="navbar-brand">Fav<span>Cars</span></Link>

      <nav className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Leaderboard</NavLink>
        <NavLink to="/explore" className={({ isActive }) => isActive ? 'active' : ''}>Explore Cars</NavLink>
        <NavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''}>About</NavLink>
        {user?.role === 'ADMIN' && (
          <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>Admin</NavLink>
        )}
      </nav>

      <form className="navbar-search" onSubmit={submitSearch}>
        <span>🔍</span>
        <input
          type="text"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      <div className="navbar-auth">
        {loading ? null : user ? (
          <div className="navbar-profile">
            {user.profileImage && <img className="navbar-avatar" src={user.profileImage} alt={user.name} />}
            <span>{user.name}</span>
            <button className="navbar-logout" onClick={logout}>Logout</button>
          </div>
        ) : (
          <a className="navbar-login" href={googleLoginUrl}>Continue with Google</a>
        )}
      </div>

      <button type="button" className="navbar-request-car" onClick={openRequestForm}>+ Request a Car</button>

      {showRequestForm && (
        <div className="modal-backdrop" onClick={() => setShowRequestForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Request a Car</h2>
            {requestStatus === 'sent' ? (
              <>
                <p>Thanks! An admin will review your request.</p>
                <button className="btn-primary" onClick={() => setShowRequestForm(false)}>Close</button>
              </>
            ) : (
              <form onSubmit={submitRequestForm} className="modal-form">
                <input
                  placeholder="Make (e.g. Toyota)"
                  value={requestForm.make}
                  onChange={(e) => setRequestForm({ ...requestForm, make: e.target.value })}
                  required
                />
                <input
                  placeholder="Model (e.g. Supra)"
                  value={requestForm.model}
                  onChange={(e) => setRequestForm({ ...requestForm, model: e.target.value })}
                  required
                />
                <input
                  placeholder="Year (optional)"
                  type="number"
                  value={requestForm.year}
                  onChange={(e) => setRequestForm({ ...requestForm, year: e.target.value })}
                />
                <textarea
                  placeholder="Why should we add it? (optional)"
                  value={requestForm.note}
                  onChange={(e) => setRequestForm({ ...requestForm, note: e.target.value })}
                />
                {requestStatus === 'error' && <p className="form-error">Something went wrong. Try again.</p>}
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowRequestForm(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={requestStatus === 'sending'}>
                    {requestStatus === 'sending' ? 'Sending...' : 'Submit'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
