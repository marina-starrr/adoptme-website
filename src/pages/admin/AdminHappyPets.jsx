import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './AdminHappyPets.css';
import { useToast } from '../../context/ToastContext';

function AdminHappyPets() {
    const [happyPets, setHappyPets] = useState([]);
    const [availablePets, setAvailablePets] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Стейт для форми
    const [formData, setFormData] = useState({
        petId: '',
        userId: '',
        ownerName: '', 
        description: '',
        images: [],
        showInLucky: true // 👈 ДОДАНО ДЕФОЛТНИЙ СТАН ДЛЯ ГАЛОЧКИ
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
            .select('Id, Name, Status')
            .order('Id', { ascending: false });

        if (!error && data) {
            setAvailablePets(data);
        }
    };

    const fetchAvailableUsers = async () => {
        const { data, error } = await supabase
            .from('Users')
            .select('Id, FirstName, LastName, Nickname')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setAvailableUsers(data);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleUserChange = (e) => {
        const selectedUserId = e.target.value;
        const selectedUser = availableUsers.find(u => u.Id.toString() === selectedUserId);
        
        setFormData((prev) => ({
            ...prev,
            userId: selectedUserId,
            ownerName: selectedUser ? `${selectedUser.FirstName} ${selectedUser.LastName}` : ''
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
                alert('Помилка завантаження фото: ' + error.message);
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
            alert('Будь ласка, оберіть тваринку зі списку!');
            return;
        }

        setLoading(true);

        const petDataToUpdate = {
            OwnerName: formData.ownerName,
            Description: formData.description,
            Images: formData.images,
            ImageName: formData.images.length > 0 ? formData.images[0] : null,
            Status: 'Вже вдома',
            ShowInLucky: formData.showInLucky // 👈 ДОДАНО: відправляємо стан галочки до БД
        };

        const { error } = await supabase
            .from('Pets')
            .update(petDataToUpdate)
            .eq('Id', formData.petId);

        if (!error) {
            alert('Історію щасливчика успішно збережено!');
            resetForm();
            fetchHappyPets();
            fetchAvailablePets(); 
        } else {
            console.error("Помилка:", error);
            alert(`Помилка бази даних: ${error.message}`);
        }
        
        setLoading(false);
    };

    const editPet = (pet) => {
        setIsEditing(true);
        const matchedUser = availableUsers.find(u => `${u.FirstName} ${u.LastName}` === pet.OwnerName);

        setFormData({
            petId: pet.Id.toString(),
            userId: matchedUser ? matchedUser.Id.toString() : '',
            ownerName: pet.OwnerName || '',
            description: pet.Description || '',
            images: pet.Images || (pet.ImageName ? [pet.ImageName] : []),
            showInLucky: pet.ShowInLucky !== false // 👈 ДОДАНО: підтягуємо значення при редагуванні
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const deletePetHistory = async (id) => {
        if (window.confirm('Ви впевнені, що хочете видалити історію? (Сама тваринка не видалиться, але її статус зміниться на "Шукає дім")')) {
            const { error } = await supabase
                .from('Pets')
                .update({ Status: 'Шукає дім', OwnerName: null, Description: null, ShowInLucky: true })
                .eq('Id', id);
            
            if (!error) {
                fetchHappyPets();
                fetchAvailablePets();
            }
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setFormData({ petId: '', userId: '', ownerName: '', description: '', images: [], showInLucky: true });
    };

    return (
        <div className="admin-happy-pets">
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
                            <select 
                                name="petId" 
                                value={formData.petId} 
                                onChange={handleInputChange} 
                                required
                                disabled={isEditing}
                            >
                                <option value="">-- Виберіть тваринку --</option>
                                {availablePets.map(pet => (
                                    <option key={pet.Id} value={pet.Id}>
                                        {pet.Name} ({pet.Status})
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>Оберіть користувача (Нова сім'я):</label>
                            <select 
                                name="userId" 
                                value={formData.userId} 
                                onChange={handleUserChange} 
                                required
                            >
                                <option value="">-- Виберіть власника --</option>
                                {availableUsers.map(user => (
                                    <option key={user.Id} value={user.Id}>
                                        {user.FirstName} {user.LastName} (@{user.Nickname})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Відгук / Історія:</label>
                        <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" required></textarea>
                    </div>

                    {/* 👇 НОВИЙ БЛОК ЧЕКБОКСУ У ФОРМІ АДМІНА */}
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
                        <input type="file" multiple accept="image/*" onChange={handleFileUpload} disabled={uploadingFiles} />
                        {uploadingFiles && <span className="upload-status">Завантаження... ⏳</span>}

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
                                <th>Відображення</th> {/* 👈 ДОДАНО КОЛОНКУ */}
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
                                        <td><div className="text-truncate">{pet.Description}</div></td>
                                        {/* 👇 НОВА СТИЛІЗОВАНА ЯЧЕЙКА СТАТУСУ ВИДІМОСТІ */}
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
                                            <button onClick={() => deletePetHistory(pet.Id)} className="action-btn delete" title="Прибрати зі списку (Зробити 'Шукає дім')">🗑️</button>
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
        </div>
    );
}

export default AdminHappyPets;