import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import './AdminHappyPets.css';
import { useToast } from '../../context/ToastContext';
import { AnimatePresence, motion } from 'framer-motion';

// 👇 Універсальний компонент випадаючого списку додано сюди
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
        <div className={`custom-dropdown-container ${disabled ? 'disabled' : ''}`} ref={dropdownRef} style={{ width: '100%', opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
            <div
                className={`custom-dropdown-header ${isOpen ? 'open' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{ padding: '12px 15px', border: isOpen ? '1px solid #6847DD' : '1px solid #d1d1e9', borderRadius: '10px', background: '#fff', fontSize: '15px', fontWeight: 'normal', color: '#333' }}
            >
                <span>{selectedOption ? selectedOption.label : <span style={{ color: '#999' }}>{placeholder}</span>}</span>
                <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
            </div>

            {isOpen && !disabled && (
                <div className="custom-dropdown-list-wrapper" style={{ position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0, zIndex: 1000, background: '#fff', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e0d4f5', padding: '5px', maxHeight: '250px', overflowY: 'auto' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {options.map((opt) => (
                            <li
                                key={opt.value}
                                style={{ padding: '10px 15px', cursor: 'pointer', borderRadius: '6px', background: value === opt.value ? '#f0edff' : 'transparent', color: value === opt.value ? '#6847DD' : '#333', fontWeight: value === opt.value ? 'bold' : 'normal' }}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#fcfbfe'}
                                onMouseLeave={(e) => e.target.style.background = value === opt.value ? '#f0edff' : 'transparent'}
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

function AdminHappyPets() {
    const [happyPets, setHappyPets] = useState([]);
    const [availablePets, setAvailablePets] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [petToDelete, setPetToDelete] = useState(null);
    const [isModalClosing, setIsModalClosing] = useState(false);

    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        petId: '',
        userId: '',
        ownerName: '',
        homeDescription: '',
        images: [],
        showInLucky: true
    });

    const [uploadingFiles, setUploadingFiles] = useState(false);

    useEffect(() => {
        fetchHappyPets();
        fetchAvailablePets();
        fetchAvailableUsers();
    }, []);

    const fetchHappyPets = async () => {
        const { data, error } = await supabase
            .from('Pets')
            .select('*')
            .eq('Status', 'Вже вдома')
            .order('Id', { ascending: false });

        if (!error && data) {
            setHappyPets(data);
        }
    };

    const fetchAvailablePets = async () => {
        const { data, error } = await supabase
            .from('Pets')
            .select('Id, Name, Status, Description, HomeDescription, Images, ImageName')
            .order('Id', { ascending: false });

        if (!error && data) {
            setAvailablePets(data);
        }
    };

    const fetchAvailableUsers = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, nickname')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setAvailableUsers(data);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePetChange = (selectedPetId) => {
        const chosenPet = availablePets.find(p => p.Id.toString() === selectedPetId);

        if (chosenPet) {
            setFormData((prev) => ({
                ...prev,
                petId: selectedPetId,
                images: chosenPet.Images || (chosenPet.ImageName ? [chosenPet.ImageName] : []),
                homeDescription: chosenPet.HomeDescription || "Ця тваринка вже знайшла свій дім і живе в щасті у новій люблячій родині!"
            }));
        } else {
            setFormData((prev) => ({ ...prev, petId: '', images: [], homeDescription: '' }));
        }
    };

    const handleUserChange = (selectedUserId) => {
        const selectedUser = availableUsers.find(u => u.id === selectedUserId);

        setFormData((prev) => ({
            ...prev,
            userId: selectedUserId,
            ownerName: selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}` : ''
        }));
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploadingFiles(true);
        const uploadedImages = [...formData.images];

        for (const file of files) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

            const { error } = await supabase.storage
                .from('pets')
                .upload(fileName, file);

            if (!error) {
                uploadedImages.push(fileName);
            } else {
                showToast('❌ Помилка завантаження фото: ' + error.message);
            }
        }

        setFormData((prev) => ({ ...prev, images: uploadedImages }));
        setUploadingFiles(false);
    };

    const removeImage = (indexToRemove) => {
        setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((_, index) => index !== indexToRemove)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.petId) {
            showToast('⚠️ Будь ласка, оберіть тваринку зі списку!');
            return;
        }

        setLoading(true);

        const petDataToUpdate = {
            OwnerUserId: formData.userId || null,
            OwnerName: formData.ownerName,
            HomeDescription: formData.homeDescription,
            Images: formData.images,
            ImageName: formData.images.length > 0 ? formData.images[0] : null,
            Status: 'Вже вдома',
            ShowInLucky: formData.showInLucky
        };

        const { error } = await supabase
            .from('Pets')
            .update(petDataToUpdate)
            .eq('Id', formData.petId);

        if (!error) {
            showToast('✅ Історію щасливчика успішно збережено!');
            resetForm();
            fetchHappyPets();
            fetchAvailablePets();
        } else {
            console.error("Помилка:", error);
            showToast(`❌ Помилка бази даних: ${error.message}`);
        }

        setLoading(false);
    };

    const editPet = (pet) => {
        setIsEditing(true);

        setFormData({
            petId: pet.Id.toString(),
            userId: pet.OwnerUserId || '',
            ownerName: pet.OwnerName || '',
            homeDescription: pet.HomeDescription || '',
            images: pet.Images || (pet.ImageName ? [pet.ImageName] : []),
            showInLucky: pet.ShowInLucky !== false
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const closeDeleteModal = () => {
        setIsModalClosing(true);
        setTimeout(() => {
            setPetToDelete(null);
            setIsModalClosing(false);
        }, 300);
    };

    const confirmDeleteClick = (id) => {
        setPetToDelete(id);
    };

    const deletePetHistory = async () => {
        if (!petToDelete) return;

        closeDeleteModal();

        try {
            const { error } = await supabase
                .from('Pets')
                .update({
                    Status: 'Шукає дім',
                    OwnerUserId: null,
                    OwnerName: null,
                    HomeDescription: null,
                    ShowInLucky: true
                })
                .eq('Id', petToDelete);

            if (!error) {
                showToast("🗑️ Історію видалено. Тваринка повернута в статус 'Шукає дім'.");
                setHappyPets(prev => prev.filter(p => p.Id !== petToDelete));
                fetchAvailablePets();
                resetForm();
            } else {
                throw error;
            }
        } catch (err) {
            console.error(err);
            showToast('❌ Помилка: ' + err.message);
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setFormData({ petId: '', userId: '', ownerName: '', homeDescription: '', images: [], showInLucky: true });
    };

    // Підготовка даних для CustomDropdown
    const petOptions = availablePets.map(pet => ({
        value: pet.Id.toString(),
        label: `${pet.Name} (${pet.Status})`
    }));

    const userOptions = availableUsers.map(user => ({
        value: user.id,
        label: `${user.first_name} ${user.last_name} (@${user.nickname})`
    }));

    return (
        <div className="admin-happy-pets admin-page-wrap">
            <h2 className="admin-page-title">
                <div className="admin-page-title-icon">🏡</div>
                Менеджер Щасливчиків
            </h2>

            {/* ФОРМА */}
            <div className="admin-card">
                <h3 style={{ marginTop: 0, color: '#49109f' }}>
                    {isEditing ? 'Редагувати історію' : 'Додати щасливчика (з існуючих тварин)'}
                </h3>

                <form onSubmit={handleSubmit} className="happy-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Оберіть тваринку:</label>
                            {/* 👇 Замінено на CustomDropdown */}
                            <CustomDropdown
                                options={petOptions}
                                value={formData.petId}
                                onChange={handlePetChange}
                                placeholder="-- Виберіть тваринку --"
                                disabled={isEditing}
                            />
                        </div>

                        <div className="form-group">
                            <label>Оберіть користувача (Нова сім'я):</label>
                            {/* 👇 Замінено на CustomDropdown */}
                            <CustomDropdown
                                options={userOptions}
                                value={formData.userId}
                                onChange={handleUserChange}
                                placeholder="-- Виберіть власника --"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Відгук / Історія успіху в родині:</label>
                        <textarea name="homeDescription" value={formData.homeDescription} onChange={handleInputChange} rows="3" required></textarea>
                    </div>

                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '15px 0' }}>
                        <input
                            type="checkbox"
                            id="showInLucky"
                            checked={formData.showInLucky}
                            onChange={(e) => setFormData(prev => ({ ...prev, showInLucky: e.target.checked }))}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#6847DD' }}
                        />
                        <label htmlFor="showInLucky" style={{ cursor: 'pointer', fontSize: '15px', color: '#333', fontWeight: '600', userSelect: 'none' }}>
                            🌟 Відображати в панелі "Щасливчики" на головній сторінці
                        </label>
                    </div>

                    <div className="form-group">
                        <label>Фотографії (можна декілька):</label>

                        {/* 👇 Кастомна кнопка замість стандартного input */}
                        <label className="custom-file-upload">
                            <span className="upload-icon">📷</span>
                            <span>{uploadingFiles ? 'Завантаження...' : 'Обрати фотографії'}</span>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileUpload}
                                disabled={uploadingFiles}
                                style={{ display: 'none' }}
                            />
                        </label>

                        <div className="image-preview-container">
                            {formData.images.map((imgName, index) => (
                                <div key={index} className="image-preview-box">
                                    <img src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${imgName}`} alt="preview" />
                                    <button type="button" onClick={() => removeImage(index)} className="remove-img-btn">✖</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="save-btn" disabled={loading}>
                            {loading ? 'Збереження...' : (isEditing ? 'Зберегти зміни' : 'Оновити статус на "Вже вдома"')}
                        </button>
                        {isEditing && (
                            <button type="button" className="cancel-btn" onClick={resetForm}>Скасувати</button>
                        )}
                    </div>
                </form>
            </div>

            {/* СПИСОК ЩАСЛИВЧИКІВ */}
            <div className="admin-card">
                <h3 style={{ marginTop: 0, color: '#49109f' }}>Список тваринок, що знайшли дім</h3>
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Фото</th>
                                <th>Тваринка</th>
                                <th>Нова сім'я</th>
                                <th>Відгук</th>
                                <th>Відображення</th>
                                <th>Дії</th>
                            </tr>
                        </thead>
                        <tbody>
                            {happyPets.map((pet) => {
                                const firstImg = (pet.Images && pet.Images.length > 0) ? pet.Images[0] : pet.ImageName;
                                const imgSrc = firstImg ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${firstImg}` : '/placeholder.png';

                                return (
                                    <tr key={pet.Id}>
                                        <td><img src={imgSrc} alt={pet.Name} className="table-img-preview" /></td>
                                        <td><strong>{pet.Name}</strong></td>
                                        <td>{pet.OwnerName || "Не вказано"}</td>
                                        <td><div className="text-truncate">{pet.HomeDescription}</div></td>
                                        <td>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                fontSize: '13px',
                                                fontWeight: 'bold',
                                                background: pet.ShowInLucky !== false ? '#e6fffa' : '#ffebeb',
                                                color: pet.ShowInLucky !== false ? '#00a389' : '#e53e3e',
                                                display: 'inline-block'
                                            }}>
                                                {pet.ShowInLucky !== false ? '👁️ Видно' : '🙈 Приховано'}
                                            </span>
                                        </td>
                                        <td>
                                            <button onClick={() => editPet(pet)} className="action-btn edit" title="Редагувати">✏️</button>
                                            <button onClick={() => confirmDeleteClick(pet.Id)} className="action-btn delete" title="Прибрати зі списку (Зробити 'Шукає дім')">🗑️</button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {happyPets.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Ще немає жодної історії.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ВІКНО ПІДТВЕРДЖЕННЯ ВИДАЛЕННЯ З ЧИСТИМ CSS */}
            {petToDelete && (
                <div
                    className={`modal-overlay ${isModalClosing ? 'closing' : ''}`}
                    onClick={closeDeleteModal}
                    style={{ zIndex: 10000 }}
                >
                    <div
                        className={`admin-modal confirm-modal ${isModalClosing ? 'closing' : ''}`}
                        style={{ maxWidth: '450px', textAlign: 'center' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 style={{ color: '#ef4444', fontSize: '24px', margin: '0 0 15px 0', fontWeight: '800', marginTop: 0 }}>⚠️ Прибрати історію?</h3>
                        <p style={{ color: '#555', fontSize: '16px', marginBottom: '30px', lineHeight: '1.6' }}>
                            Ви впевнені, що хочете видалити історію цієї тваринки зі списку щасливчиків?
                            Сама тваринка не видалиться, але її статус зміниться на "Шукає дім", а її домашня історія зітреться.
                        </p>
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                            <button className="cancel-btn" onClick={closeDeleteModal}>Скасувати</button>
                            <button
                                className="save-btn"
                                style={{ background: '#ef4444', boxShadow: '0 5px 15px rgba(239, 68, 68, 0.3)' }}
                                onClick={deletePetHistory}
                            >
                                Так, прибрати
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminHappyPets;