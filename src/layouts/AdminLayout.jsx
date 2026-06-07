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
    const [newTreatmentCount, setNewTreatmentCount] = useState(0); // 👈 Новий стейт для сповіщень

    useEffect(() => {
        if (location.pathname === '/admin' || location.pathname === '/admin/') {
            navigate('/admin/adoptions', { replace: true });
        }
    }, [location.pathname, navigate]);

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
                    
                    {/* 👇 Додано бейдж для сповіщень */}
                    <Link to="/admin/notifications" className={`admin-nav-link ${location.pathname === '/admin/notifications' ? 'active' : ''}`} style={{ position: 'relative' }}>
                        Сповіщення
                        {newTreatmentCount > 0 && (
                            <span className="admin-nav-badge">
                                {newTreatmentCount}
                            </span>
                        )}
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