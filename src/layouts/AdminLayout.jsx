import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import './AdminLayout.css'; // 👈 Підключаємо CSS

function AdminLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [toastMsg, setToastMsg] = useState('');

    useEffect(() => {
        if (location.state?.welcomeMsg) {
            setToastMsg(location.state.welcomeMsg);
            const timer = setTimeout(() => {
                setToastMsg('');
            }, 3500);
            window.history.replaceState({}, document.title);
            return () => clearTimeout(timer);
        }
    }, [location]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="admin-layout-container">

            {toastMsg && <div className="custom-toast">{toastMsg}</div>}

            <header className="admin-header">
                <div className="admin-logo-section">
                    <img src="/logo.png" alt="Logo" className="admin-logo" />
                    <h3 className="admin-title">Панель Керування</h3>
                </div>

                <nav className="admin-nav">
                    <Link to="/admin/adoptions" className={`admin-nav-link ${location.pathname === '/admin/adoptions' ? 'active' : ''}`}>
                        📝 Заявки
                    </Link>
                    <Link to="/admin/reviews" className={`admin-nav-link ${location.pathname === '/admin/reviews' ? 'active' : ''}`}>
                        💬 Відгуки
                    </Link>
                    <Link to="/admin/pets" className={`admin-nav-link ${location.pathname === '/admin/pets' ? 'active' : ''}`}>
                        🐾 Тварини
                    </Link>
                    <Link to="/admin/users" className={`admin-nav-link ${location.pathname === '/admin/users' ? 'active' : ''}`}>
                        👥 Користувачі
                    </Link>
                    <button onClick={handleLogout} className="logout-btn">
                        Вийти з панелі
                    </button>
                </nav>
            </header>

            <main className="admin-main">
                <Outlet />
            </main>
        </div>
    );
}

export default AdminLayout;