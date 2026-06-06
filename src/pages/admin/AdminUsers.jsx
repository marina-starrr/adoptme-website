import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './AdminUsers.css';
import { useToast } from '../../context/ToastContext';

function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const [userToDelete, setUserToDelete] = useState(null);
    const [toastMsg, setToastMsg] = useState('');

    // 👇 ДОДАНО: Стан для керування плавною анімацією закриття
    const [isModalClosing, setIsModalClosing] = useState(false);

    const initialFormState = {
        Nickname: '',
        FirstName: '',
        LastName: '',
        Phone: '',
        Email: '',
        Password: '',
        Role: 'user'
    };

    const [userFormData, setUserFormData] = useState(initialFormState);

    const { showToast } = useToast();

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('Users')
                .select('*')
                .order('created_at', { ascending: false }); 
            
            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            showToast("❌ Помилка завантаження користувачів: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    // 👇 ДОДАНО: Функції для плавного закриття модалок
    const closeEditModal = () => {
        setIsModalClosing(true);
        setTimeout(() => {
            setIsModalOpen(false);
            setIsModalClosing(false);
        }, 300);
    };

    const closeDeleteModal = () => {
        setIsModalClosing(true);
        setTimeout(() => {
            setUserToDelete(null);
            setIsModalClosing(false);
        }, 300);
    };

    // --- ЛОГІКА ДОДАВАННЯ / РЕДАГУВАННЯ ---
    const handleAddOpen = () => {
        setEditMode(false);
        setUserFormData(initialFormState);
        setIsModalOpen(true);
    };

    const handleEditOpen = (user) => {
        setEditMode(true);
        setCurrentUserId(user.Id);
        setUserFormData({
            Nickname: user.Nickname || '',
            FirstName: user.FirstName || '',
            LastName: user.LastName || '',
            Phone: user.Phone || '',
            Email: user.Email || '',
            Password: user.Password || '',
            Role: user.Role || 'user'
        });
        setIsModalOpen(true);
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // Захист: не можна зняти адмінку з останнього адміністратора
            if (editMode && userFormData.Role === 'user') {
                const userBeingEdited = users.find(u => u.Id === currentUserId);
                if (userBeingEdited.Role === 'admin' && users.filter(u => u.Role === 'admin').length <= 1) {
                    showToast("❌ Не можна зняти права з єдиного адміністратора!");
                    setIsSaving(false);
                    return;
                }
            }

            if (editMode) {
                // ОНОВЛЕННЯ
                const { error } = await supabase
                    .from('Users')
                    .update(userFormData)
                    .eq('Id', currentUserId);
                
                if (error) throw error;
                showToast("✅ Дані користувача успішно оновлено!");
            } else {
                // СТВОРЕННЯ
                // 1. Перевіряємо чи є вже такий нікнейм
                const { data: existingUser } = await supabase
                    .from('Users')
                    .select('Id')
                    .eq('Nickname', userFormData.Nickname.trim())
                    .maybeSingle();

                if (existingUser) {
                    showToast("❌ Користувач з таким нікнеймом вже існує!");
                    setIsSaving(false);
                    return;
                }

                // 2. Зберігаємо нового
                const { error } = await supabase
                    .from('Users')
                    .insert([userFormData]);
                
                if (error) throw error;
                showToast("🎉 Нового користувача успішно створено!");
            }

            closeEditModal(); // 👈 Плавне закриття після успішного збереження
            fetchUsers();
        } catch (error) {
            showToast("❌ Помилка: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // --- ЛОГІКА ВИДАЛЕННЯ ---
    const confirmDeleteClick = (id) => {
        setUserToDelete(id);
    };

    const executeDelete = async () => {
        if (!userToDelete) return;
        
        closeDeleteModal(); // 👈 Плавно закриваємо модалку перед початком видалення
        
        try {
            const user = users.find(u => u.Id === userToDelete);
            if (user?.Role === 'admin' && users.filter(u => u.Role === 'admin').length <= 1) {
                showToast("❌ Не можна видалити єдиного адміністратора!");
                return;
            }

            const { error } = await supabase.from('Users').delete().eq('Id', userToDelete);
            if (error) throw error;

            showToast("🗑️ Користувача успішно видалено!");
            
            // 👇 Локальне оновлення замість fetchUsers(), щоб уникнути блимання
            setUsers(prev => prev.filter(u => u.Id !== userToDelete));
        } catch (err) {
            showToast("❌ Помилка видалення: " + err.message);
        }
    };

    return (
        <div className="admin-main" style={{ position: 'relative' }}>
            {toastMsg && <div className="custom-toast" style={{ zIndex: 100000 }}>{toastMsg}</div>}

            <div className="admin-page-layout">
                <div className="admin-content-area" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="admin-card">
                        
                        <div className="admin-header-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h2 className="admin-page-title">
                                    <span className="admin-page-title-icon">👥</span> База користувачів
                                </h2>
                                <p style={{ color: '#666680', marginTop: '-15px', marginBottom: '20px' }}>
                                    Керування акаунтами, ролями та доступом до системи.
                                </p>
                            </div>
                            <button className="add-new-btn" onClick={handleAddOpen}>
                                + Додати користувача
                            </button>
                        </div>

                        {loading ? (
                            <h3 style={{ textAlign: 'center', color: '#4A148C', padding: '40px' }}>Завантаження... 🐾</h3>
                        ) : users.length === 0 ? (
                            <div className="empty-state-box">
                                <p>У системі поки немає зареєстрованих користувачів.</p>
                            </div>
                        ) : (
                            <div className="admin-table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Користувач</th>
                                            <th>Контакти</th>
                                            <th>Роль</th>
                                            <th>Пароль</th>
                                            <th style={{ textAlign: 'center' }}>Дії</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user.Id}>
                                                <td>
                                                    <div className="user-info-cell">
                                                        <div className="user-avatar-placeholder">
                                                            {user.FirstName ? user.FirstName.charAt(0).toUpperCase() : '👤'}
                                                        </div>
                                                        <div>
                                                            <strong>{user.FirstName} {user.LastName}</strong>
                                                            <div className="user-nickname">@{user.Nickname}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ color: '#333', fontWeight: '500' }}>{user.Email}</div>
                                                    <div style={{ color: '#666', fontSize: '0.9rem' }}>{user.Phone || 'Не вказано'}</div>
                                                </td>
                                                <td>
                                                    <span className={`user-role-badge ${user.Role === 'admin' ? 'role-admin' : 'role-user'}`}>
                                                        {user.Role === 'admin' ? 'Адмін' : 'Користувач'}
                                                    </span>
                                                </td>
                                                <td style={{ color: '#888', fontSize: '0.9rem' }}>
                                                    {user.Password ? '••••••••' : '—'}
                                                </td>
                                                <td>
                                                    <div className="admin-table-actions">
                                                        <button 
                                                            className="edit-icon-btn" 
                                                            onClick={() => handleEditOpen(user)}
                                                            title="Редагувати користувача"
                                                        >
                                                            ✎
                                                        </button>
                                                        <button 
                                                            className="delete-icon-btn" 
                                                            onClick={() => confirmDeleteClick(user.Id)}
                                                            title="Видалити користувача"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 👇 МОДАЛЬНЕ ВІКНО ДОДАВАННЯ/РЕДАГУВАННЯ (З АНІМАЦІЄЮ) */}
            {isModalOpen && (
                <div className={`modal-overlay ${isModalClosing ? 'closing' : ''}`} onClick={() => !isSaving && closeEditModal()}>
                    <div className={`admin-modal ${isModalClosing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editMode ? "Редагування користувача" : "Новий користувач"}</h3>
                            <button className="close-x" onClick={closeEditModal} title="Закрити">×</button>
                        </div>

                        <form onSubmit={handleSaveUser} className="admin-form">
                            <div className="form-row">
                                <div className="input-group">
                                    <label>Нікнейм (Логін)</label>
                                    <input 
                                        type="text" 
                                        value={userFormData.Nickname} 
                                        onChange={e => setUserFormData({ ...userFormData, Nickname: e.target.value })} 
                                        className="form-control" 
                                        required 
                                        disabled={editMode} // Забороняємо змінювати нікнейм при редагуванні
                                        title={editMode ? "Нікнейм не можна змінити, оскільки до нього прив'язані дані" : ""}
                                        style={editMode ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Роль в системі</label>
                                    <select 
                                        value={userFormData.Role} 
                                        onChange={e => setUserFormData({ ...userFormData, Role: e.target.value })} 
                                        className="form-control"
                                    >
                                        <option value="user">Користувач</option>
                                        <option value="admin">Адміністратор</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="input-group">
                                    <label>Ім'я</label>
                                    <input type="text" value={userFormData.FirstName} onChange={e => setUserFormData({ ...userFormData, FirstName: e.target.value })} className="form-control" required />
                                </div>
                                <div className="input-group">
                                    <label>Прізвище</label>
                                    <input type="text" value={userFormData.LastName} onChange={e => setUserFormData({ ...userFormData, LastName: e.target.value })} className="form-control" required />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="input-group">
                                    <label>Email</label>
                                    <input type="email" value={userFormData.Email} onChange={e => setUserFormData({ ...userFormData, Email: e.target.value })} className="form-control" required />
                                </div>
                                <div className="input-group">
                                    <label>Телефон</label>
                                    <input type="tel" value={userFormData.Phone} onChange={e => setUserFormData({ ...userFormData, Phone: e.target.value })} className="form-control" required />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Пароль</label>
                                <input 
                                    type="text" 
                                    value={userFormData.Password} 
                                    onChange={e => setUserFormData({ ...userFormData, Password: e.target.value })} 
                                    className="form-control" 
                                    required 
                                    placeholder="Введіть пароль..."
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={closeEditModal} disabled={isSaving}>Скасувати</button>
                                <button type="submit" className="save-btn" disabled={isSaving}>
                                    {isSaving ? 'Збереження...' : 'Зберегти користувача'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 👇 ВІКНО ПІДТВЕРДЖЕННЯ ВИДАЛЕННЯ (З АНІМАЦІЄЮ) */}
            {userToDelete && (
                <div className={`modal-overlay ${isModalClosing ? 'closing' : ''}`} onClick={closeDeleteModal}>
                    <div className={`admin-modal confirm-modal ${isModalClosing ? 'closing' : ''}`} style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ color: '#ef4444', fontSize: '24px', margin: '0 0 10px 0' }}>⚠️ Видалення користувача</h3>
                        <p style={{ color: '#555', fontSize: '16px', marginBottom: '30px' }}>
                            Ви дійсно хочете назавжди видалити цей акаунт? Цю дію неможливо скасувати.
                        </p>
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                            <button className="cancel-btn" onClick={closeDeleteModal}>Скасувати</button>
                            <button className="save-btn" style={{ background: '#ef4444', boxShadow: '0 5px 15px rgba(239, 68, 68, 0.3)' }} onClick={executeDelete}>
                                Так, видалити
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminUsers;