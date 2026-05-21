import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './AdminAdoptions.css';

function AdminAdoptions() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toastMsg, setToastMsg] = useState('');
    
    const [openDropdownId, setOpenDropdownId] = useState(null);

    // 🌟 Додали новий статус "Передано"
    const statuses = ['Нова', 'Розглядається', 'Схвалено', 'Передано', 'Відхилено'];

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
        const app = applications.find(a => a.Id === id);

        // 🌟 Тепер логіка передачі тваринки спрацьовує ТІЛЬКИ на статусі "Передано"
        if (newStatus === 'Передано' && app.Status !== 'Передано') {
            if (!window.confirm(`Тваринку фізично передано користувачу ${app.AdopterName}? Ця дія закріпить її за ним у базі.`)) {
                setOpenDropdownId(null);
                return; 
            }

            try {
                const { data: userData, error: userError } = await supabase
                    .from('Users')
                    .select('Id')
                    .eq('Nickname', app.UserNickname)
                    .single();

                if (userError || !userData) {
                    throw new Error("Користувача не знайдено в базі даних.");
                }

                const ownerId = userData.Id;

                const petIds = app.PetIds || [];
                if (petIds.length > 0) {
                    for (const petId of petIds) {
                        await supabase
                            .from('Pets')
                            .update({
                                Status: 'Вже вдома',
                                OwnerId: ownerId,
                                OwnerName: app.AdopterName
                            })
                            .eq('Id', petId);
                    }
                }

                showToast('🏡 Тваринку успішно закріплено за новим власником!');

            } catch (err) {
                showToast('❌ Помилка передачі тваринки: ' + err.message);
                setOpenDropdownId(null);
                return; 
            }
        }

        const { error } = await supabase
            .from('AdoptionRequests')
            .update({ Status: newStatus })
            .eq('Id', id);

        if (error) {
            showToast('❌ Помилка оновлення статусу: ' + error.message);
        } else {
            setApplications(applications.map(a => 
                a.Id === id ? { ...a, Status: newStatus } : a
            ));
            if (newStatus !== 'Передано') {
                showToast('✅ Статус заявки успішно оновлено!');
            }
        }
        
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
                            // 🌟 Додано клас status-handed для візуалізації
                            <div key={app.Id} className={`app-card-premium status-${app.Status === 'Нова' ? 'new' : app.Status === 'Розглядається' ? 'review' : app.Status === 'Схвалено' ? 'approved' : app.Status === 'Передано' ? 'handed' : 'rejected'}`}>
                                
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
                                            <span className="info-value">
                                                {app.AdopterName || 'Не вказано'} <span style={{ color: '#888', fontSize: '13px' }}>@{app.UserNickname}</span>
                                            </span> 
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
                                        
                                        <div className="custom-dropdown-container">
                                            <div 
                                                className={`custom-dropdown-header ${openDropdownId === app.Id ? 'open' : ''}`}
                                                onClick={() => toggleDropdown(app.Id)}
                                            >
                                                <span>{app.Status || 'Нова'}</span>
                                                <span className="dropdown-arrow">▼</span>
                                            </div>

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