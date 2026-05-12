import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import './Adoptions.css';

function Adoptions() {
    const { isAdmin } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    // Доступні статуси для вибору
    const statuses = ['Нова', 'Розглядається', 'Схвалено', 'Відхилено'];

    useEffect(() => {
        fetchApplications();
    }, []);

    async function fetchApplications() {
        setLoading(true);
        const { data, error } = await supabase
            .from('Adoptions')
            .select('*')
            .order('id', { ascending: false }); // Сортування: найновіші зверху

        if (error) console.error('Помилка завантаження заявок:', error);
        else setApplications(data || []);
        setLoading(false);
    }

    // Функція для зміни статусу в базі даних
    const handleStatusChange = async (id, newStatus) => {
        const { error } = await supabase
            .from('Adoptions')
            .update({ Status: newStatus })
            .eq('id', id);

        if (error) {
            alert('Помилка оновлення статусу: ' + error.message);
        } else {
            // Оновлюємо локальний стейт, щоб не перевантажувати всю сторінку
            setApplications(applications.map(app => 
                app.id === id ? { ...app, Status: newStatus } : app
            ));
        }
    };

    // Функція для видалення заявки
    const handleDeleteApplication = async (id) => {
        if (window.confirm('Ви впевнені, що хочете видалити цю заявку?')) {
            const { error } = await supabase
                .from('Adoptions')
                .delete()
                .eq('id', id);

            if (!error) fetchApplications();
        }
    };

    if (loading) return <div className="admin-loader">Завантаження заявок...</div>;

    return (
        <div className="admin-page page-transition">
            <div className="admin-header-simple">
                <h2>Менеджер заявок 📝</h2>
                <p>Керування запитами на прихисток тварин</p>
            </div>

            <div className="applications-list">
                {applications.length === 0 ? (
                    <p className="empty-msg">Заявок поки немає</p>
                ) : (
                    applications.map(app => (
                        <div key={app.id} className={`app-card-premium status-${app.Status}`}>
                            <div className="app-card-side">
                                <span className="app-id">#{app.id}</span>
                                <div className={`status-badge ${app.Status}`}>{app.Status}</div>
                            </div>

                            <div className="app-card-main">
                                <div className="app-row">
                                    <div className="app-info-group">
                                        <label>Тваринка:</label>
                                        <span className="pet-target">{app.PetName}</span>
                                    </div>
                                    <div className="app-info-group">
                                        <label>Заявник:</label>
                                        <span>{app.FirstName} {app.LastName}</span>
                                    </div>
                                </div>

                                <div className="app-row">
                                    <div className="app-info-group">
                                        <label>Телефон:</label>
                                        <a href={`tel:${app.AdopterPhone}`}>{app.AdopterPhone}</a>
                                    </div>
                                    <div className="app-info-group">
                                        <label>Умови:</label>
                                        <span>{app.LivingConditions}</span>
                                    </div>
                                </div>

                                <div className="badges-row-simple">
                                    <span className={`badge-mini ${app.HasExperience ? 'yes' : 'no'}`}>
                                        Досвід: {app.HasExperience ? '✅' : '❌'}
                                    </span>
                                    <span className={`badge-mini ${app.HasOtherPets ? 'yes' : 'no'}`}>
                                        Інші тварини: {app.HasOtherPets ? '✅' : '❌'}
                                    </span>
                                </div>

                                {app.Reason && (
                                    <div className="app-comment">
                                        <label>Коментар користувача:</label>
                                        <p>{app.Reason}</p>
                                    </div>
                                )}

                                <div className="app-actions-row">
                                    <div className="status-selector">
                                        <label>Встановити статус:</label>
                                        <select 
                                            value={app.Status || 'Нова'} 
                                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                        >
                                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <button className="delete-app-btn" onClick={() => handleDeleteApplication(app.id)}>
                                        Видалити заявку
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Adoptions;