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
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [editableImages, setEditableImages] = useState([]);

  const { userRole, userEmail } = useAuth();
  const isAdminPath = location.pathname.includes('/admin/');

  const getDbImages = (petData) => {
    if (!petData) return [];
    return petData.Images && petData.Images.length > 0
      ? petData.Images
      : (petData.ImageName ? [petData.ImageName] : []);
  };

  useEffect(() => {
    async function fetchPet() {
      setLoading(true);
      const { data, error } = await supabase.from('Pets').select('*').eq('Id', id).single();
      if (!error) setPet(data);
      setLoading(false);
    }
    fetchPet();

    if (isAdminPath) {
      supabase.from('Users').select('Id, FirstName, LastName, Nickname').then(({ data }) => {
        if (data) setUsersList(data);
      });
    }
  }, [id, isAdminPath]);

  useEffect(() => {
    return () => {
      editableImages.forEach(img => {
        if (img.isNew) URL.revokeObjectURL(img.preview);
      });
    };
  }, [editableImages]);

  const handleEditToggle = () => {
    setEditFormData(pet);
    const initialImgs = getDbImages(pet).map(imgName => ({
      isNew: false,
      name: imgName,
      preview: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${imgName}`
    }));
    setEditableImages(initialImgs);
    setActiveImageIndex(0);
    setIsEditing(true);
  };

  const handleChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddPhotos = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const newImgs = files.map(file => ({
      isNew: true,
      file: file,
      preview: URL.createObjectURL(file)
    }));
    setEditableImages(prev => [...prev, ...newImgs]);
  };

  const handleChangeCurrentPhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const newImg = {
      isNew: true,
      file: file,
      preview: URL.createObjectURL(file)
    };
    setEditableImages(prev => {
      const next = [...prev];
      next[activeImageIndex] = newImg;
      return next;
    });
  };

  const handleDeleteCurrentPhoto = () => {
    setEditableImages(prev => prev.filter((_, idx) => idx !== activeImageIndex));
    setActiveImageIndex(prev => (prev > 0 ? prev - 1 : 0));
  };

  const uploadSingleImage = async (file) => {
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
      const finalImagesArray = [];
      for (const img of editableImages) {
        if (img.isNew) {
          const uploadedFileName = await uploadSingleImage(img.file);
          finalImagesArray.push(uploadedFileName);
        } else {
          finalImagesArray.push(img.name);
        }
      }

      finalData.Images = finalImagesArray;
      finalData.ImageName = finalImagesArray.length > 0 ? finalImagesArray[0] : null;

      if (finalData.Status !== 'Вже вдома') {
        finalData.OwnerId = null;
        finalData.OwnerName = null;
        finalData.ShowInLucky = true;
      } else {
        finalData.ShowInLucky = finalData.ShowInLucky !== false;
      }

      const isStatusChanged = pet.Status?.trim().toLowerCase() !== finalData.Status?.trim().toLowerCase();

      const { error } = await supabase.from('Pets').update(finalData).eq('Id', pet.Id);
      if (error) throw error;

      const cleanStatus = finalData.Status?.trim();
      // 🌟 ОНОВЛЕНО: Додано "Шукає дім"
      if (isStatusChanged && ['На лікуванні', 'Вже вдома', 'Не вдалось врятувати', 'Заброньована', 'Шукає дім'].includes(cleanStatus)) {
        const targetStatus = cleanStatus === 'Вже вдома' ? 'Вже знайшла дім' : cleanStatus;

        const { data: favUsers, error: favError } = await supabase
          .from('Favorites')
          .select('*')
          .eq('PetId', pet.Id);

        if (favError) console.error("❌ Помилка отримання обраного з PetDetails:", favError.message);

        const validFavUsers = favUsers ? favUsers.filter(fav => fav.UserNickname || fav.userNickname || fav.usernickname || fav.user_nickname) : [];

        if (validFavUsers.length > 0) {
          const notificationsToInsert = validFavUsers.map(fav => {
            const nick = fav.UserNickname || fav.userNickname || fav.usernickname || fav.user_nickname;
            return {
              UserNickname: nick,
              PetId: pet.Id,
              PetName: finalData.Name,
              NewStatus: targetStatus,
              IsRead: false
            };
          });
          
          await supabase.from('FavoriteNotifications').insert(notificationsToInsert);
        }
      }

      setPet(finalData);
      setIsEditing(false);
      setEditableImages([]);
      setActiveImageIndex(0);
      alert("✅ Зміни та фото успішно збережено!");
    } catch (err) {
      alert("❌ Помилка збереження: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdoptClick = async () => {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const isAlreadyFav = favorites.some(fav => fav.id === pet.Id);

    const dbImgs = getDbImages(pet);
    const imageUrl = dbImgs.length > 0
      ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${dbImgs[0]}`
      : null;

    if (!isAlreadyFav) {
      const userNickname = localStorage.getItem('userNickname');
      if (userNickname) {
        await supabase.from('Favorites').insert([
          {
            PetId: pet.Id,
            UserNickname: userNickname
          }
        ]);
      }
      favorites.push({ id: pet.Id, name: pet.Name, image: imageUrl });
      localStorage.setItem('favorites', JSON.stringify(favorites));
      window.dispatchEvent(new Event('cartUpdated'));
    }
    window.dispatchEvent(new Event('openFavorites'));
  };

  const handleNotifyWhenHealthyClick = async () => {
    const userNickname = localStorage.getItem('userNickname');
    if (!userNickname) {
      alert("🐾 Будь ласка, увійдіть в систему, щоб підписатися на сповіщення!");
      return;
    }

    const { error } = await supabase.from('TreatmentNotifications').insert([
      {
        UserNickname: userNickname,
        UserEmail: userEmail || null,
        PetId: pet.Id,
        PetName: pet.Name,
        Status: 'Нова'
      }
    ]);

    if (!error) {
      alert(`🔔 Дякуємо! Администратора сповіщено. Ви отримаєте повідомлення, коли ${pet.Name} одужає.`);
    } else {
      alert("❌ Сталася помилка: " + error.message);
    }
  };

  const getStatusConfig = (petStatus) => {
    switch (petStatus) {
      case 'Потребує особливого догляду': return { class: 'status-special', icon: '❤️‍🩹' };
      case 'На лікуванні': return { class: 'status-treatment', icon: '💊' };
      case 'Вже вдома': return { class: 'status-home', icon: '🏡' };
      case 'Не вдалось врятувати': return { class: 'status-rainbow', icon: '🌈' };
      case 'Заброньована': case 'Заброньовано': return { class: 'status-reserved', icon: '🔒' };
      default: return { class: 'status-looking', icon: '🐾' };
    }
  };

  if (loading) return <h2 className="loading-message">Шукаємо пухнастика... 🐾</h2>;
  if (!pet) return <h2 className="loading-message">Тваринку не знайдено 🐾</h2>;

  const currentStatus = isEditing ? editFormData.Status : pet.Status;
  const statusConfig = getStatusConfig(currentStatus || "Шукає дім");

  const displayImages = isEditing
    ? editableImages.map(img => img.preview)
    : getDbImages(pet).map(imgName => `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${imgName}`);

  const safeActiveIndex = activeImageIndex >= displayImages.length ? Math.max(0, displayImages.length - 1) : activeImageIndex;

  return (
    <div className={`pet-details-layout ${isAdminPath ? 'admin-mode' : ''}`}>
      {!isAdminPath && <BackgroundPaws customClass="details-paws" />}

      <div className="pet-details-container">
        <Link to={isAdminPath ? "/admin/pets" : "/pets"} className="back-link">
          ← Назад до списку
        </Link>

        <div className="pet-details-content">
          <div className="pet-gallery-section">
            <div className="main-image-wrapper">
              {displayImages.length > 0 ? (
                <img src={displayImages[safeActiveIndex]} alt={pet.Name} className="main-pet-image" />
              ) : (
                <div className="placeholder-image" style={{ padding: '100px', textAlign: 'center', background: '#f5f5f5', borderRadius: '30px' }}>Немає фото</div>
              )}

              <div className={`pet-status-badge ${statusConfig.class}`}>
                <span>{statusConfig.icon}</span> <span>{currentStatus || "Шукає дім"}</span>
              </div>

              {isEditing && (
                <div className="edit-photo-controls">
                  <label className="photo-btn add-btn" title="Додати нові фото">
                    ➕ Додати
                    <input type="file" multiple accept="image/*" onChange={handleAddPhotos} style={{ display: 'none' }} />
                  </label>

                  {displayImages.length > 0 && (
                    <>
                      <label className="photo-btn change-btn" title="Замінити це фото">
                        🔄 Змінити
                        <input type="file" accept="image/*" onChange={handleChangeCurrentPhoto} style={{ display: 'none' }} />
                      </label>
                      <button type="button" className="photo-btn delete-btn" title="Видалити це фото" onClick={handleDeleteCurrentPhoto}>
                        🗑️ Видалити
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {displayImages.length > 0 && (
              <div className="gallery-thumbnails">
                {displayImages.map((imgUrl, index) => (
                  <div
                    key={index}
                    className={`thumbnail-wrapper ${safeActiveIndex === index ? 'active' : ''}`}
                    onClick={() => setActiveImageIndex(index)}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pet-info-section">
            <div className="pet-profile-header">
              {isEditing ? (
                <div className="editable-container">
                  <input value={editFormData.Name || ''} onChange={e => handleChange('Name', e.target.value)} className="inline-input input-name" />
                  <span className="edit-icon-hint">✏️</span>
                </div>
              ) : (
                <h1 className="pet-profile-name">{pet.Name}</h1>
              )}
            </div>

            <div className="pet-stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🎂</div>
                <div className="stat-label">Вік</div>
                <div className="stat-value">
                  {isEditing ? (
                    <input value={editFormData.Age || ''} onChange={e => handleChange('Age', e.target.value)} className="inline-input center-input" />
                  ) : (
                    pet.Age
                  )}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">{pet.Gender === 'Хлопчик' ? '♂️' : '♀️'}</div>
                <div className="stat-label">Стать</div>
                <div className="stat-value">
                  {isEditing ? (
                    <select value={editFormData.Gender || 'Хлопчик'} onChange={e => handleChange('Gender', e.target.value)} className="inline-input center-input">
                      <option>Хлопчик</option>
                      <option>Дівчинка</option>
                    </select>
                  ) : (
                    pet.Gender
                  )}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🧬</div>
                <div className="stat-label">Порода</div>
                <div className="stat-value">
                  {isEditing ? (
                    <input value={editFormData.Breed || ''} onChange={e => handleChange('Breed', e.target.value)} className="inline-input center-input" placeholder="Порода..." />
                  ) : (
                    pet.Breed || "Не вказано"
                  )}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📏</div>
                <div className="stat-label">Розмір</div>
                <div className="stat-value">
                  {isEditing ? (
                    <select value={editFormData.Size || 'Середній'} onChange={e => handleChange('Size', e.target.value)} className="inline-input center-input">
                      <option>Маленький</option>
                      <option>Середній</option>
                      <option>Великий</option>
                    </select>
                  ) : (
                    pet.Size || "Середній"
                  )}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⚡</div>
                <div className="stat-label">Енергія</div>
                <div className="stat-value">
                  {isEditing ? (
                    <select value={editFormData.EnergyLevel || 'Середній'} onChange={e => handleChange('EnergyLevel', e.target.value)} className="inline-input center-input">
                      <option>Низький</option>
                      <option>Середній</option>
                      <option>Високий</option>
                    </select>
                  ) : (
                    pet.EnergyLevel || "Середній"
                  )}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🥩</div>
                <div className="stat-label">Улюблена їжа</div>
                <div className="stat-value">
                  {isEditing ? (
                    <input value={editFormData.FavoriteFood || ''} onChange={e => handleChange('FavoriteFood', e.target.value)} className="inline-input center-input" placeholder="М'яско..." />
                  ) : (
                    pet.FavoriteFood || "Усе смачненьке"
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '25px' }}>
              <div style={{ background: pet.IsVaccinated ? '#E8F5E9' : '#FFEBEE', color: pet.IsVaccinated ? '#2E7D32' : '#D32F2F', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {isEditing ? (
                  <>
                    <input type="checkbox" checked={editFormData.IsVaccinated || false} onChange={e => handleChange('IsVaccinated', e.target.checked)} />
                    Вакцинація
                  </>
                ) : (
                  <>
                    {pet.IsVaccinated ? '💉 Вакциновано' : '⚠️ Не вакциновано'}
                  </>
                )}
              </div>
              
              <div style={{ background: '#FFF3E0', color: '#E65100', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px' }}>
                {isEditing ? (
                  <>
                    <input type="checkbox" checked={editFormData.NeedsTraining || false} onChange={e => handleChange('NeedsTraining', e.target.checked)} />
                    Потребує дресирування
                  </>
                ) : (
                  pet.NeedsTraining ? '🎓 Потребує навчання' : '⭐ Слухняна(ий)'
                )}
              </div>

              <div style={{ background: '#E3F2FD', color: '#1565C0', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px' }}>
                {isEditing ? (
                  <input type="date" value={editFormData.ArrivalDate || ''} onChange={e => handleChange('ArrivalDate', e.target.value)} style={{ border: 'none', background: 'transparent', color: 'inherit', fontWeight: 'bold' }} />
                ) : (
                  `📅 У притулку з: ${pet.ArrivalDate || 'Невідомо'}`
                )}
              </div>
            </div>

            <div className="pet-tags-block">
              <h3 className="section-subtitle">Характер ({pet.Friendliness || 'Не вказано'}):</h3>
              {isEditing ? (
                <>
                  <select value={editFormData.Friendliness || 'Дружелюбний до всіх'} onChange={e => handleChange('Friendliness', e.target.value)} className="inline-input" style={{ marginBottom: '10px' }}>
                    <option>Дружелюбний до всіх</option>
                    <option>Любить дітей</option>
                    <option>Добре з іншими тваринами</option>
                    <option>Обережний / Потребує часу</option>
                  </select>
                  <div className="editable-container">
                    <input value={editFormData.Tags || ''} onChange={e => handleChange('Tags', e.target.value)} className="inline-input input-tags" placeholder="Введіть теги через кому або пробіл..." />
                  </div>
                </>
              ) : (
                <div className="tags-list">
                  {pet.Tags ? pet.Tags.split(/[#, ]+/).filter(t => t).map(tag => (
                    <span key={tag} className="pet-tag">#{tag.trim()}</span>
                  )) : <span className="pet-tag-empty">Немає додаткових тегів</span>}
                </div>
              )}
            </div>

            <div className="pet-story-block">
              <h3 className="section-subtitle">📖 Моя історія:</h3>
              <div className="story-content">
                {isEditing ? (
                  <div className="editable-container">
                    <textarea value={editFormData.Description || ''} onChange={e => handleChange('Description', e.target.value)} className="inline-input input-desc" />
                  </div>
                ) : (
                  <p className="pet-desc-text">{pet.Description || "Цей чудовий пухнастик дуже чекає на люблячу родину!"}</p>
                )}
              </div>
            </div>

            {(pet.MedicalNotes || isEditing) && (
              <div className="pet-story-block" style={{ marginTop: '20px' }}>
                <h3 className="section-subtitle" style={{ color: '#D32F2F' }}>🩺 Медичні примітки:</h3>
                <div className="story-content" style={{ borderLeftColor: '#D32F2F', background: '#FFEBEE' }}>
                  {isEditing ? (
                    <div className="editable-container">
                      <textarea value={editFormData.MedicalNotes || ''} onChange={e => handleChange('MedicalNotes', e.target.value)} className="inline-input input-desc" placeholder="Медичні приписи..." />
                    </div>
                  ) : (
                    <p className="pet-desc-text" style={{ color: '#C62828' }}>{pet.MedicalNotes}</p>
                  )}
                </div>
              </div>
            )}

            {isEditing && (
              <div className="admin-extra-settings" style={{ marginTop: '20px' }}>
                <div className="setting-row">
                  <label><strong>Статус:</strong></label>
                  <select
                    value={editFormData.Status || 'Шукає дім'}
                    onChange={e => {
                      const newStatus = e.target.value;
                      let newDesc = editFormData.Description;
                      if (newStatus === 'Вже вдома' && (!newDesc || newDesc === pet.Description)) {
                        newDesc = "Ця тваринка вже знайшла свій дім і живе в щасті у новій люблячій родині!";
                      }
                      setEditFormData(prev => ({ ...prev, Status: newStatus, Description: newDesc }));
                    }}
                    className="admin-select"
                  >
                    <option value="Шукає дім">Шукає дім</option>
                    <option value="Потребує особливого догляду">Потребує особливого догляду</option>
                    <option value="На лікуванні">На лікуванні</option>
                    <option value="Заброньована">Заброньована</option>
                    <option value="Вже вдома">Вже вдома</option>
                    <option value="Не вдалось врятувати">Не вдалось врятувати</option>
                  </select>
                </div>

                {editFormData.Status === 'Вже вдома' && (
                  <div className="setting-row highlight-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <label><strong>🏡 Власник:</strong></label>
                      <div style={{ marginLeft: '15px', color: '#2E7D32', fontWeight: 'bold', fontSize: '1.1rem' }}>
                          {editFormData.OwnerName 
                              ? `👤 ${editFormData.OwnerName}` 
                              : "⏳ Автоматично призначиться при схваленні заявки"}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '5px' }}>
                      <input 
                        type="checkbox" 
                        id="showInLuckyCheckbox"
                        checked={editFormData.ShowInLucky !== false} 
                        onChange={(e) => handleChange('ShowInLucky', e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10b981' }}
                      />
                      <label htmlFor="showInLuckyCheckbox" style={{ cursor: 'pointer', fontSize: '14px', color: '#2E7D32', fontWeight: '600' }}>
                        🌟 Відображати в панелі "Щасливчики"
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="action-area">
              {isAdminPath ? (
                <div className="admin-actions-block">
                  {isEditing ? (
                    <div className="admin-buttons-row">
                      <button onClick={() => setIsEditing(false)} disabled={isSaving} className="btn-cancel">Скасувати</button>
                      <button onClick={handleSaveChanges} disabled={isSaving} className="btn-save">{isSaving ? '⏳ Збереження...' : '💾 Зберегти зміни'}</button>
                    </div>
                  ) : (
                    <button onClick={handleEditToggle} className="btn-edit">✏️ Редагувати профіль</button>
                  )}
                </div>
              ) : (
                <div className="user-actions-block">
                  {/* 🌟 ОНОВЛЕНО: Додано перевірку на Заброньована */}
                  {(currentStatus === 'Вже вдома' || currentStatus === 'Не вдалось врятувати' || currentStatus === 'Заброньована' || currentStatus === 'Заброньовано') ? (
                    <div className="status-message-block">
                      <p>
                        {currentStatus === 'Вже вдома' 
                          ? '🏡 Ця тваринка вже знайшла свою люблячу родину!' 
                          : currentStatus === 'Не вдалось врятувати'
                            ? '🌈 На жаль, ця тваринка більше не з нами.'
                            : '🔒 Ця тваринка вже заброньована іншою родиною!'}
                      </p>
                    </div>
                  ) : currentStatus === 'На лікуванні' ? (
                    <button onClick={handleNotifyWhenHealthyClick} className="btn-notify"> 🔔 Повідомити, коли одужає</button>
                  ) : (
                    <button onClick={handleAdoptClick} className="btn-adopt">💖 Подати заявку на усиновлення</button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PetDetails;