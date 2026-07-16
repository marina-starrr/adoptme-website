import { useParams, Link, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react'; // 👈 Додано useRef
import { supabase } from '../supabaseClient';
import BackgroundPaws from '../components/BackgroundPaws';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './PetDetails.css';

// 🌟 Компонент випадаючого списку
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
    <div className={`custom-dropdown-container ${disabled ? 'disabled' : ''}`} ref={dropdownRef} style={{ width: '100%', opacity: disabled ? 0.6 : 1 }}>
      <div 
        className={`custom-dropdown-header ${isOpen ? 'open' : ''} inline-input`} 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{ cursor: disabled ? 'default' : 'pointer' }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
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

const isVideoFile = (urlOrName) => {
  if (!urlOrName) return false;
  const cleanUrl = urlOrName.split('?')[0].toLowerCase();
  return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.ogg') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.mkv') || cleanUrl.endsWith('.avi');
};

function PetDetails() {
  const { id } = useParams();
  const location = useLocation();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isStoryExpanded, setIsStoryExpanded] = useState(false);

  const [editableImages, setEditableImages] = useState([]);

  const { userId, nickname, userEmail } = useAuth();
  const { showToast } = useToast();
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
  }, [id]);

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

      const todayStr = new Date().toISOString().split('T')[0];
      if (finalData.ArrivalDate > todayStr) {
        showToast("❌ Дата прибуття в притулок не може бути в майбутньому!");
        setIsSaving(false);
        return;
      }

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
        finalData.OwnerUserId = null;
        finalData.OwnerName = null;
        finalData.HomeDescription = null;
        finalData.ShowInLucky = true;
      } else {
        finalData.ShowInLucky = finalData.ShowInLucky !== false;
      }

      const isStatusChanged = pet.Status?.trim().toLowerCase() !== finalData.Status?.trim().toLowerCase();

      const { error } = await supabase.from('Pets').update(finalData).eq('Id', pet.Id);
      if (error) throw error;

      const cleanStatus = finalData.Status?.trim();
      if (isStatusChanged && ['На лікуванні', 'Вже вдома', 'Не вдалось врятувати', 'Заброньована', 'Шукає дім'].includes(cleanStatus)) {
        const targetStatus = cleanStatus === 'Вже вдома' ? 'Вже знайшла дім' : cleanStatus;

        const { data: favUsers } = await supabase
          .from('Favorites')
          .select('user_id')
          .eq('PetId', pet.Id);

        if (favUsers) {
          const validFavUsers = favUsers.filter(fav => fav.user_id);

          if (validFavUsers.length > 0) {
            const notificationsToInsert = validFavUsers.map(fav => ({
              user_id: fav.user_id,
              PetId: pet.Id,
              PetName: finalData.Name,
              NewStatus: targetStatus,
              IsRead: false
            }));
            await supabase.from('FavoriteNotifications').insert(notificationsToInsert);
          }
        }
      }

      setPet(finalData);
      setIsEditing(false);
      setEditableImages([]);
      setActiveImageIndex(0);
      showToast("✅ Зміни та медіафайли успішно збережено!");
    } catch (err) {
      showToast("❌ Помилка збереження: " + err.message);
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
      if (userId) {
        await supabase.from('Favorites').insert([
          { PetId: pet.Id, user_id: userId }
        ]);
      }
      favorites.push({ id: pet.Id, name: pet.Name, image: imageUrl });
      localStorage.setItem('favorites', JSON.stringify(favorites));
      window.dispatchEvent(new Event('cartUpdated'));
    }
    window.dispatchEvent(new Event('openFavorites'));
  };

  const handleNotifyWhenHealthyClick = async () => {
    if (!userId) {
      showToast("🐾 Будь ласка, увійдіть в систему, щоб підписатися на сповіщення!");
      return;
    }

    const { error } = await supabase.from('TreatmentNotifications').insert([
      {
        user_id: userId,
        UserNickname: nickname,
        UserEmail: userEmail || null,
        PetId: pet.Id,
        PetName: pet.Name,
        Status: 'Нова'
      }
    ]);

    if (!error) {
      showToast(`🔔 Дякуємо! Администратора сповіщено. Ви отримаєте повідомлення, коли ${pet.Name} одужає.`);
    } else {
      showToast("❌ Сталася помилка: " + error.message);
    }
  };

  const getStatusConfig = (petStatus) => {
    switch (petStatus) {
      case 'Особливий догляд': return { class: 'status-special', icon: '❤️‍🩹' };
      case 'На лікуванні': return { class: 'status-treatment', icon: '💊' };
      case 'Вже вдома': return { class: 'status-home', icon: '🏡' };
      case 'Не вдалось врятувати': return { class: 'status-died', icon: '😞' };
      case 'Заброньована': case 'Заброньовано': return { class: 'status-reserved', icon: '🔒' };
      default: return { class: 'status-looking', icon: '🐾' };
    }
  };

  if (loading) return <h2 className="loading-message">Шукаємо пухнастика... 🐾</h2>;
  if (!pet) return <h2 className="loading-message">Тваринку не знайдено 🐾</h2>;

  const currentStatus = isEditing ? editFormData.Status : pet.Status;
  const statusConfig = getStatusConfig(currentStatus || "Шукає дім");

  const displayMedia = isEditing
    ? editableImages.map(img => ({
        url: img.preview,
        isVideo: img.isNew 
            ? (img.file?.type?.startsWith('video/') || isVideoFile(img.file?.name)) 
            : isVideoFile(img.name)
      }))
    : getDbImages(pet).map(imgName => ({
        url: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${imgName}`,
        isVideo: isVideoFile(imgName)
      }));

  const safeActiveIndex = activeImageIndex >= displayMedia.length ? Math.max(0, displayMedia.length - 1) : activeImageIndex;
  const currentMedia = displayMedia[safeActiveIndex];

  const rawStoryText = pet.Status === 'Вже вдома' 
    ? (pet.HomeDescription || "Ця тваринка вже знайшла свій дім і живе в щасті у новій люблячій родині!") 
    : (pet.Description || "Цей чудовий пухнастик дуже чекає на люблячу родину!");
  
  const charLimit = 250;
  const isLongStory = rawStoryText.length > charLimit;
  const displayStoryText = (isLongStory && !isStoryExpanded) ? rawStoryText.substring(0, charLimit) + '...' : rawStoryText;

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
              {displayMedia.length > 0 ? (
                currentMedia.isVideo ? (
                  <video 
                    src={currentMedia.url} 
                    controls 
                    autoPlay 
                    muted 
                    loop 
                    playsInline
                    className="main-pet-image" 
                  />
                ) : (
                  <img src={currentMedia.url} alt={pet.Name} className="main-pet-image" />
                )
              ) : (
                <div className="placeholder-image" style={{ padding: '100px', textAlign: 'center', background: '#f5f5f5', borderRadius: '30px' }}>Немає медіа</div>
              )}

              <div className={`pet-status-badge ${statusConfig.class}`}>
                <span>{statusConfig.icon}</span> <span>{currentStatus || "Шукає дім"}</span>
              </div>

              {isEditing && (
                <div className="edit-photo-controls">
                  <label className="photo-btn add-btn" title="Додати нові фото або відео">
                    ➕ Додати медіа
                    <input type="file" multiple accept="image/*,video/*" onChange={handleAddPhotos} style={{ display: 'none' }} />
                  </label>

                  {displayMedia.length > 0 && (
                    <>
                      <label className="photo-btn change-btn" title="Замінити поточний файл">
                        🔄 Змінити
                        <input type="file" accept="image/*,video/*" onChange={handleChangeCurrentPhoto} style={{ display: 'none' }} />
                      </label>
                      <button type="button" className="photo-btn delete-btn" title="Видалити поточний файл" onClick={handleDeleteCurrentPhoto}>
                        🗑️ Видалити
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {displayMedia.length > 0 && (
              <div className="gallery-thumbnails">
                {displayMedia.map((media, index) => (
                  <div
                    key={index}
                    className={`thumbnail-wrapper ${safeActiveIndex === index ? 'active' : ''}`}
                    onClick={() => setActiveImageIndex(index)}
                  >
                    {media.isVideo ? (
                      <div className="thumbnail-video-container">
                        <video src={media.url} muted preload="metadata" />
                        <div className="video-play-overlay">▶</div>
                      </div>
                    ) : (
                      <img src={media.url} alt={`Thumbnail ${index + 1}`} />
                    )}
                  </div>
                ))}
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
                  {(currentStatus === 'Вже вдома' || currentStatus === 'Не вдалось врятувати' || currentStatus === 'Заброньована' || currentStatus === 'Заброньовано') ? (
                    <div className="status-message-block">
                      <p>
                        {currentStatus === 'Вже вдома' 
                          ? '🏡 Ця тваринка вже знайшла свою люблячу родину!' 
                          : currentStatus === 'Не вдалось врятувати'
                          ? '😞 На жаль, ця тваринка більше не з нами.'
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

          {/* ПРАВА КОЛОНКА (Інформація) */}
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
                  ) : (pet.Age)}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">{pet.Gender === 'Хлопчик' ? '♂️' : '♀️'}</div>
                <div className="stat-label">Стать</div>
                <div className="stat-value">
                  {isEditing ? (
                    <CustomDropdown
                      options={[{value: 'Хлопчик', label: 'Хлопчик'}, {value: 'Дівчинка', label: 'Дівчинка'}]}
                      value={editFormData.Gender || 'Хлопчик'}
                      onChange={val => handleChange('Gender', val)}
                    />
                  ) : (pet.Gender)}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🧬</div>
                <div className="stat-label">Порода</div>
                <div className="stat-value">
                  {isEditing ? (
                    <CustomDropdown
                       options={['Безпородна', 'Британська', 'Шотландська', 'Мейн-кун', 'Сфінкс', 'Такса', 'Вівчарка', 'Лабрадор', 'Тер\'єр', 'Не вказано'].map(b => ({value: b, label: b}))}
                       value={editFormData.Breed || 'Безпородна'}
                       onChange={val => handleChange('Breed', val)}
                    />
                  ) : (pet.Breed || "Не вказано")}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📏</div>
                <div className="stat-label">Розмір</div>
                <div className="stat-value">
                  {isEditing ? (
                    <CustomDropdown
                       options={[{value: 'Маленький', label: 'Маленький'}, {value: 'Середній', label: 'Середній'}, {value: 'Великий', label: 'Великий'}]}
                       value={editFormData.Size || 'Середній'}
                       onChange={val => handleChange('Size', val)}
                    />
                  ) : (pet.Size || "Середній")}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⚡</div>
                <div className="stat-label">Енергія</div>
                <div className="stat-value">
                  {isEditing ? (
                    <CustomDropdown
                       options={[{value: 'Низький', label: 'Низький'}, {value: 'Середній', label: 'Середній'}, {value: 'Високий', label: 'Високий'}]}
                       value={editFormData.EnergyLevel || 'Середній'}
                       onChange={val => handleChange('EnergyLevel', val)}
                    />
                  ) : (pet.EnergyLevel || "Середній")}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🥩</div>
                <div className="stat-label">Улюблена їжа</div>
                <div className="stat-value">
                  {isEditing ? (
                    <CustomDropdown
                       options={['М\'яско', 'Рибка', 'Сухий корм', 'Вологий корм', 'Паштет', 'Смаколики', 'Усе смачненьке'].map(f => ({value: f, label: f}))}
                       value={editFormData.FavoriteFood || "М'яско"}
                       onChange={val => handleChange('FavoriteFood', val)}
                    />
                  ) : (pet.FavoriteFood || "Усе смачненьке")}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '25px' }}>
              <div style={{ background: pet.IsVaccinated ? '#E8F5E9' : '#FFEBEE', color: pet.IsVaccinated ? '#2E7D32' : '#D32F2F', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {isEditing ? (
                  <><input type="checkbox" checked={editFormData.IsVaccinated || false} onChange={e => handleChange('IsVaccinated', e.target.checked)} /> Вакцинація</>
                ) : (
                  <>{pet.IsVaccinated ? '💉 Вакциновано' : '⚠️ Не вакциновано'}</>
                )}
              </div>
              
              <div style={{ background: '#FFF3E0', color: '#E65100', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px' }}>
                {isEditing ? (
                  <><input type="checkbox" checked={editFormData.NeedsTraining || false} onChange={e => handleChange('NeedsTraining', e.target.checked)} /> Потребує дресирування</>
                ) : (pet.NeedsTraining ? '🎓 Потребує навчання' : '⭐ Слухняна(ий)')}
              </div>

              <div style={{ background: '#E3F2FD', color: '#1565C0', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px' }}>
                {isEditing ? (
                  <input type="date" value={editFormData.ArrivalDate || ''} max={new Date().toISOString().split('T')[0]} onChange={e => handleChange('ArrivalDate', e.target.value)} style={{ border: 'none', background: 'transparent', color: 'inherit', fontWeight: 'bold' }} />
                ) : (`📅 У притулку з: ${pet.ArrivalDate || 'Невідомо'}`)}
              </div>
            </div>

            <div className="pet-tags-block">
              <h3 className="section-subtitle">Характер ({pet.Friendliness || 'Не вказано'}):</h3>
              {isEditing ? (
                <>
                  <CustomDropdown
                     options={['Дружелюбний до всіх', 'Любить дітей', 'Добрий/а до інших тварин', 'Обережний / Потребує часу'].map(f => ({value: f, label: f}))}
                     value={editFormData.Friendliness || 'Дружелюбний до всіх'}
                     onChange={val => handleChange('Friendliness', val)}
                  />
                  <div className="editable-container" style={{marginTop: '10px'}}>
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
              {isEditing ? (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <h3 className="section-subtitle" style={{ fontSize: '15px' }}>📖 Опис історії та характеру в притулку:</h3>
                    <div className="story-content">
                      <div className="editable-container">
                        <textarea 
                          value={editFormData.Description || ''} 
                          onChange={e => handleChange('Description', e.target.value)} 
                          className="inline-input input-desc" 
                          required
                          rows="4"
                          maxLength={700}
                        />
                      </div>
                      <div className="char-counter">
                        {editFormData.Description?.length || 0} / 700
                      </div>
                    </div>
                  </div>

                  {editFormData.Status === 'Вже вдома' && (
                    <div style={{ background: '#fdfbfe', padding: '15px', borderRadius: '12px', border: '1px solid #d4cbf9' }}>
                      <h3 className="section-subtitle" style={{ color: '#6847DD', marginBottom: '10px', fontSize: '15px' }}>🏡 Історія успіху:</h3>
                      <div className="editable-container">
                        <textarea 
                          value={editFormData.HomeDescription || ''} 
                          onChange={e => handleChange('HomeDescription', e.target.value)} 
                          className="inline-input input-desc" 
                          required
                          rows="4"
                          maxLength={700}
                        />
                      </div>
                      <div className="char-counter">
                        {editFormData.HomeDescription?.length || 0} / 700
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h3 className="section-subtitle">
                    {pet.Status === 'Вже вдома' ? '🏡 Історія успіху (Життя в родині):' : '📖 Моя історія:'}
                  </h3>
                  <div className="story-content">
                    <p className="pet-desc-text">
                      {displayStoryText}
                      {isLongStory && (
                        <span className="read-more-btn" onClick={() => setIsStoryExpanded(!isStoryExpanded)}>
                          {isStoryExpanded ? ' Згорнути' : ' Читати далі'}
                        </span>
                      )}
                    </p>
                  </div>
                </>
              )}
            </div>

            {(pet.MedicalNotes || isEditing) && (
              <div className="pet-story-block" style={{ marginTop: '0' }}>
                <h3 className="section-subtitle" style={{ color: '#D32F2F' }}>🩺 Медичні примітки:</h3>
                <div className="story-content" style={{ borderLeftColor: '#D32F2F', background: '#FFEBEE' }}>
                  {isEditing ? (
                    <>
                      <div className="editable-container">
                        <textarea 
                          value={editFormData.MedicalNotes || ''} 
                          onChange={e => handleChange('MedicalNotes', e.target.value)} 
                          className="inline-input input-desc" 
                          placeholder="Медичні приписи..." 
                          maxLength={300}
                          rows="3"
                        />
                      </div>
                      <div className="char-counter">
                        {editFormData.MedicalNotes?.length || 0} / 300
                      </div>
                    </>
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
                  <CustomDropdown 
                    options={[
                      {value: 'Шукає дім', label: 'Шукає дім'},
                      {value: 'Особливий догляд', label: 'Особливий догляд'},
                      {value: 'На лікуванні', label: 'На лікуванні'},
                      {value: 'Заброньована', label: 'Заброньована'},
                      {value: 'Вже вдома', label: 'Вже вдома'},
                      {value: 'Не вдалось врятувати', label: 'Не вдалось врятувати'}
                    ]}
                    value={editFormData.Status || 'Шукає дім'}
                    onChange={val => {
                        const newStatus = val;
                        let updatedData = { ...editFormData, Status: newStatus };
                        if (newStatus === 'Вже вдома') {
                            if (!updatedData.HomeDescription) updatedData.HomeDescription = "Ця тваринка вже знайшла свій дім і живе в щасті у новій люблячій родині!";
                        } else {
                            updatedData.HomeDescription = null;
                        }
                        setEditFormData(updatedData);
                    }}
                  />
                </div>

                {editFormData.Status === 'Вже вдома' && (
                  <div className="setting-row highlight-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <label><strong>🏡 Власник:</strong></label>
                      <div style={{ marginLeft: '15px', color: '#2E7D32', fontWeight: 'bold', fontSize: '1.1rem' }}>
                          {editFormData.OwnerName ? `👤 ${editFormData.OwnerName}` : "⏳ Автоматично призначиться при схваленні заявки"}
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default PetDetails;