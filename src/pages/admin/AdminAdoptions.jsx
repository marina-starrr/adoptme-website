import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './AdminAdoptions.css';

function AdminAdoptions() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toastMsg, setToastMsg] = useState('');
    
    // 👇 НОВИЙ СТАН: запам'ятовуємо, який саме список зараз відкритий
    const [openDropdownId, setOpenDropdownId] = useState(null);

    const statuses = ['Нова', 'Розглядається', 'Схвалено', 'Відхилено'];

    const showToast = (message) => {
        setToastMsg(message);
        setTimeout(() => setToastMsg(''), 3500);
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    async function fetchApplications() {
        setLoading(true);
        const { data, error } = await supabase
            .from('AdoptionRequests')
            .select('*')
            .order('Id', { ascending: false });

        if (error) {
            showToast('❌ Помилка завантаження заявок: ' + error.message);
        } else {
            setApplications(data || []);
        }
        setLoading(false);
    }

    const handleStatusChange = async (id, newStatus) => {
        const { error } = await supabase
            .from('AdoptionRequests')
            .update({ Status: newStatus })
            .eq('Id', id);

        if (error) {
            showToast('❌ Помилка оновлення статусу: ' + error.message);
        } else {
            setApplications(applications.map(app => 
                app.Id === id ? { ...app, Status: newStatus } : app
            ));
        }
        // Закриваємо список після вибору
        setOpenDropdownId(null);
    };

    const handleDeleteApplication = async (id) => {
        if (window.confirm('Ви впевнені, що хочете видалити цю заявку?')) {
            const { error } = await supabase
                .from('AdoptionRequests')
                .delete()
                .eq('Id', id);

            if (error) {
                showToast('❌ Помилка видалення: ' + error.message);
            } else {
                showToast('🗑️ Заявку успішно видалено!');
                fetchApplications();
            }
        }
    };

    // Функція для відкриття/закриття меню
    const toggleDropdown = (id) => {
        setOpenDropdownId(openDropdownId === id ? null : id);
    };

    if (loading) return <div className="admin-loader">Завантаження заявок...</div>;

    return (
        <div className="admin-main" style={{ position: 'relative' }}>
            
            {toastMsg && (
                <div className="custom-toast">
                    {toastMsg}
                </div>
            )}

            <div className="admin-card">
                
                <div className="admin-header-box">
                    <h2 className="admin-page-title">
                        <span className="admin-page-title-icon">📝</span>
                        Менеджер заявок
                    </h2>
                    <p style={{ color: '#666680', marginBottom: '30px' }}>
                        Керування запитами на прихисток тварин від користувачів.
                    </p>
                </div>

                <div className="applications-list">
                    {applications.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">📭</span>
                            <p>Заявок поки немає</p>
                        </div>
                    ) : (
                        applications.map(app => (
                            <div key={app.Id} className={`app-card-premium status-${app.Status === 'Нова' ? 'new' : app.Status === 'Розглядається' ? 'review' : app.Status === 'Схвалено' ? 'approved' : 'rejected'}`}>
                                
                                <div className="app-card-header">
                                    <div className="app-id-badge">Заявка #{app.Id}</div>
                                    <div className="status-badge">{app.Status}</div>
                                </div>

                                <div className="app-card-body">
                                    <div className="app-info-grid">
                                        <div className="info-item">
                                            <span className="info-label">🐾 Тваринка:</span>
                                            <span className="info-value highlight">{app.PetName}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">👤 Заявник:</span>
                                            <span className="info-value">{app.AdopterName || 'Не вказано'}</span> 
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">📞 Телефон:</span>
                                            <a href={`tel:${app.AdopterPhone}`} className="info-value link">{app.AdopterPhone}</a>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">🏠 Умови:</span>
                                            <span className="info-value">{app.LivingConditions}</span>
                                        </div>
                                    </div>

                                    <div className="badges-row">
                                        <span className={`trait-badge ${app.HasExperience ? 'positive' : 'negative'}`}>
                                            {app.HasExperience ? '✅ Є досвід' : '❌ Без досвіду'}
                                        </span>
                                        <span className={`trait-badge ${app.HasOtherPets ? 'positive' : 'negative'}`}>
                                            {app.HasOtherPets ? '✅ Інші тварини' : '❌ Немає інших тварин'}
                                        </span>
                                    </div>

                                    {app.Reason && (
                                        <div className="app-comment-box">
                                            <span className="comment-label">Коментар:</span>
                                            <p>{app.Reason}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="app-card-footer">
                                    <div className="status-control">
                                        <label>Змінити статус:</label>
                                        
                                        {/* 👇 ОСЬ НАШ НОВИЙ КАСТОМНИЙ ВИПАДАЮЧИЙ СПИСОК */}
                                        <div className="custom-dropdown-container">
                                            
                                            {/* Кнопка (Header) списку */}
                                            <div 
                                                className={`custom-dropdown-header ${openDropdownId === app.Id ? 'open' : ''}`}
                                                onClick={() => toggleDropdown(app.Id)}
                                            >
                                                <span>{app.Status || 'Нова'}</span>
                                                <span className="dropdown-arrow">▼</span>
                                            </div>

                                            {/* Саме меню, яке випадає */}
                                            {openDropdownId === app.Id && (
                                                <ul className="custom-dropdown-list">
                                                    {statuses.map(s => (
                                                        <li 
                                                            key={s} 
                                                            className={`custom-dropdown-item ${app.Status === s ? 'selected' : ''}`}
                                                            onClick={() => handleStatusChange(app.Id, s)}
                                                        >
                                                            {s}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>

                                    </div>
                                    
                                    <button className="delete-app-btn" onClick={() => handleDeleteApplication(app.Id)} title="Видалити">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    </button>
                                </div>

                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminAdoptions;