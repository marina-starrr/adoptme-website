import { useParams, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import BackgroundPaws from '../components/BackgroundPaws';
import { useAuth } from '../context/AuthContext';
import './PetDetails.css'; 

function PetDetails() {
  const { id } = useParams();
  const location = useLocation();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);

  // Стейти для inline-редагування та фото
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null); 

  const { userRole, userEmail } = useAuth();
  const isAdminPath = location.pathname.includes('/admin/');

  useEffect(() => {
    async function fetchPet() {
      setLoading(true);
      const { data, error } = await supabase
        .from('Pets')
        .select('*')
        .eq('Id', id)
        .single();

      if (error) {
        console.error("Помилка при завантаженні тваринки:", error.message);
      } else {
        setPet(data);
      }
      setLoading(false);
    }
    fetchPet();
  }, [id]);

  const handleEditToggle = () => {
    setEditFormData(pet);
    setSelectedFile(null); 
    setIsEditing(true);
  };

  const handleChange = (field, value) => {
    setEditFormData({ ...editFormData, [field]: value });
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error } = await supabase.storage.from('pets').upload(fileName, file);
    if (error) throw error;
    return fileName;
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      let finalData = { ...editFormData };

      if (selectedFile) {
        const newFileName = await uploadImage(selectedFile);
        finalData.ImageName = newFileName;
      }

      const { error } = await supabase
        .from('Pets')
        .update(finalData)
        .eq('Id', pet.Id);

      if (error) throw error;

      setPet(finalData); 
      setIsEditing(false);
      setSelectedFile(null);
    } catch (err) {
      alert("❌ Помилка збереження: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdoptClick = async () => {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const isAlreadyFav = favorites.some(fav => fav.id === pet.Id);

    if (!isAlreadyFav) {
      if (userEmail) {
        await supabase.from('Favorites').insert([{ UserEmail: userEmail, PetId: pet.Id }]);
      }
      favorites.push({ id: pet.Id, name: pet.Name, image: imageUrl });
      localStorage.setItem('favorites', JSON.stringify(favorites));
      window.dispatchEvent(new Event('cartUpdated'));
    }
    window.dispatchEvent(new Event('openFavorites'));
  };

  // Функція конфігурації стилів для бейджів
  const getStatusConfig = (petStatus) => {
    switch(petStatus) {
        case 'Потребує особливого догляду': return { class: 'status-special', icon: '❤️‍🩹' };
        case 'На лікуванні': return { class: 'status-treatment', icon: '💊' };
        case 'Вже вдома': return { class: 'status-home', icon: '🏡' };
        case 'Не вдалось врятувати': return { class: 'status-rainbow', icon: '🌈' };
        default: return { class: 'status-looking', icon: '🐾' }; 
    }
  };

  if (loading) return <h2 className="loading-message">Шукаємо пухнастика... 🐾</h2>;
  if (!pet) return <h2 className="loading-message">Тваринку не знайдено 🐾</h2>;

  const imageUrl = selectedFile 
    ? URL.createObjectURL(selectedFile) 
    : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${pet.ImageName}`;

  const currentStatus = isEditing ? editFormData.Status : pet.Status;
  const statusConfig = getStatusConfig(currentStatus || "Шукає дім");

  return (
    <div className="page-transition">
      <div className={`pet-details-layout ${isAdminPath ? 'admin-mode' : ''}`}>
        {!isAdminPath && <BackgroundPaws customClass="details-paws" />}

        <div className="pet-details-container">
          <Link to={isAdminPath ? "/admin/pets" : "/pets"} className="back-link">
            ← Назад до списку
          </Link>

          <div className="pet-details-content">
            
            {/* БЛОК ФОТО */}
            <div className="pet-image-wrapper">
              <img src={imageUrl} alt={pet.Name} className="pet-image" />
              
              {/* 🌟 ПОЗНАЧКА СТАТУСУ ПОВЕРХ ВЕЛИКОГО ФОТО (Присутня у UserPetCard.css) */}
              <div className={`pet-status-badge ${statusConfig.class}`} style={{ top: '20px', bottom: 'auto', left: '20px' }}>
                {statusConfig.icon} {currentStatus || "Шукає дім"}
              </div>

              {isEditing && (
                <label className="file-overlay-label">
                  📷 Змінити фото
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setSelectedFile(e.target.files[0])} 
                    style={{ display: 'none' }} 
                  />
                </label>
              )}
            </div>

            <div className="pet-info-wrapper">
              
              {/* ІМ'Я */}
              {isEditing ? (
                <div className="editable-container">
                  <input value={editFormData.Name} onChange={e => handleChange('Name', e.target.value)} className="inline-input input-name" />
                  <span className="edit-icon-hint">✏️</span>
                </div>
              ) : (
                <h1 className="input-name" style={{ margin: 0, padding: '4px 0' }}>{pet.Name}</h1>
              )}
              
              <div className="pet-meta-block">
                {/* ВІК */}
                <div className="pet-meta-item">
                  <strong>Вік:&nbsp;</strong>
                  {isEditing ? (
                    <div className="editable-container" style={{ marginLeft: '10px' }}>
                      <input value={editFormData.Age} onChange={e => handleChange('Age', e.target.value)} className="inline-input input-info" />
                      <span className="edit-icon-hint" style={{ right: '5px' }}>✏️</span>
                    </div>
                  ) : (
                    <span>{pet.Age}</span>
                  )}
                </div>

                {/* СТАТЬ */}
                <div className="pet-meta-item">
                  <strong>Стать:&nbsp;</strong>
                  {isEditing ? (
                    <div className="editable-container" style={{ marginLeft: '10px' }}>
                      <select value={editFormData.Gender} onChange={e => handleChange('Gender', e.target.value)} className="inline-input input-info">
                        <option>Хлопчик</option>
                        <option>Дівчинка</option>
                      </select>
                      <span className="edit-icon-hint" style={{ right: '5px' }}>✏️</span>
                    </div>
                  ) : (
                    <span>{pet.Gender}</span>
                  )}
                </div>

                {/* 🌟 РЕДАГУВАННЯ СТАТУСУ ДЛЯ АДМІНА НА СТОРІНЦІ ДЕТАЛЕЙ */}
                {isEditing && (
                  <div className="pet-meta-item" style={{ marginTop: '15px', borderTop: '1px dashed #e0d4f5', paddingTop: '15px' }}>
                    <strong>Позначка:&nbsp;</strong>
                    <div className="editable-container" style={{ marginLeft: '10px' }}>
                      <select value={editFormData.Status || 'Шукає дім'} onChange={e => handleChange('Status', e.target.value)} className="inline-input input-info">
                        <option value="Шукає дім">Шукає дім</option>
                        <option value="Потребує особливого догляду">Потребує особливого догляду</option>
                        <option value="На лікуванні">На лікуванні</option>
                        <option value="Вже вдома">Вже вдома</option>
                        <option value="Не вдалось врятувати">Не вдалось врятувати</option>
                      </select>
                      <span className="edit-icon-hint" style={{ right: '5px' }}>✏️</span>
                    </div>
                  </div>
                )}
              </div>

              {/* ТЕГИ */}
              <div className="pet-tags-block">
                {isEditing ? (
                  <div className="editable-container">
                    <input 
                      value={editFormData.Tags} 
                      onChange={e => handleChange('Tags', e.target.value)} 
                      className="inline-input input-tags" 
                      placeholder="Введіть теги через пробіл або кому..."
                    />
                    <span className="edit-icon-hint">➕</span>
                  </div>
                ) : (
                  <div className="tags-list">
                    {pet.Tags && pet.Tags.split(/[#, ]+/).filter(t => t).map(tag => (
                      <span key={tag} className="pet-tag">
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* ОПИС */}
              <div className="pet-desc-block">
                {isEditing ? (
                  <div className="editable-container">
                    <textarea 
                      value={editFormData.Description} 
                      onChange={e => handleChange('Description', e.target.value)} 
                      className="inline-input input-desc"
                    />
                    <span className="edit-icon-hint" style={{ top: '10px' }}>✏️</span>
                  </div>
                ) : (
                  <p className="pet-desc-text">
                    {pet.Description || "Цей чудовий пухнастик дуже чекає на люблячу родину!"}
                  </p>
                )}
              </div>

              {/* КНОПКИ ДІЙ */}
              {isAdminPath ? (
                <div className="admin-actions-block">
                  <p className="admin-actions-title">Панель адміністратора:</p>
                  
                  {isEditing ? (
                    <div className="admin-buttons-row">
                      <button onClick={() => setIsEditing(false)} disabled={isSaving} className="btn-cancel">
                        Скасувати
                      </button>
                      <button onClick={handleSaveChanges} disabled={isSaving} className="btn-save">
                        {isSaving ? '⏳ Збереження...' : '💾 Зберегти зміни'}
                      </button>
                    </div>
                  ) : (
                    <button onClick={handleEditToggle} className="btn-edit">
                      ✏️ Увімкнути режим редагування
                    </button>
                  )}
                </div>
              ) : (
                <button onClick={handleAdoptClick} className="btn-adopt">
                  Подати заявку на усиновлення
                </button>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PetDetails;