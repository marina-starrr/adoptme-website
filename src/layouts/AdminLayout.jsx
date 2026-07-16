import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import './AdminLayout.css';
import { useToast } from '../context/ToastContext';
import { supabase } from '../supabaseClient';

function AdminLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();

    const [newRequestsCount, setNewRequestsCount] = useState(0);
    const [newTreatmentCount, setNewTreatmentCount] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        if (location.pathname === '/admin' || location.pathname === '/admin/') {
            navigate('/admin/adoptions', { replace: true });
        }
    }, [location.pathname, navigate]);

    useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (location.state?.welcomeMsg) {
            showToast(location.state.welcomeMsg);
            window.history.replaceState({}, document.title);
        }
    }, [location, showToast]);

    useEffect(() => {
        // Підрахунок нових заявок на прихисток/волонтерство
        const fetchNewRequestsCount = async () => {
            try {
                const { count, error } = await supabase
                    .from('AdoptionRequests')
                    .select('*', { count: 'exact', head: true })
                    .eq('Status', 'Нова');

                if (!error) setNewRequestsCount(count || 0);
            } catch (err) {
                console.error("Помилка отримання кількості нових заявок:", err.message);
            }
        };

        // 👇 Підрахунок нових сповіщень про лікування
        const fetchNewTreatmentCount = async () => {
            try {
                const { count, error } = await supabase
                    .from('TreatmentNotifications')
                    .select('*', { count: 'exact', head: true })
                    .eq('Status', 'Нова');

                if (!error) setNewTreatmentCount(count || 0);
            } catch (err) {
                console.error("Помилка отримання кількості сповіщень:", err.message);
            }
        };

        fetchNewRequestsCount();
        fetchNewTreatmentCount();

        // Підписка на зміни в обох таблицях
        const subscriptionRequests = supabase
            .channel('public:AdoptionRequests')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'AdoptionRequests' }, fetchNewRequestsCount)
            .subscribe();

        const subscriptionTreatments = supabase
            .channel('public:TreatmentNotifications')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'TreatmentNotifications' }, fetchNewTreatmentCount)
            .subscribe();

        return () => {
            supabase.removeChannel(subscriptionRequests);
            supabase.removeChannel(subscriptionTreatments);
        };
    }, []);

    const handleLogout = async () => {
        await logout(); // signOut + очищення localStorage + подія cartUpdated
        navigate('/login', {
            state: { welcomeMsg: '🐾 Ви успішно вийшли з акаунту' }
        });
    };

    const closeMenu = () => setIsMenuOpen(false);

    return (
        <div className="admin-layout-container">
            <header className="admin-header">
                <div className="admin-logo-section">
                    <img src="/logo.png" alt="Logo" className="admin-logo" />
                    <h3 className="admin-title">Панель<br />Керування</h3>
                </div>

                <button
                    type="button"
                    className={`admin-menu-toggle ${isMenuOpen ? 'open' : ''}`}
                    onClick={() => setIsMenuOpen(prev => !prev)}
                    aria-label={isMenuOpen ? 'Закрити меню' : 'Відкрити меню'}
                    aria-expanded={isMenuOpen}
                >
                    <span className="admin-menu-bar" />
                    <span className="admin-menu-bar" />
                    <span className="admin-menu-bar" />
                </button>

                {isMenuOpen && (
                    <div className="admin-nav-overlay" onClick={closeMenu} aria-hidden="true" />
                )}

                <nav className={`admin-nav ${isMenuOpen ? 'open' : ''}`}>
                    {/* Заявки */}
                    <a
                        href="/admin/adoptions"
                        className={`admin-nav-link has-badge ${location.pathname === '/admin/adoptions' ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        Заявки
                        {newRequestsCount > 0 && (
                            <span className="admin-nav-badge">{newRequestsCount}</span>
                        )}
                    </a>

                    {/* Сповіщення */}
                    <a
                        href="/admin/notifications"
                        className={`admin-nav-link has-badge ${location.pathname === '/admin/notifications' ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        Сповіщення
                        {newTreatmentCount > 0 && (
                            <span className="admin-nav-badge">{newTreatmentCount}</span>
                        )}
                    </a>

                    {/* Відгуки */}
                    <a
                        href="/admin/reviews"
                        className={`admin-nav-link ${location.pathname === '/admin/reviews' ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        Відгуки
                    </a>

                    {/* Тварини */}
                    <a
                        href="/admin/pets"
                        className={`admin-nav-link ${location.pathname === '/admin/pets' ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        Тварини
                    </a>

                    {/* Користувачі */}
                    <a
                        href="/admin/users"
                        className={`admin-nav-link ${location.pathname === '/admin/users' ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        Користувачі
                    </a>

                    {/* Щасливчики */}
                    <a
                        href="/admin/happy-pets"
                        className={`admin-nav-link ${location.pathname === '/admin/happy-pets' ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        Щасливчики
                    </a>

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