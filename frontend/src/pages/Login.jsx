import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { googleLoginUrl } from '../services/api';

export default function Login() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="login-page">
      <h1>Login</h1>
      <a className="navbar-login" href={googleLoginUrl}>Continue with Google</a>
    </div>
  );
}
