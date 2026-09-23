import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { googleLoginUrl } from '../services/api';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const submitSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/explore?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">Fav<span>Cars</span></Link>

      <nav className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Leaderboard</NavLink>
        <NavLink to="/explore" className={({ isActive }) => isActive ? 'active' : ''}>Explore Cars</NavLink>
        <NavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''}>About</NavLink>
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

      {/* Visual only for now - car request/submission isn't part of this phase. */}
      <button type="button" className="navbar-request-car" title="Coming soon">+ Request a Car</button>
    </header>
  );
}
