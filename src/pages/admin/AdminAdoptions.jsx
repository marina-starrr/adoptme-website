import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import '../Adoptions.css'; // Підключаємо стилі з папки pages

function AdminAdoptions() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    const statuses = ['Нова', 'Розглядається', 'Схвалено', 'Відхилено'];

    useEffect(() => {
        fetchApplications();
    }, []);

    // Адмін завантажує ВСІ заявки
    async function fetchApplications() {
        setLoading(true);
        const { data, error } = await supabase
            .from('AdoptionRequests') // Перевір, щоб назва таблиці збігалася з тією, що в БД!
            .select('*')
            .order('id', { ascending: false }); 

        if (error) console.error('Помилка завантаження заявок:', error);
        else setApplications(data || []);
        setLoading(false);
    }

    const handleStatusChange = async (id, newStatus) => {
        const { error } = await supabase
            .from('AdoptionRequests')
            .update({ Status: newStatus })
            .eq('id', id);

        if (error) {
            alert('Помилка оновлення статусу: ' + error.message);
        } else {
            setApplications(applications.map(app => 
                app.id === id ? { ...app, Status: newStatus } : app
            ));
        }
    };

    const handleDeleteApplication = async (id) => {
        if (window.confirm('Ви впевнені, що хочете видалити цю заявку?')) {
            const { error } = await supabase
                .from('AdoptionRequests')
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

export default AdminAdoptions;