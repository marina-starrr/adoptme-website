import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UserPetCard from '../../components/UserPetCard';
import { supabase } from '../../supabaseClient';
import './AdminPets.css';
import { useToast } from '../../context/ToastContext';

// 🌟 КАСТОМНИЙ ВИТОНЧЕНИЙ ВИПАДАЮЧИЙ СПИСОК
function CustomDropdown({ options, value, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Закриваємо список при кліку поза ним
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
    <div className="custom-dropdown-container" ref={dropdownRef}>
      <div 
        className={`custom-dropdown-header ${isOpen ? 'open' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>
      
      {isOpen && (
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

function AdminPets() {
  const navigate = useNavigate();
  const [petsList, setPetsList] = useState([]);
  const [usersList, setUsersList] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentPetId, setCurrentPetId] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [sortOrder, setSortOrder] = useState('newest');
  const [toastMsg, setToastMsg] = useState('');
  const [petToDelete, setPetToDelete] = useState(null);

  const [petTypes, setPetTypes] = useState(['Кіт', 'Собака']);
  const [newType, setNewType] = useState('');

  const [filterType, setFilterType] = useState('Всі');
  const [filterGender, setFilterGender] = useState('Всі');
  const [filterAge, setFilterAge] = useState('Всі'); 
  const [filterStatus, setFilterStatus] = useState('Всі');

  const getAgeInMonths = (ageStr) => {
    if (!ageStr) return 0;
    const lowerStr = ageStr.toLowerCase();
    const match = lowerStr.match(/(\d+([.,]\d+)?)/);
    if (!match) return 0;
    const num = parseFloat(match[0].replace(',', '.'));
    if (lowerStr.includes('рік') || lowerStr.includes('рок') || lowerStr.includes('річ') || lowerStr.includes('р.')) {
      return num * 12;
    } else if (lowerStr.includes('тиж')) {
      return num * 0.25; 
    } else if (lowerStr.includes('дн') || lowerStr.includes('день')) {
      return num / 30; 
    }
    return num;
  };

  const filteredAndSortedPets = [...petsList]
    .filter(pet => {
      const safePetType = pet.Type ? pet.Type.trim().toLowerCase() : '';
      const safeFilterType = filterType.trim().toLowerCase();
      const matchType = filterType === 'Всі' || safePetType === safeFilterType;

      const safePetGender = pet.Gender ? pet.Gender.trim().toLowerCase() : '';
      const safeFilterGender = filterGender.trim().toLowerCase();
      const matchGender = filterGender === 'Всі' || safePetGender === safeFilterGender;

      const ageInMonths = getAgeInMonths(pet.Age);
      let matchAge = true;
      if (filterAge === 'До 6 місяців') matchAge = ageInMonths < 6;
      else if (filterAge === 'Від 6 міс. до 1 року') matchAge = ageInMonths >= 6 && ageInMonths <= 12;
      else if (filterAge === 'Від 1 до 3 років') matchAge = ageInMonths > 12 && ageInMonths <= 36;
      else if (filterAge === 'Більше 3 років') matchAge = ageInMonths > 36;

      const safePetStatus = pet.Status ? pet.Status.trim().toLowerCase() : 'шукає дім';
      const safeFilterStatus = filterStatus.trim().toLowerCase();
      const matchStatus = filterStatus === 'Всі' || safePetStatus === safeFilterStatus;

      return matchType && matchGender && matchAge && matchStatus;
    })
    .sort((a, b) => {
      if (sortOrder === 'name') return (a.Name || '').localeCompare(b.Name || '');
      if (sortOrder === 'oldest') return a.Id - b.Id;
      return b.Id - a.Id; 
    });

  const resetFilters = () => {
    setFilterType('Всі');
    setFilterGender('Всі');
    setFilterAge('Всі'); 
    setFilterStatus('Всі');
    setSortOrder('newest');
  };

  const handleAddNewType = (e) => {
    e.preventDefault();
    if (newType.trim() && !petTypes.includes(newType.trim())) {
      setPetTypes([...petTypes, newType.trim()]);
      setPetFormData({ ...petFormData, Type: newType.trim() });
      setNewType('');
      showToast("✨ Новий вид додано до списку!");
    } else {
      showToast("⚠️ Такий вид вже існує або назва порожня");
    }
  };

  const initialFormState = {
    Name: '',
    Type: 'Кіт',
    Age: '',
    Gender: 'Хлопчик',
    ImageName: '',
    Tags: '',
    Description: '',
    Status: 'Шукає дім',
    OwnerId: null, 
    OwnerName: ''  
  };

  const [petFormData, setPetFormData] = useState(initialFormState);

  const showToast = (message) => {
    setToastMsg(message);
    setTimeout(() => setToastMsg(''), 3500);
  };

  useEffect(() => {
    fetchPets();
    fetchUsers(); 
  }, []);

  useEffect(() => {
    if (petsList.length > 0) {
      const uniqueTypes = [...new Set(petsList.map(pet => pet.Type).filter(Boolean))];
      const combinedTypes = [...new Set(['Кіт', 'Собака', ...uniqueTypes])];
      setPetTypes(combinedTypes);
    }
  }, [petsList]);

  async function fetchPets() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('Pets').select('*').order('Id', { ascending: true });
      if (error) throw error;
      setPetsList(data || []);
    } catch (err) {
      showToast("❌ Помилка завантаження: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    const { data, error } = await supabase.from('Users').select('Id, FirstName, LastName, Nickname');
    if (!error && data) {
      setUsersList(data);
    }
  }

  const handleEditOpen = (e, pet) => {
    e.preventDefault();
    e.stopPropagation();
    setEditMode(true);
    setCurrentPetId(pet.Id);
    setPetFormData({
      Name: pet.Name || '',
      Type: pet.Type || 'Кіт',
      Age: pet.Age || '',
      Gender: pet.Gender || 'Хлопчик',
      ImageName: pet.ImageName || '',
      Tags: pet.Tags || '',
      Description: pet.Description || '',
      Status: pet.Status || 'Шукає дім',
      OwnerId: pet.OwnerId || null,
      OwnerName: pet.OwnerName || ''
    });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleAddOpen = () => {
    setEditMode(false);
    setPetFormData(initialFormState);
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('pets').upload(fileName, file);
    if (uploadError) throw new Error('Помилка завантаження фото: ' + uploadError.message);
    return fileName;
  };

  const handleSavePet = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let finalImageName = petFormData.ImageName;

      if (selectedFile) {
        finalImageName = await uploadImage(selectedFile);
      } else if (!editMode && !finalImageName) {
        showToast("❌ Будь ласка, оберіть фотографію!");
        setIsUploading(false);
        return;
      }

      const dataToSave = { ...petFormData, ImageName: finalImageName };

      if (dataToSave.Status !== 'Вже вдома') {
        dataToSave.OwnerId = null;
        dataToSave.OwnerName = null;
      }

      if (editMode) {
        const { error } = await supabase.from('Pets').update(dataToSave).eq('Id', currentPetId);
        if (error) throw error;
        showToast("✅ Профіль тваринки успішно оновлено!");
      } else {
        const { error } = await supabase.from('Pets').insert([dataToSave]);
        if (error) throw error;
        showToast("🎉 Нового хвостика успішно додано!");
      }

      setIsModalOpen(false);
      fetchPets();
    } catch (error) {
      showToast("❌ Помилка: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const confirmDeleteClick = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setPetToDelete(id);
  };

  const executeDelete = async () => {
    if (!petToDelete) return;
    try {
      const { error } = await supabase.from('Pets').delete().eq('Id', petToDelete);
      if (error) throw error;
      showToast("🗑️ Профіль успішно видалено!");
      setPetToDelete(null);
      fetchPets();
    } catch (err) {
      showToast("❌ Помилка видалення: " + err.message);
      setPetToDelete(null);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div className="admin-page-layout">

        {/* САЙДБАР З НОВИМИ ФІЛЬТРАМИ */}
        <aside className="admin-sidebar">
          <div className="sidebar-header">
            <h3 className="sidebar-title" style={{ margin: 0 }}>Фільтри</h3>
            <button className="reset-btn" onClick={resetFilters}>Скинути</button>
          </div>
          
          <div className="filter-block">
            <label>Вид тварини</label>
            <CustomDropdown 
              options={[
                { value: 'Всі', label: 'Всі види' },
                ...petTypes.map(type => ({ value: type, label: type }))
              ]} 
              value={filterType} 
              onChange={setFilterType} 
            />
          </div>

          <div className="filter-block">
            <label>Стать</label>
            <CustomDropdown 
              options={[
                { value: 'Всі', label: 'Будь-яка' },
                { value: 'Хлопчик', label: 'Хлопчик' },
                { value: 'Дівчинка', label: 'Дівчинка' }
              ]} 
              value={filterGender} 
              onChange={setFilterGender} 
            />
          </div>

          <div className="filter-block">
            <label>Вік</label>
            <CustomDropdown 
              options={[
                { value: 'Всі', label: 'Будь-який вік' },
                { value: 'До 6 місяців', label: 'До 6 місяців (Малюки)' },
                { value: 'Від 6 міс. до 1 року', label: 'Від 6 міс. до 1 року' },
                { value: 'Від 1 до 3 років', label: 'Від 1 до 3 років' },
                { value: 'Більше 3 років', label: 'Більше 3 років' }
              ]} 
              value={filterAge} 
              onChange={setFilterAge} 
            />
          </div>

          <div className="filter-block">
            <label>Позначка (Статус)</label>
            <CustomDropdown 
              options={[
                { value: 'Всі', label: 'Всі статуси' },
                { value: 'Шукає дім', label: '🐾 Шукає дім' },
                { value: 'Потребує особливого догляду', label: '❤️‍🩹 Особливий догляд' },
                { value: 'На лікуванні', label: '💊 На лікуванні' },
                { value: 'Вже вдома', label: '🏡 Вже вдома' },
                { value: 'Не вдалось врятувати', label: '🌈 Не вдалось врятувати' }
              ]} 
              value={filterStatus} 
              onChange={setFilterStatus} 
            />
          </div>
        </aside>

        <div className="admin-content-area">
          <div className="admin-card">
            
            {/* ШАПКА З НОВИМ СОРТУВАННЯМ */}
            <div className="admin-header-box">
              <div className="admin-title-row">
                <h2 className="admin-page-title">
                  <span className="admin-page-title-icon">🐾</span> База тварин
                </h2>
                
                <div className="sort-control">
                  <span className="sort-label">Сортувати:</span>
                  <div style={{ width: '220px' }}>
                    <CustomDropdown 
                      options={[
                        { value: 'newest', label: 'Новенькі спочатку' },
                        { value: 'oldest', label: 'Ті, що давно чекають' },
                        { value: 'name', label: 'За алфавітом (А-Я)' }
                      ]} 
                      value={sortOrder} 
                      onChange={setSortOrder} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pet-grid">
              <div className="add-pet-card" onClick={handleAddOpen}>
                <div className="plus-icon">+</div>
                <h3>Додати хвостика</h3>
              </div>

              {filteredAndSortedPets.map((pet) => (
                <div key={pet.Id} className="pet-card-wrapper admin-mode" onClick={() => navigate(`/admin/pets/${pet.Id}`)} style={{ cursor: 'pointer' }}>
                  <div className="admin-card-actions">
                    <button className="edit-icon-btn" onClick={(e) => handleEditOpen(e, pet)}>✎</button>
                    <button className="delete-icon-btn" onClick={(e) => confirmDeleteClick(e, pet.Id)}>×</button>
                  </div>
                  <UserPetCard
                    id={pet.Id}
                    name={pet.Name}
                    age={pet.Age}
                    gender={pet.Gender}
                    tags={pet.Tags}
                    image={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${pet.ImageName}`}
                    isAdmin={true}
                    status={pet.Status} 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* МОДАЛЬНЕ ВІКНО ФОРМИ */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !isUploading && setIsModalOpen(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editMode ? "Редагування профілю" : "Новий підопічний"}</h3>
              <button className="close-x" onClick={() => setIsModalOpen(false)} title="Закрити">×</button>
            </div>

            <form onSubmit={handleSavePet} className="admin-form">
              <div className="input-group">
                <label>Кличка тваринки</label>
                <input type="text" placeholder="Наприклад: Mars" value={petFormData.Name} onChange={e => setPetFormData({ ...petFormData, Name: e.target.value })} required />
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Вид тваринки</label>
                  <div className="add-type-row">
                    <select value={petFormData.Type} onChange={e => setPetFormData({ ...petFormData, Type: e.target.value })} className="form-control">
                      {petTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                  <div className="add-type-row" style={{ marginTop: '10px' }}>
                    <input type="text" placeholder="Інший вид..." value={newType} onChange={e => setNewType(e.target.value)} className="form-control" />
                    <button type="button" className="add-type-btn" onClick={handleAddNewType}>+</button>
                  </div>
                </div>

                <div className="input-group">
                  <label>Стать</label>
                  <select value={petFormData.Gender} onChange={e => setPetFormData({ ...petFormData, Gender: e.target.value })} className="form-control">
                    <option>Хлопчик</option>
                    <option>Дівчинка</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>Позначка (Статус тваринки)</label>
                <select 
                  value={petFormData.Status} 
                  onChange={e => {
                    const newStatus = e.target.value;
                    let newDesc = petFormData.Description;
                    if (newStatus === 'Вже вдома' && !newDesc) {
                      newDesc = "Ця тваринка вже знайшла свій дім і живе в щасті у новій люблячій родині!";
                    }
                    setPetFormData({ ...petFormData, Status: newStatus, Description: newDesc });
                  }} 
                  className="form-control"
                >
                  <option value="Шукає дім">🐾 Шукає дім</option>
                  <option value="Потребує особливого догляду">❤️‍🩹 Потребує особливого догляду</option>
                  <option value="На лікуванні">💊 На лікуванні</option>
                  <option value="Вже вдома">🏡 Вже вдома</option>
                  <option value="Не вдалось врятувати">🌈 Не вдалось врятувати</option>
                </select>
              </div>

              {petFormData.Status === 'Вже вдома' && (
                <div className="input-group" style={{ background: '#fdfbfe', padding: '15px', borderRadius: '12px', border: '1px solid #d4cbf9' }}>
                  <label style={{ color: '#6847DD' }}>🏡 Хто прихистив тваринку? (Оберіть користувача)</label>
                  <select
                    value={petFormData.OwnerId || ''}
                    onChange={(e) => {
                      const selectedUserId = e.target.value;
                      const selectedUser = usersList.find(u => u.Id.toString() === selectedUserId);
                      setPetFormData({
                        ...petFormData,
                        OwnerId: selectedUserId ? parseInt(selectedUserId) : null,
                        OwnerName: selectedUser ? `${selectedUser.FirstName} ${selectedUser.LastName}` : ''
                      });
                    }}
                    className="form-control"
                    required
                  >
                    <option value="">-- Виберіть користувача --</option>
                    {usersList.map(user => (
                      <option key={user.Id} value={user.Id}>
                        {user.FirstName} {user.LastName} (@{user.Nickname})
                      </option>
                    ))}
                  </select>
                  <small style={{ color: '#666', marginTop: '8px', display: 'block' }}>
                    Тваринка з'явиться на головній сторінці у розділі "Щасливчики", а також у профілі цього користувача.
                  </small>
                </div>
              )}

              <div className="form-row">
                <div className="input-group">
                  <label>Вік</label>
                  <input type="text" placeholder="Наприклад: 9 місяців" value={petFormData.Age} onChange={e => setPetFormData({ ...petFormData, Age: e.target.value })} className="form-control" required />
                </div>
                <div className="input-group">
                  <label>Теги</label>
                  <input type="text" placeholder="#добра #розумна" value={petFormData.Tags} onChange={e => setPetFormData({ ...petFormData, Tags: e.target.value })} className="form-control" />
                </div>
              </div>

              <div className="input-group">
                <label>Фотографія</label>
                <label className="file-upload-label">
                  <span className="file-upload-text">
                    {selectedFile ? `✅ Обрано: ${selectedFile.name}` : (editMode ? "🖼️ Натисніть, щоб змінити поточне фото" : "📷 Натисніть, щоб обрати фото")}
                  </span>
                  <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files[0])} style={{ display: 'none' }} />
                </label>
              </div>

              <div className="input-group">
                <label>Опис історії та характеру</label>
                <textarea
                  placeholder="Опишіть тваринку детальніше..."
                  value={petFormData.Description || ''}
                  onChange={e => setPetFormData({ ...petFormData, Description: e.target.value })}
                  className="form-control"
                  required
                  rows="4">
                </textarea>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)} disabled={isUploading}>Скасувати</button>
                <button type="submit" className="save-btn" disabled={isUploading}>
                  {isUploading ? 'Завантаження...' : 'Зберегти зміни'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {petToDelete && (
        <div className="modal-overlay" onClick={() => setPetToDelete(null)}>
          <div className="admin-modal" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#ef4444', fontSize: '24px', marginBottom: '10px' }}>⚠️ Видалення</h3>
            <p style={{ color: '#555', fontSize: '16px', marginBottom: '30px', lineHeight: '1.5' }}>
              Ви дійсно хочете назавжди видалити профіль цієї тваринки? Цю дію неможливо скасувати.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button className="cancel-btn" onClick={() => setPetToDelete(null)}>Скасувати</button>
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

export default AdminPets;