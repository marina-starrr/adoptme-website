import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './AdminAdoptions.css';
import { useToast } from '../../context/ToastContext'; // 👈 Глобальний контекст
import { AnimatePresence, motion } from 'framer-motion';

function AdminAdoptions() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [filterType, setFilterType] = useState('Всі'); 

    // 👇 Наше єдине красиве кастомне вікно підтвердження (замість window.confirm)
    const [confirmDialog, setConfirmDialog] = useState(null);

    const { showToast } = useToast(); // 👈 Підключаємо нашу магічну функцію

    const statuses = ['Нова', 'Розглядається', 'Схвалено', 'Передано', 'Відхилено'];

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

        // Допоміжна функція для фінального оновлення статусу самої заявки
        const updateRequestStatus = async (showSuccessMsg = true) => {
            const { error } = await supabase
                .from('AdoptionRequests')
                .update({ Status: newStatus, UserNotified: false })
                .eq('Id', id);

            if (error) {
                showToast('❌ Помилка оновлення статусу заявки: ' + error.message);
            } else {
                setApplications(prev => prev.map(a => a.Id === id ? { ...a, Status: newStatus } : a));
                if (showSuccessMsg) {
                    showToast('✅ Статус заявки успішно оновлено!');
                }
            }
            setOpenDropdownId(null);
        };

        // 1. ЛОГІКА ПРИЗНАЧЕННЯ СТАТУСУ "ПЕРЕДАНО"
        if (newStatus === 'Передано' && app.Status !== 'Передано') {
            if (app.PetName?.includes('Волонтерство')) {
                showToast('❌ Статус "Передано" не застосовується для волонтерів.');
                setOpenDropdownId(null);
                return;
            }

            // Викликаємо наше красиве вікно замість window.confirm
            setConfirmDialog({
                message: `Тваринку фізично передано користувачу ${app.AdopterName}? Ця дія закріпить її за ним у базі та додасть у Щасливчики.`,
                isDestructive: false,
                onConfirm: async () => {
                    setConfirmDialog(null);
                    try {
                        const { data: userData, error: userError } = await supabase
                            .from('Users')
                            .select('Id')
                            .eq('Nickname', app.UserNickname)
                            .single();

                        if (userError || !userData) throw new Error("Користувача не знайдено в базі даних.");

                        const ownerId = userData.Id;
                        const petIds = app.PetIds || [];
                        
                        if (petIds.length > 0) {
                            for (const petId of petIds) {
                                await supabase.from('Pets').update({
                                    Status: 'Вже вдома',
                                    OwnerId: ownerId,
                                    OwnerName: app.AdopterName,
                                    HomeDescription: "Ця тваринка вже знайшла свій дім і живе в щасті у новій люблячій родині!"
                                }).eq('Id', petId);

                                const { data: favUsers } = await supabase.from('Favorites').select('*').eq('PetId', petId);
                                const validFavUsers = favUsers ? favUsers.filter(fav => fav.UserNickname || fav.userNickname || fav.usernickname || fav.user_nickname) : [];

                                if (validFavUsers.length > 0) {
                                    const notificationsToInsert = validFavUsers
                                        .map(fav => {
                                            const nick = fav.UserNickname || fav.userNickname || fav.usernickname || fav.user_nickname;
                                            if (!nick || nick === app.UserNickname) return null;
                                            return {
                                                UserNickname: nick,
                                                PetId: petId,
                                                PetName: app.PetName.split(',')[0].trim(),
                                                NewStatus: 'Вже знайшла дім',
                                                IsRead: false
                                            };
                                        }).filter(n => n !== null);

                                    if (notificationsToInsert.length > 0) {
                                        await supabase.from('FavoriteNotifications').insert(notificationsToInsert);
                                    }
                                }
                            }
                        }
                        showToast('🏡 Тваринку успішно закріплено за новим власником!');
                        await updateRequestStatus(false);
                    } catch (err) {
                        showToast('❌ Помилка передачі тваринки: ' + err.message);
                        setOpenDropdownId(null);
                    }
                },
                onCancel: () => { setConfirmDialog(null); setOpenDropdownId(null); }
            });
            return;
        }

        // 2. СКАСУВАННЯ ПЕРЕДАЧІ
        if (app.Status === 'Передано' && newStatus !== 'Передано') {
            setConfirmDialog({
                message: `Ви дійсно хочете змінити статус? Тваринка повернеться до статусу "Шукає дім".`,
                isDestructive: true,
                onConfirm: async () => {
                    setConfirmDialog(null);
                    try {
                        const petIds = app.PetIds || [];
                        if (petIds.length > 0) {
                            for (const petId of petIds) {
                                await supabase.from('Pets').update({
                                    Status: 'Шукає дім',
                                    OwnerId: null,
                                    OwnerName: null,
                                    HomeDescription: null, 
                                    ShowInLucky: true  
                                }).eq('Id', petId);

                                const { data: favUsers } = await supabase.from('Favorites').select('*').eq('PetId', petId);
                                const validFavUsers = favUsers ? favUsers.filter(fav => fav.UserNickname || fav.userNickname || fav.usernickname || fav.user_nickname) : [];
                                if (validFavUsers.length > 0) {
                                    const notificationsToInsert = validFavUsers.map(fav => {
                                        const nick = fav.UserNickname || fav.userNickname || fav.usernickname || fav.user_nickname;
                                        return {
                                            UserNickname: nick,
                                            PetId: petId,
                                            PetName: app.PetName.split(',')[0].trim(),
                                            NewStatus: 'Шукає дім',
                                            IsRead: false
                                        };
                                    });
                                    await supabase.from('FavoriteNotifications').insert(notificationsToInsert);
                                }
                            }
                        }
                        showToast('🔙 Тваринку повернуто до статусу "Шукає дім"!');
                        await updateRequestStatus(false);
                    } catch (err) {
                        showToast('❌ Помилка скасування передачі: ' + err.message);
                        setOpenDropdownId(null);
                    }
                },
                onCancel: () => { setConfirmDialog(null); setOpenDropdownId(null); }
            });
            return;
        }

        // 3. БРОНЮВАННЯ (Схвалено)
        if (newStatus === 'Схвалено' && app.Status !== 'Схвалено') {
            if (!app.PetName?.includes('Волонтерство')) {
                try {
                    const petIds = app.PetIds || [];
                    if (petIds.length > 0) {
                        for (const petId of petIds) {
                            await supabase.from('Pets').update({ Status: 'Заброньована' }).eq('Id', petId);

                            const { data: favUsers } = await supabase.from('Favorites').select('*').eq('PetId', petId);
                            const validFavUsers = favUsers ? favUsers.filter(fav => {
                                const nick = fav.UserNickname || fav.userNickname || fav.usernickname || fav.user_nickname;
                                return nick && nick !== app.UserNickname;
                            }) : [];
                            
                            if (validFavUsers.length > 0) {
                                const notificationsToInsert = validFavUsers.map(fav => {
                                    const nick = fav.UserNickname || fav.userNickname || fav.usernickname || fav.user_nickname;
                                    return {
                                        UserNickname: nick,
                                        PetId: petId,
                                        PetName: app.PetName.split(',')[0].trim(),
                                        NewStatus: 'Заброньована',
                                        IsRead: false
                                    };
                                });
                                await supabase.from('FavoriteNotifications').insert(notificationsToInsert);
                            }
                        }
                    }
                    showToast('🔒 Тваринку автоматично заброньовано!');
                    await updateRequestStatus(false);
                    return;
                } catch (err) { console.error(err); }
            }
        }

        // 4. ЗНЯТТЯ БРОНІ
        if (app.Status === 'Схвалено' && newStatus !== 'Схвалено' && newStatus !== 'Передано') {
            if (!app.PetName?.includes('Волонтерство')) {
                try {
                    const petIds = app.PetIds || [];
                    if (petIds.length > 0) {
                        for (const petId of petIds) {
                            await supabase.from('Pets').update({ Status: 'Шукає дім' }).eq('Id', petId);
                            // ... логіка сповіщень
                        }
                    }
                    showToast('🔓 Бронь знято. Тваринка знову шукає дім.');
                    await updateRequestStatus(false);
                    return;
                } catch (err) { console.error(err); }
            }
        }

        // Всі інші статуси (розглядається, відхилено)
        await updateRequestStatus(true);
    };

    const handleDeleteApplication = (id) => {
        setConfirmDialog({
            message: 'Ви впевнені, що хочете назавжди видалити цю заявку?',
            isDestructive: true,
            onConfirm: async () => {
                setConfirmDialog(null);
                const { error } = await supabase.from('AdoptionRequests').delete().eq('Id', id);
                if (error) {
                    showToast('❌ Помилка видалення: ' + error.message);
                } else {
                    showToast('🗑️ Заявку успішно видалено!');
                    fetchApplications();
                }
            },
            onCancel: () => setConfirmDialog(null)
        });
    };

    const toggleDropdown = (id) => {
        setOpenDropdownId(openDropdownId === id ? null : id);
    };

    const filteredApplications = applications.filter(app => {
        const isVolunteer = app.PetName?.includes('Волонтерство'); 
        if (filterType === 'Всі') return true;
        if (filterType === 'Волонтерство') return isVolunteer;
        if (filterType === 'Прихисток') return !isVolunteer;
        return true;
    });

    if (loading) return <div className="admin-loader">Завантаження заявок...</div>;

    return (
        <div style={{ position: 'relative', maxWidth: '1240px', margin: '0 auto', width: '100%' }}>

            <div className="admin-card">
                <div className="admin-header-box">
                    <h2 className="admin-page-title">
                        <span className="admin-page-title-icon">📝</span>
                        Менеджер заявок
                    </h2>
                    <p style={{ color: '#666680', marginBottom: '20px' }}>
                        Керування запитами на прихисток тварин та волонтерство.
                    </p>
                </div>

                <div className="admin-filters">
                    <button className={`filter-btn ${filterType === 'Всі' ? 'active' : ''}`} onClick={() => setFilterType('Всі')}>Всі заявки</button>
                    <button className={`filter-btn ${filterType === 'Прихисток' ? 'active' : ''}`} onClick={() => setFilterType('Прихисток')}>🐾 Прихисток</button>
                    <button className={`filter-btn ${filterType === 'Волонтерство' ? 'active' : ''}`} onClick={() => setFilterType('Волонтерство')}>🤝 Волонтерство</button>
                </div>

                <div className="applications-list">
                    {filteredApplications.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">📭</span>
                            <p>Заявок в цій категорії поки немає</p>
                        </div>
                    ) : (
                        filteredApplications.map(app => {
                            const isVolunteer = app.PetName?.includes('Волонтерство');
                            
                            let displayPetName = app.PetName;
                            if (isVolunteer) {
                                const match = app.PetName.match(/\((.*?)\)/);
                                displayPetName = match ? match[1] : 'Будь-який хвостик';
                            } else {
                                displayPetName = app.PetName.split(',')[0].trim();
                            }

                            return (
                                <div key={app.Id} className={`app-card-premium status-${app.Status === 'Нова' ? 'new' : app.Status === 'Розглядається' ? 'review' : app.Status === 'Схвалено' ? 'approved' : app.Status === 'Передано' ? 'handed' : 'rejected'} ${isVolunteer ? 'type-volunteer' : 'type-adoption'}`}>
                                    <div className="app-card-header">
                                        <div className="app-id-badge">
                                            {isVolunteer ? '🤝 Волонтерство' : '🐾 Прихисток'} #{app.Id}
                                        </div>
                                        <div className="status-badge">{app.Status}</div>
                                    </div>

                                    <div className="app-card-body">
                                        <div className="app-info-grid">
                                            <div className="info-item">
                                                <span className="info-label">{isVolunteer ? '🐾 Бажана тваринка:' : '🐾 Тваринка:'}</span>
                                                <span className="info-value highlight">{displayPetName}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">👤 Заявник:</span>
                                                <span className="info-value">
                                                    {app.AdopterName || 'Не вказано'} 
                                                    {app.UserNickname && <span style={{ color: '#888', fontSize: '13px' }}> @{app.UserNickname}</span>}
                                                </span> 
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">📞 Телефон:</span>
                                                <a href={`tel:${app.AdopterPhone}`} className="info-value link">{app.AdopterPhone}</a>
                                            </div>
                                            {!isVolunteer && (
                                                <div className="info-item">
                                                    <span className="info-label">🏠 Умови:</span>
                                                    <span className="info-value">{app.LivingConditions}</span>
                                                </div>
                                            )}
                                        </div>

                                        {!isVolunteer && (
                                            <div className="badges-row">
                                                <span className={`trait-badge ${app.HasExperience ? 'positive' : 'negative'}`}>{app.HasExperience ? '✅ Є досвід' : '❌ Без досвіду'}</span>
                                                <span className={`trait-badge ${app.HasOtherPets ? 'positive' : 'negative'}`}>{app.HasOtherPets ? '✅ Інші тварини' : '❌ Немає інших тварин'}</span>
                                            </div>
                                        )}

                                        {app.Reason && (
                                            <div className="app-comment-box" style={isVolunteer ? { borderLeftColor: '#10b981', backgroundColor: '#ecfdf5' } : {}}>
                                                <span className="comment-label">{isVolunteer ? 'Деталі допомоги:' : 'Коментар:'}</span>
                                                <p style={{ whiteSpace: 'pre-line' }}>{app.Reason}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="app-card-footer">
                                        <div className="status-control">
                                            <label>Змінити статус:</label>
                                            <div className="custom-dropdown-container">
                                                <div className={`custom-dropdown-header ${openDropdownId === app.Id ? 'open' : ''}`} onClick={() => toggleDropdown(app.Id)}>
                                                    <span>{app.Status || 'Нова'}</span>
                                                    <span className="dropdown-arrow">▼</span>
                                                </div>
                                                {openDropdownId === app.Id && (
                                                    <ul className="custom-dropdown-list">
                                                        {statuses.map(s => (
                                                            (isVolunteer && s === 'Передано') ? null : (
                                                                <li key={s} className={`custom-dropdown-item ${app.Status === s ? 'selected' : ''}`} onClick={() => handleStatusChange(app.Id, s)}>
                                                                    {s}
                                                                </li>
                                                            )
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
                            );
                        })
                    )}
                </div>
            </div>

            {/* 👇 НАШЕ КРАСИВЕ ВІКНО ПІДТВЕРДЖЕННЯ З АНІМАЦІЄЮ */}
            <AnimatePresence>
                {confirmDialog && (
                    <motion.div 
                        className="modal-overlay" 
                        onClick={confirmDialog.onCancel}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <motion.div 
                            className="admin-modal confirm-modal" 
                            onClick={e => e.stopPropagation()}
                            /* Анімація появи з центру (scale) */
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        >
                            <h3 className="confirm-title">
                                {confirmDialog.isDestructive ? '⚠️ Увага' : '🐾 Підтвердження'}
                            </h3>
                            <p className="confirm-text">{confirmDialog.message}</p>
                            <div className="confirm-buttons">
                                <button className="cancel-btn" onClick={confirmDialog.onCancel}>Скасувати</button>
                                <button 
                                    className={confirmDialog.isDestructive ? "delete-confirm-btn" : "save-btn"} 
                                    onClick={confirmDialog.onConfirm}
                                >
                                    Підтвердити
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default AdminAdoptions;