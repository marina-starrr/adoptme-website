import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import './AdminLayout.css'; 
import { useToast } from '../context/ToastContext'; // 👈 Глобальний контекст
import { supabase } from '../supabaseClient'; 

function AdminLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast(); // 👈 Дістаємо функцію
    
    const [newRequestsCount, setNewRequestsCount] = useState(0);

    useEffect(() => {
        if (location.pathname === '/admin' || location.pathname === '/admin/') {
            navigate('/admin/adoptions', { replace: true });
        }
    }, [location.pathname, navigate]);

    // 👇 Показуємо глобальний тост замість локального стейту
    useEffect(() => {
        if (location.state?.welcomeMsg) {
            showToast(location.state.welcomeMsg);
            window.history.replaceState({}, document.title);
        }
    }, [location, showToast]);

    useEffect(() => {
        const fetchNewRequestsCount = async () => {
            try {
                const { count, error } = await supabase
                    .from('AdoptionRequests')
                    .select('*', { count: 'exact', head: true })
                    .eq('Status', 'Нова');

                if (!error) {
                    setNewRequestsCount(count || 0);
                }
            } catch (err) {
                console.error("Помилка отримання кількості нових заявок:", err.message);
            }
        };

        fetchNewRequestsCount();

        const subscription = supabase
            .channel('public:AdoptionRequests')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'AdoptionRequests' }, fetchNewRequestsCount)
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const handleLogout = () => {
        const userNickname = localStorage.getItem('userNickname');
        const currentFavorites = localStorage.getItem('favorites');

        if (userNickname && currentFavorites) {
            localStorage.setItem(`favorites_${userNickname}`, currentFavorites);
        }

        localStorage.removeItem('favorites');
        localStorage.removeItem('userNickname');
        localStorage.removeItem('userRole');
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('cartUpdated'));

        logout();
        navigate('/login', {
            state: { welcomeMsg: '🐾 Ви успішно вийшли з акаунту' }
        });
    };

    return (
        <div className="admin-layout-container">
            {/* ❌ Видалено <div className="custom-toast">...</div> */}

            <header className="admin-header">
                <div className="admin-logo-section">
                    <img src="/logo.png" alt="Logo" className="admin-logo" />
                    <h3 className="admin-title">Панель Керування</h3>
                </div>

                <nav className="admin-nav">
                    <Link to="/admin/adoptions" className={`admin-nav-link ${location.pathname === '/admin/adoptions' ? 'active' : ''}`} style={{ position: 'relative' }}>
                        Заявки
                        {newRequestsCount > 0 && (
                            <span className="admin-nav-badge">
                                {newRequestsCount}
                            </span>
                        )}
                    </Link>
                    <Link to="/admin/notifications" className={`admin-nav-link ${location.pathname === '/admin/notifications' ? 'active' : ''}`}>
                        Сповіщення
                    </Link>
                    <Link to="/admin/reviews" className={`admin-nav-link ${location.pathname === '/admin/reviews' ? 'active' : ''}`}>
                        Відгуки
                    </Link>
                    <Link to="/admin/pets" className={`admin-nav-link ${location.pathname === '/admin/pets' ? 'active' : ''}`}>
                        Тварини
                    </Link>
                    <Link to="/admin/users" className={`admin-nav-link ${location.pathname === '/admin/users' ? 'active' : ''}`}>
                        Користувачі
                    </Link>
                    <Link to="/admin/happy-pets" className={`admin-nav-link ${location.pathname === '/admin/happy-pets' ? 'active' : ''}`}>
                        Щасливчики
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