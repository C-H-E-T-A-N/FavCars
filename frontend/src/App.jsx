import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Leaderboard from './pages/Leaderboard';
import Explore from './pages/Explore';
import CarDetails from './pages/CarDetails';
import Login from './pages/Login';
import About from './pages/About';
import Admin from './pages/Admin';
import './App.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Leaderboard />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/login" element={<Login />} />
            <Route path="/about" element={<About />} />
            <Route path="/cars/:id" element={<CarDetails />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        <footer className="app-footer">
          <div className="footer-brand">Fav<span>Cars</span></div>
          <p>Built for car lovers, by car lovers.</p>
        </footer>
      </BrowserRouter>
    </AuthProvider>
  );
}
