import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../supabaseClient';
import './AdminUsers.css';
import { useToast } from '../../context/ToastContext';

function CustomDropdown({ options, value, onChange, placeholder, disabled }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className={`custom-dropdown-container ${disabled ? 'disabled' : ''}`} ref={dropdownRef}>
            <div
                className={`custom-dropdown-header ${isOpen ? 'open' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span>{selectedOption ? selectedOption.label : <span style={{ color: '#999' }}>{placeholder}</span>}</span>
                <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
            </div>

            {isOpen && !disabled && (
                <div className="custom-dropdown-list-wrapper">
                    <ul className="custom-dropdown-list">
                        {options.map((opt) => (
                            <li
                                key={opt.value}
                                className={`custom-dropdown-item ${value === opt.value ? 'selected' : ''}`}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                            >
                                {opt.label}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

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

    const initialFormState = {
        Nickname: '',
        FirstName: '',
        LastName: '',
        Phone: '',
        Email: '',
        Password: '',
        Role: 'user',
        SecretQuestion: 'Як звали вашого першого домашнього улюбленця?',
        SecretAnswer: ''
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

    const closeEditModal = () => {
        setIsModalClosing(true);
        setTimeout(() => {
            setIsModalOpen(false);
            setIsModalClosing(false);
            setShowPassword(false);
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
        setIsModalOpen(true);
    };

    const handleEditOpen = (user) => {
        setEditMode(true);
        setCurrentUserId(user.Id);

        let rawPhone = (user.Phone || '').replace(/\D/g, '');
        if (rawPhone.length > 0 && !rawPhone.startsWith('380')) rawPhone = '380' + rawPhone;

        let formattedPhone = '';
        if (rawPhone.length > 0) {
            formattedPhone = '+';
            if (rawPhone.length > 0) formattedPhone += rawPhone.substring(0, 2);
            if (rawPhone.length > 2) formattedPhone += '(' + rawPhone.substring(2, 5);
            if (rawPhone.length > 5) formattedPhone += ') ' + rawPhone.substring(5, 8);
            if (rawPhone.length > 8) formattedPhone += ' ' + rawPhone.substring(8, 10);
            if (rawPhone.length > 10) formattedPhone += ' ' + rawPhone.substring(10, 12);
        }

        setUserFormData({
            Nickname: user.Nickname || '',
            FirstName: user.FirstName || '',
            LastName: user.LastName || '',
            Phone: formattedPhone,
            Email: user.Email || '',
            Password: user.Password || '',
            Role: user.Role || 'user',
            SecretQuestion: user.SecretQuestion || 'Як звали вашого першого домашнього улюбленця?',
            SecretAnswer: user.SecretAnswer || ''
        });
        setIsModalOpen(true);
    };

    const handlePhoneChange = (e) => {
        const rawDigits = e.target.value.replace(/\D/g, '');
        if (rawDigits.length === 0) {
            setUserFormData({ ...userFormData, Phone: '' });
            return;
        }

        let digits = rawDigits;
        if (!digits.startsWith('380')) digits = '380' + digits;
        digits = digits.substring(0, 12);

        let formatted = '+';
        if (digits.length > 0) formatted += digits.substring(0, 2);
        if (digits.length > 2) formatted += '(' + digits.substring(2, 5);
        if (digits.length > 5) formatted += ') ' + digits.substring(5, 8);
        if (digits.length > 8) formatted += ' ' + digits.substring(8, 10);
        if (digits.length > 10) formatted += ' ' + digits.substring(10, 12);

        setUserFormData({ ...userFormData, Phone: formatted });
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const rawPhoneDigits = userFormData.Phone.replace(/\D/g, '');

        if (!userFormData.Nickname.trim()) {
            showToast('❌ Нікнейм обов’язковий!');
            setIsSaving(false); return;
        }
        if (!userFormData.FirstName.trim() || !userFormData.LastName.trim()) {
            showToast('❌ Будь ласка, вкажіть ім’я та прізвище!');
            setIsSaving(false); return;
        }
        if (!emailRegex.test(userFormData.Email)) {
            showToast('❌ Введіть коректний Email!');
            setIsSaving(false); return;
        }
        if (rawPhoneDigits.length !== 10) {
            showToast('❌ Введіть коректний номер телефону (10 цифр після +38)!');
            setIsSaving(false); return;
        }
        if (userFormData.Password.length < 6) {
            showToast('❌ Пароль має містити мінімум 6 символів!');
            setIsSaving(false); return;
        }
        if (!userFormData.SecretAnswer.trim()) {
            showToast('❌ Будь ласка, введіть відповідь на секретне запитання!');
            setIsSaving(false); return;
        }

        try {
            if (editMode && userFormData.Role === 'user') {
                const userBeingEdited = users.find(u => u.Id === currentUserId);
                if (userBeingEdited.Role === 'admin' && users.filter(u => u.Role === 'admin').length <= 1) {
                    showToast("❌ Не можна зняти права з єдиного адміністратора!");
                    setIsSaving(false);
                    return;
                }
            }

            const dataToSave = {
                ...userFormData,
                Phone: '38' + rawPhoneDigits,
                SecretAnswer: userFormData.SecretAnswer.trim().toLowerCase()
            };

            if (editMode) {
                const { error } = await supabase
                    .from('Users')
                    .update(dataToSave)
                    .eq('Id', currentUserId);

                if (error) throw error;
                showToast("✅ Дані користувача успішно оновлено!");
            } else {
                const { data: existingUser } = await supabase
                    .from('Users')
                    .select('Id')
                    .eq('Nickname', dataToSave.Nickname.trim())
                    .maybeSingle();

                if (existingUser) {
                    showToast("❌ Користувач з таким нікнеймом вже існує!");
                    setIsSaving(false);
                    return;
                }

                const { error } = await supabase
                    .from('Users')
                    .insert([dataToSave]);

                if (error) throw error;
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

    const confirmDeleteClick = (id) => {
        setUserToDelete(id);
    };

    const executeDelete = async () => {
        if (!userToDelete) return;
        try {
            const user = users.find(u => u.Id === userToDelete);
            if (user?.Role === 'admin' && users.filter(u => u.Role === 'admin').length <= 1) {
                showToast("❌ Не можна видалити єдиного адміністратора!");
                closeDeleteModal();
                return;
            }
            const { error } = await supabase.from('Users').delete().eq('Id', userToDelete);
            if (error) throw error;
            showToast("🗑️ Користувача успішно видалено!");
            setUsers(prev => prev.filter(u => u.Id !== userToDelete));
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
                                                    <div style={{ color: '#666', fontSize: '0.9rem' }}>{user.Phone ? `+${user.Phone}` : 'Не вказано'}</div>
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
                                                        <button className="edit-icon-btn" onClick={() => handleEditOpen(user)} title="Редагувати">✎</button>
                                                        <button className="delete-icon-btn" onClick={() => confirmDeleteClick(user.Id)} title="Видалити">×</button>
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
                                        value={userFormData.Nickname}
                                        onChange={e => setUserFormData({ ...userFormData, Nickname: e.target.value })}
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
                                        value={userFormData.Role}
                                        onChange={val => setUserFormData({ ...userFormData, Role: val })}
                                        placeholder="Оберіть роль"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="input-group">
                                    <label>Ім'я</label>
                                    <input
                                        type="text"
                                        value={userFormData.FirstName}
                                        onChange={e => setUserFormData({ ...userFormData, FirstName: e.target.value })}
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
                                        value={userFormData.LastName}
                                        onChange={e => setUserFormData({ ...userFormData, LastName: e.target.value })}
                                        className="form-control"
                                        placeholder="Іваненко"
                                        maxLength="30"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="input-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={userFormData.Email}
                                        onChange={e => setUserFormData({ ...userFormData, Email: e.target.value })}
                                        className="form-control"
                                        placeholder="vash@mail.com"
                                        maxLength="100"
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Телефон</label>
                                    <input
                                        type="tel"
                                        value={userFormData.Phone}
                                        onChange={handlePhoneChange}
                                        placeholder="+38(0__) ___ __ __"
                                        className="form-control"
                                        maxLength="19"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Пароль</label>
                                <div className="password-input-wrapper-admin">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={userFormData.Password}
                                        onChange={e => setUserFormData({ ...userFormData, Password: e.target.value })}
                                        className="form-control"
                                        placeholder="Створіть надійний пароль"
                                        maxLength="64"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password-admin"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? "🙉" : "🙈"}
                                    </button>
                                </div>
                            </div>

                            <div className="input-group" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <label style={{ color: '#49109f', marginBottom: '10px' }}>Секретне запитання</label>
                                <p>Для відновлення паролю</p>
                                <CustomDropdown
                                    options={[
                                        { value: 'Як звали вашого першого домашнього улюбленця?', label: 'Як звали вашого першого домашнього улюбленця?' },
                                        { value: 'Яка ваша улюблена порода собак/котів?', label: 'Яка ваша улюблена порода собак/котів?' },
                                        { value: 'Місто, у якому ви народилися?', label: 'Місто, у якому ви народилися?' },
                                        { value: 'Який ваш улюблений колір?', label: 'Який ваш улюблений колір?' }
                                    ]}
                                    value={userFormData.SecretQuestion}
                                    onChange={val => setUserFormData({ ...userFormData, SecretQuestion: val })}
                                    placeholder="Оберіть питання"
                                />
                                <input
                                    type="text"
                                    value={userFormData.SecretAnswer}
                                    onChange={e => setUserFormData({ ...userFormData, SecretAnswer: e.target.value })}
                                    className="form-control"
                                    required
                                    placeholder="Ваша відповідь..."
                                    maxLength="50"
                                    style={{ marginTop: '10px' }}
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={closeEditModal} disabled={isSaving}>Скасувати</button>
                                <button type="submit" className="save-btn" disabled={isSaving}>{isSaving ? 'Збереження...' : 'Зберегти користувача'}</button>
                            </div>
                        </form>
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