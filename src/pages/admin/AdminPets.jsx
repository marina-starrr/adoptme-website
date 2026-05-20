import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserPetCard from '../../components/UserPetCard';
import { supabase } from '../../supabaseClient';
import './AdminPets.css';

function AdminPets() {
  const navigate = useNavigate();
  const [petsList, setPetsList] = useState([]);
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

  // 🌟 Стейти фільтрів (додано filterStatus)
  const [filterType, setFilterType] = useState('Всі');
  const [filterGender, setFilterGender] = useState('Всі');
  const [filterAge, setFilterAge] = useState('Всі'); 
  const [filterStatus, setFilterStatus] = useState('Всі'); // 👈 Стейт для нового фільтра статусу

  // Функція для перетворення текстового віку у число (місяці)
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

  // 🌟 РОЗУМНА ФІЛЬТРАЦІЯ
  const filteredAndSortedPets = [...petsList]
    .filter(pet => {
      // 1. Фільтр за видом
      const safePetType = pet.Type ? pet.Type.trim().toLowerCase() : '';
      const safeFilterType = filterType.trim().toLowerCase();
      const matchType = filterType === 'Всі' || safePetType === safeFilterType;

      // 2. Фільтр за статтю
      const safePetGender = pet.Gender ? pet.Gender.trim().toLowerCase() : '';
      const safeFilterGender = filterGender.trim().toLowerCase();
      const matchGender = filterGender === 'Всі' || safePetGender === safeFilterGender;

      // 3. Фільтр за віком
      const ageInMonths = getAgeInMonths(pet.Age);
      let matchAge = true;

      if (filterAge === 'До 6 місяців') {
        matchAge = ageInMonths < 6;
      } else if (filterAge === 'Від 6 міс. до 1 року') {
        matchAge = ageInMonths >= 6 && ageInMonths <= 12;
      } else if (filterAge === 'Від 1 до 3 років') {
        matchAge = ageInMonths > 12 && ageInMonths <= 36;
      } else if (filterAge === 'Більше 3 років') {
        matchAge = ageInMonths > 36;
      }

      // 4. Фільтр за статусом (Позначкою) 👈 НОВА ЛОГІКА
      const safePetStatus = pet.Status ? pet.Status.trim().toLowerCase() : 'шукає дім';
      const safeFilterStatus = filterStatus.trim().toLowerCase();
      const matchStatus = filterStatus === 'Всі' || safePetStatus === safeFilterStatus;

      return matchType && matchGender && matchAge && matchStatus;
    })
    .sort((a, b) => {
      if (sortOrder === 'name') {
        const nameA = a.Name || '';
        const nameB = b.Name || '';
        return nameA.localeCompare(nameB);
      }
      if (sortOrder === 'oldest') return a.Id - b.Id;
      return b.Id - a.Id; 
    });

  const resetFilters = () => {
    setFilterType('Всі');
    setFilterGender('Всі');
    setFilterAge('Всі'); 
    setFilterStatus('Всі'); // 👈 Скидаємо і фільтр статусу
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
    Status: 'Шукає дім' 
  };

  const [petFormData, setPetFormData] = useState(initialFormState);

  const showToast = (message) => {
    setToastMsg(message);
    setTimeout(() => setToastMsg(''), 3500);
  };

  useEffect(() => {
    fetchPets();
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
      const { data, error } = await supabase
        .from('Pets')
        .select('*')
        .order('Id', { ascending: true });
      if (error) throw error;
      setPetsList(data || []);
    } catch (err) {
      showToast("❌ Помилка завантаження: " + err.message);
    } finally {
      setLoading(false);
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
      Status: pet.Status || 'Шукає дім' 
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

    const { error: uploadError } = await supabase.storage
      .from('pets')
      .upload(fileName, file);

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
    <div className="admin-main page-transition" style={{ position: 'relative' }}>
      <div className="admin-page-layout">

        {/* САЙДБАР ФІЛЬТРІВ */}
        <aside className="admin-sidebar">
          <h3 className="sidebar-title">🔍 Фільтри</h3>

          <div className="filter-group">
            <label>Вид тварини</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="custom-select-wrapper" style={{ width: '100%' }}>
              <option value="Всі">Всі види</option>
              {petTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Стать</label>
            <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="custom-select-wrapper" style={{ width: '100%' }}>
              <option value="Всі">Всі</option>
              <option value="Хлопчик">Хлопчик</option>
              <option value="Дівчинка">Дівчинка</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Вік тварини</label>
            <select value={filterAge} onChange={(e) => setFilterAge(e.target.value)} className="custom-select-wrapper" style={{ width: '100%' }}>
              <option value="Всі">Будь-який</option>
              <option value="До 6 місяців">До 6 місяців</option>
              <option value="Від 6 міс. до 1 року">Від 6 міс. до 1 року</option>
              <option value="Від 1 до 3 років">Від 1 до 3 років</option>
              <option value="Більше 3 років">Більше 3 років</option>
            </select>
          </div>

          {/* 🌟 НОВИЙ ФІЛЬТР ЗА СТАТУСОМ */}
          <div className="filter-group">
            <label>Позначка</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="custom-select-wrapper" style={{ width: '100%' }}>
              <option value="Всі">Всі позначки</option>
              <option value="Шукає дім">🐾 Шукає дім</option>
              <option value="Потребує особливого догляду">❤️‍🩹 Особливий догляд</option>
              <option value="На лікуванні">💊 На лікуванні</option>
              <option value="Вже вдома">🏡 Вже вдома</option>
              <option value="Не вдалось врятувати">🌈 Не вдалось врятувати</option>
            </select>
          </div>

          <button className="reset-filters-btn" onClick={resetFilters}>Скинути фільтри</button>
        </aside>

        {/* ОСНОВНИЙ КОНТЕНТ */}
        <div className="admin-content-area">
          <div className="admin-card">
            <div className="admin-header-box">
              <div className="admin-title-row">
                <h2 className="admin-page-title">
                  <span className="admin-page-title-icon">🐾</span> База тварин
                </h2>
                <div className="sort-container">
                  <label>Сортувати:</label>
                  <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="custom-select-wrapper">
                    <option value="newest">Найновіші</option>
                    <option value="oldest">Найстаріші</option>
                    <option value="name">За алфавітом</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pet-grid">
              <div className="add-pet-card" onClick={handleAddOpen}>
                <div className="plus-icon">+</div>
                <h3>Додати хвостика</h3>
              </div>

              {filteredAndSortedPets.map((pet) => (
                <div
                  key={pet.Id}
                  className="pet-card-wrapper admin-mode"
                  onClick={() => navigate(`/admin/pets/${pet.Id}`)}
                  style={{ cursor: 'pointer' }}
                >
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
                    <select
                      value={petFormData.Type}
                      onChange={e => setPetFormData({ ...petFormData, Type: e.target.value })}
                      className="form-control"
                    >
                      {petTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="add-type-row" style={{ marginTop: '10px' }}>
                    <input
                      type="text"
                      placeholder="Інший вид..."
                      value={newType}
                      onChange={e => setNewType(e.target.value)}
                      className="form-control"
                    />
                    <button type="button" className="add-type-btn" onClick={handleAddNewType}>
                      +
                    </button>
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
                  onChange={e => setPetFormData({ ...petFormData, Status: e.target.value })} 
                  className="form-control"
                >
                  <option value="Шукає дім">🐾 Шукає дім</option>
                  <option value="Потребує особливого догляду">❤️‍🩹 Потребує особливого догляду</option>
                  <option value="На лікуванні">💊 На лікуванні</option>
                  <option value="Вже вдома">🏡 Вже вдома</option>
                  <option value="Не вдалось врятувати">🌈 Не вдалось врятувати</option>
                </select>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Вік</label>
                  <input type="text" placeholder="Наприклад: 9 місяців" value={petFormData.Age} onChange={e => setPetFormData({ ...petFormData, Age: e.target.value })} className="form-control" required />
                </div>
                <div className="input-group">
                  <label>Теги (через пробіл або кому)</label>
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

      {/* ВІКНО ПІДТВЕРДЖЕННЯ ВИДАЛЕННЯ */}
      {petToDelete && (
        <div className="modal-overlay" onClick={() => setPetToDelete(null)}>
          <div className="admin-modal" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#ef4444', fontSize: '24px', marginBottom: '10px' }}>⚠️ Видалення</h3>
            <p style={{ color: '#555', fontSize: '16px', marginBottom: '30px', lineHeight: '1.5' }}>
              Ви дійсно хочете назавжди видалити профіль цієї тваринки? Цю дію неможливо скасувати.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button className="cancel-btn" onClick={() => setPetToDelete(null)}>Скасувати</button>
              <button
                className="save-btn"
                style={{ background: '#ef4444', boxShadow: '0 5px 15px rgba(239, 68, 68, 0.3)' }}
                onClick={executeDelete}
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

export default AdminPets;