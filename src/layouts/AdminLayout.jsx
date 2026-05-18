import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

function AdminLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation(); // 👈 Додали для ловлі повідомлення

    const [toastMsg, setToastMsg] = useState('');

    // Ефект, який перевіряє, чи прийшли ми сюди зі сторінки логіну
    useEffect(() => {
        if (location.state?.welcomeMsg) {
            setToastMsg(location.state.welcomeMsg);

            // Ховаємо через 3.5 секунди
            const timer = setTimeout(() => {
                setToastMsg('');
            }, 3500);

            // Очищаємо історію, щоб при F5 повідомлення не вискакувало знову
            window.history.replaceState({}, document.title);

            return () => clearTimeout(timer);
        }
    }, [location]);

    const handleLogout = () => {
        logout();
        navigate('/login'); // 👈 Тепер перекидатиме на сторінку входу!
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f4f4f9', position: 'relative' }}>

            {/* 🔴 НАШЕ КРАСИВЕ СПЛИВАЮЧЕ ПОВІДОМЛЕННЯ (TOAST) */}
            {toastMsg && (
                <div className="custom-toast">
                    {toastMsg}
                </div>
            )}

            {/* ШАПКА АДМІНІСТРАТОРА */}
            <header style={{
                background: '#4A148C',
                padding: '15px 5%',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <img src="/logo.png" alt="Logo" style={{ height: '40px' }} />
                    <h3 style={{ margin: 0, borderLeft: '2px solid rgba(255,255,255,0.3)', paddingLeft: '15px' }}>
                        Панель Керування
                    </h3>
                </div>

                <nav style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
                    <Link to="/admin/pets" style={{ color: 'white', textDecoration: 'none', fontWeight: '500', fontSize: '16px' }}>
                        🐾 Тварини
                    </Link>
                    <Link to="/admin/adoptions" style={{ color: 'white', textDecoration: 'none', fontWeight: '500', fontSize: '16px' }}>
                        📝 Заявки
                    </Link>
                    <button
                        onClick={handleLogout}
                        style={{
                            background: '#ff4d4d',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            marginLeft: '20px'
                        }}
                    >
                        Вийти з панелі
                    </button>
                </nav>
            </header>

            <main style={{ flex: 1, padding: '30px 5%' }}>
                <Outlet />
            </main>

        </div>
    );
}

export default AdminLayout;