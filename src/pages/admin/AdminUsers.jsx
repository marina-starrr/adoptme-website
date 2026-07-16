import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../supabaseClient';
import CustomDropdown from '../../components/CustomDropdown';
import './AdminUsers.css';
import { useToast } from '../../context/ToastContext';

// Виклик Edge Function admin-users із розбором помилки
async function callAdminFn(body) {
    const { data, error } = await supabase.functions.invoke('admin-users', { body });
    if (error) {
        let msg = error.message;
        try {
            const parsed = await error.context.json();
            if (parsed?.error) msg = parsed.error;
        } catch { /* ignore */ }
        throw new Error(msg);
    }
    if (data?.error) throw new Error(data.error);
    return data;
}

const formatPhone = (raw) => {
    let digits = (raw || '').replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (!digits.startsWith('380')) digits = '380' + digits;
    digits = digits.substring(0, 12);
    let formatted = '+';
    if (digits.length > 0) formatted += digits.substring(0, 2);
    if (digits.length > 2) formatted += '(' + digits.substring(2, 5);
    if (digits.length > 5) formatted += ') ' + digits.substring(5, 8);
    if (digits.length > 8) formatted += ' ' + digits.substring(8, 10);
    if (digits.length > 10) formatted += ' ' + digits.substring(10, 12);
    return formatted;
};

function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const [userToDelete, setUserToDelete] = useState(null);
    const [isModalClosing, setIsModalClosing] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const initialFormState = {
        nickname: '',
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        password: '',
        role: 'user'
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
                .from('profiles')
                .select('id, nickname, first_name, last_name, phone, role, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            showToast("❌ Помилка завантаження користувачів: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    const closeEditModal = () => {
        setIsModalClosing(true);
        setTimeout(() => {
            setIsModalOpen(false);
            setIsModalClosing(false);
            setShowPassword(false);
            setShowNewPassword(false);
            setNewPassword('');
        }, 300);
    };

    const closeDeleteModal = () => {
        setIsModalClosing(true);
        setTimeout(() => {
            setUserToDelete(null);
            setIsModalClosing(false);
        }, 300);
    };

    const handleAddOpen = () => {
        setEditMode(false);
        setUserFormData(initialFormState);
        setNewPassword('');
        setIsModalOpen(true);
    };

    const handleEditOpen = (user) => {
        setEditMode(true);
        setCurrentUserId(user.id);
        setNewPassword('');
        setUserFormData({
            nickname: user.nickname || '',
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            phone: formatPhone(user.phone),
            email: '',
            password: '',
            role: user.role || 'user'
        });
        setIsModalOpen(true);
    };

    const handlePhoneChange = (e) => {
        setUserFormData({ ...userFormData, phone: formatPhone(e.target.value) });
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        const rawPhoneDigits = userFormData.phone.replace(/\D/g, '');

        if (!userFormData.first_name.trim() || !userFormData.last_name.trim()) {
            showToast('❌ Будь ласка, вкажіть ім’я та прізвище!');
            setIsSaving(false); return;
        }
        if (rawPhoneDigits.length !== 12) {
            showToast('❌ Введіть коректний номер телефону (10 цифр після +38)!');
            setIsSaving(false); return;
        }

        try {
            if (editMode) {
                // Не дозволяємо зняти права з єдиного адміністратора
                if (userFormData.role === 'user') {
                    const editing = users.find(u => u.id === currentUserId);
                    if (editing?.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1) {
                        showToast("❌ Не можна зняти права з єдиного адміністратора!");
                        setIsSaving(false);
                        return;
                    }
                }

                const { error } = await supabase
                    .from('profiles')
                    .update({
                        first_name: userFormData.first_name.trim(),
                        last_name: userFormData.last_name.trim(),
                        phone: rawPhoneDigits,
                        role: userFormData.role
                    })
                    .eq('id', currentUserId);

                if (error) throw error;
                showToast("✅ Дані користувача успішно оновлено!");
            } else {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!userFormData.nickname.trim()) {
                    showToast('❌ Нікнейм обов’язковий!'); setIsSaving(false); return;
                }
                if (!emailRegex.test(userFormData.email)) {
                    showToast('❌ Введіть коректний Email!'); setIsSaving(false); return;
                }
                if (userFormData.password.length < 6) {
                    showToast('❌ Пароль має містити мінімум 6 символів!'); setIsSaving(false); return;
                }

                await callAdminFn({
                    action: 'create',
                    nickname: userFormData.nickname.trim(),
                    email: userFormData.email.trim(),
                    password: userFormData.password,
                    first_name: userFormData.first_name.trim(),
                    last_name: userFormData.last_name.trim(),
                    phone: rawPhoneDigits,
                    role: userFormData.role
                });
                showToast("🎉 Нового користувача успішно створено!");
            }

            closeEditModal();
            fetchUsers();
        } catch (error) {
            showToast("❌ Помилка: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetPassword = async () => {
        if (newPassword.length < 6) {
            showToast('❌ Новий пароль має містити мінімум 6 символів!');
            return;
        }
        setIsResetting(true);
        try {
            await callAdminFn({ action: 'set_password', userId: currentUserId, password: newPassword });
            showToast('🔑 Пароль користувача змінено!');
            setNewPassword('');
        } catch (err) {
            showToast('❌ Помилка зміни паролю: ' + err.message);
        } finally {
            setIsResetting(false);
        }
    };

    const confirmDeleteClick = (id) => {
        setUserToDelete(id);
    };

    const executeDelete = async () => {
        if (!userToDelete) return;
        try {
            const user = users.find(u => u.id === userToDelete);
            if (user?.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1) {
                showToast("❌ Не можна видалити єдиного адміністратора!");
                closeDeleteModal();
                return;
            }

            // Видалення через захищений RPC (перевіряє is_admin на сервері)
            const { error } = await supabase.rpc('admin_delete_user', { target: userToDelete });
            if (error) throw error;

            showToast("🗑️ Користувача успішно видалено!");
            setUsers(prev => prev.filter(u => u.id !== userToDelete));
            closeDeleteModal();
        } catch (err) {
            showToast("❌ Помилка видалення: " + err.message);
        }
    };

    return (
        <div className="admin-page-wrap">
            <div className="admin-page-layout">
                <div className="admin-content-area" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="admin-card">
                        <div className="admin-header-box admin-header-row">
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
                                            <th>Телефон</th>
                                            <th>Роль</th>
                                            <th style={{ textAlign: 'center' }}>Дії</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user.id}>
                                                <td>
                                                    <div className="user-info-cell">
                                                        <div className="user-avatar-placeholder">
                                                            {user.first_name ? user.first_name.charAt(0).toUpperCase() : '👤'}
                                                        </div>
                                                        <div>
                                                            <strong>{user.first_name} {user.last_name}</strong>
                                                            <div className="user-nickname">@{user.nickname}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ color: '#666', fontSize: '0.9rem' }}>{user.phone ? `+${user.phone}` : 'Не вказано'}</div>
                                                </td>
                                                <td>
                                                    <span className={`user-role-badge ${user.role === 'admin' ? 'role-admin' : 'role-user'}`}>
                                                        {user.role === 'admin' ? 'Адмін' : 'Користувач'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="admin-table-actions">
                                                        <button className="edit-icon-btn" onClick={() => handleEditOpen(user)} title="Редагувати">✎</button>
                                                        <button className="delete-icon-btn" onClick={() => confirmDeleteClick(user.id)} title="Видалити">×</button>
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

            {isModalOpen && createPortal(
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
                                        value={userFormData.nickname}
                                        onChange={e => setUserFormData({ ...userFormData, nickname: e.target.value })}
                                        className="form-control"
                                        placeholder="Наприклад: @ivan"
                                        maxLength="20"
                                        required
                                        disabled={editMode}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Роль в системі</label>
                                    <CustomDropdown
                                        options={[{ value: 'user', label: 'Користувач' }, { value: 'admin', label: 'Адміністратор' }]}
                                        value={userFormData.role}
                                        onChange={val => setUserFormData({ ...userFormData, role: val })}
                                        placeholder="Оберіть роль"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="input-group">
                                    <label>Ім'я</label>
                                    <input
                                        type="text"
                                        value={userFormData.first_name}
                                        onChange={e => setUserFormData({ ...userFormData, first_name: e.target.value })}
                                        className="form-control"
                                        placeholder="Іван"
                                        maxLength="30"
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Прізвище</label>
                                    <input
                                        type="text"
                                        value={userFormData.last_name}
                                        onChange={e => setUserFormData({ ...userFormData, last_name: e.target.value })}
                                        className="form-control"
                                        placeholder="Іваненко"
                                        maxLength="30"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Телефон</label>
                                <input
                                    type="tel"
                                    value={userFormData.phone}
                                    onChange={handlePhoneChange}
                                    placeholder="+38(0__) ___ __ __"
                                    className="form-control"
                                    maxLength="19"
                                    required
                                />
                            </div>

                            {/* Email і пароль — лише при СТВОРЕННІ (для наявних керує Supabase Auth) */}
                            {!editMode && (
                                <>
                                    <div className="input-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            value={userFormData.email}
                                            onChange={e => setUserFormData({ ...userFormData, email: e.target.value })}
                                            className="form-control"
                                            placeholder="vash@mail.com"
                                            maxLength="100"
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Пароль</label>
                                        <div className="password-input-wrapper-admin">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={userFormData.password}
                                                onChange={e => setUserFormData({ ...userFormData, password: e.target.value })}
                                                className="form-control"
                                                placeholder="Мінімум 6 символів"
                                                maxLength="64"
                                                required
                                            />
                                            <button type="button" className="toggle-password-admin" onClick={() => setShowPassword(!showPassword)}>
                                                {showPassword ? "🙉" : "🙈"}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={closeEditModal} disabled={isSaving}>Скасувати</button>
                                <button type="submit" className="save-btn" disabled={isSaving}>{isSaving ? 'Збереження...' : 'Зберегти користувача'}</button>
                            </div>
                        </form>

                        {/* Скидання паролю — лише при редагуванні наявного користувача */}
                        {editMode && (
                            <div className="input-group" style={{ marginTop: '10px', background: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <label style={{ color: '#49109f', marginBottom: '10px' }}>🔑 Скинути пароль</label>
                                <div className="password-input-wrapper-admin">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        className="form-control"
                                        placeholder="Новий пароль (мінімум 6 символів)"
                                        maxLength="64"
                                    />
                                    <button type="button" className="toggle-password-admin" onClick={() => setShowNewPassword(!showNewPassword)}>
                                        {showNewPassword ? "🙉" : "🙈"}
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    className="save-btn"
                                    style={{ marginTop: '10px' }}
                                    onClick={handleResetPassword}
                                    disabled={isResetting || newPassword.length < 6}
                                >
                                    {isResetting ? 'Змінюємо...' : 'Змінити пароль'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}

            {userToDelete && createPortal(
                <div className={`modal-overlay ${isModalClosing ? 'closing' : ''}`} onClick={closeDeleteModal}>
                    <div className={`admin-modal confirm-modal ${isModalClosing ? 'closing' : ''}`} style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ color: '#ef4444', fontSize: '24px', marginBottom: '10px', marginTop: 0 }}>⚠️ Видалення</h3>
                        <p style={{ color: '#555', fontSize: '16px', marginBottom: '30px', lineHeight: '1.5' }}>
                            Ви дійсно хочете назавжди видалити цього користувача? Цю дію неможливо скасувати.
                        </p>
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                            <button className="cancel-btn" onClick={closeDeleteModal}>Скасувати</button>
                            <button
                                className="save-btn"
                                style={{ background: '#ef4444', boxShadow: '0 5px 15px rgba(239, 68, 68, 0.3)' }}
                                onClick={executeDelete}
                            >
                                Так, видалити
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

        </div>
    );
}

export default AdminUsers;
