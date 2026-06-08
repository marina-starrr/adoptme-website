import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../context/ToastContext';
import './AdminNotifications.css';

function AdminNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Стейт для модального вікна підтвердження видалення
    const [confirmDialog, setConfirmDialog] = useState(null);
    // Стейт для керування плавною анімацією закриття
    const [isModalClosing, setIsModalClosing] = useState(false);

    const { showToast } = useToast();

    useEffect(() => {
        fetchNotifications();
    }, []);

    async function fetchNotifications() {
        setLoading(true);
        const { data, error } = await supabase
            .from('TreatmentNotifications')
            .select('*')
            .order('CreatedAt', { ascending: false });
            
        if (error) {
            showToast('❌ Помилка завантаження сповіщень: ' + error.message);
        } else {
            setNotifications(data || []);
        }
        setLoading(false);
    }

    // Універсальна функція для плавного закриття модалки
    const closeConfirmDialog = () => {
        setIsModalClosing(true);
        setTimeout(() => {
            setConfirmDialog(null);
            setIsModalClosing(false);
        }, 300); // Чекаємо 300мс, поки відіграє CSS-анімація
    };

    const handleStatusChange = async (id, currentStatus) => {
        const nextStatus = currentStatus === 'Нова' ? 'Оброблена' : 'Нова';
        const { error } = await supabase
            .from('TreatmentNotifications')
            .update({ Status: nextStatus })
            .eq('Id', id);

        if (!error) {
            setNotifications(prev => prev.map(n => n.Id === id ? { ...n, Status: nextStatus } : n));
            showToast(`✅ Статус змінено на "${nextStatus}"`);
        } else {
            showToast('❌ Помилка зміни статусу: ' + error.message);
        }
    };

    const handleDeleteClick = (id) => {
        setConfirmDialog({
            message: 'Ви дійсно хочете назавжди видалити це сповіщення? Цю дію неможливо скасувати.',
            isDestructive: true,
            onConfirm: async () => {
                closeConfirmDialog(); // Плавно закриваємо
                const { error } = await supabase.from('TreatmentNotifications').delete().eq('Id', id);
                
                if (!error) {
                    setNotifications(prev => prev.filter(n => n.Id !== id));
                    showToast('🗑️ Сповіщення успішно видалено!');
                } else {
                    showToast('❌ Помилка видалення: ' + error.message);
                }
            },
            onCancel: closeConfirmDialog
        });
    };

    if (loading) return <h2 className="loading-message">Завантаження сповіщень... 🐾</h2>;

    return (
        <div className="admin-page-wrap">
            <div className="admin-card">
                <h2 className="admin-page-title">
                    <div className="admin-page-title-icon">🔔</div>
                    Запити на сповіщення про одужання
                </h2>

                <div className="admin-table-container">
                    {notifications.length === 0 ? (
                        <p className="admin-notifications-empty">Сповіщень поки немає.</p>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Дата</th>
                                    <th>Тваринка</th>
                                    <th>Користувач</th>
                                    <th>Email</th>
                                    <th>Статус</th>
                                    <th>Дії</th>
                                </tr>
                            </thead>
                            <tbody>
                                {notifications.map(n => (
                                    <tr key={n.Id}>
                                        <td>{new Date(n.CreatedAt).toLocaleDateString('uk-UA')}</td>
                                        <td><strong>{n.PetName}</strong> (ID: {n.PetId})</td>
                                        <td>@{n.UserNickname}</td>
                                        <td>{n.UserEmail || 'Не вказано'}</td>
                                        <td>
                                            <span className={`pet-tag ${n.Status === 'Нова' ? 'status-special' : 'status-home'}`} style={{fontSize: '13px', padding: '4px 10px'}}>
                                                {n.Status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="admin-notifications-actions">
                                                <button
                                                    type="button"
                                                    onClick={() => handleStatusChange(n.Id, n.Status)}
                                                    className="btn-notify-action process"
                                                >
                                                    {n.Status === 'Нова' ? '✓ Оброблено' : '↩ Відновити'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteClick(n.Id)}
                                                    className="btn-notify-action delete"
                                                    title="Видалити"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* НАШЕ КРАСИВЕ ВІКНО ПІДТВЕРДЖЕННЯ З АНІМАЦІЄЮ */}
            {confirmDialog && (
                <div className={`modal-overlay ${isModalClosing ? 'closing' : ''}`} onClick={closeConfirmDialog} style={{ zIndex: 10000 }}>
                    <div className={`admin-modal confirm-modal ${isModalClosing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
                        <h3 className="confirm-title">
                            {confirmDialog.isDestructive ? '⚠️ Видалення' : '🐾 Підтвердження'}
                        </h3>
                        <p className="confirm-text">{confirmDialog.message}</p>
                        <div className="confirm-buttons">
                            <button className="cancel-btn" onClick={closeConfirmDialog}>Скасувати</button>
                            <button 
                                className={confirmDialog.isDestructive ? "delete-confirm-btn" : "save-btn"} 
                                onClick={confirmDialog.onConfirm}
                            >
                                Так, видалити
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminNotifications;