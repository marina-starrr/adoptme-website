import { useState, useEffect } from 'react';
import UserPetCard from '../../components/UserPetCard';
import { supabase } from '../../supabaseClient';
import './AdminPets.css';

function AdminPets() {
  const [petsList, setPetsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentPetId, setCurrentPetId] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [sortOrder, setSortOrder] = useState('newest');

  // 👇 1. Стан для нашого гарного повідомлення (Toast)
  const [toastMsg, setToastMsg] = useState('');

  // 👇 2. Стан для кастомного вікна підтвердження видалення (замість window.confirm)
  const [petToDelete, setPetToDelete] = useState(null);

  // 1. Додай цей стан у верхній частині AdminPets, поруч з іншими
  const [petTypes, setPetTypes] = useState(['Кіт', 'Собака']); // Початковий список
  const [newType, setNewType] = useState(''); // Стан для введення нового виду

  const [filterType, setFilterType] = useState('Всі');
  const [filterGender, setFilterGender] = useState('Всі');

  // Логіка фільтрації
  const filteredAndSortedPets = [...petsList]
    .filter(pet => {
      const matchType = filterType === 'Всі' || pet.Type === filterType;
      const matchGender = filterGender === 'Всі' || pet.Gender === filterGender;
      return matchType && matchGender;
    })
    .sort((a, b) => {
      if (sortOrder === 'name') return a.Name.localeCompare(b.Name);
      if (sortOrder === 'oldest') return a.Id - b.Id;
      return b.Id - a.Id;
    });

  // Функція скидання фільтрів
  const resetFilters = () => {
    setFilterType('Всі');
    setFilterGender('Всі');
    setSortOrder('newest');
  };

  // 2. Функція для додавання нового виду
  const handleAddNewType = (e) => {
    e.preventDefault();
    if (newType.trim() && !petTypes.includes(newType.trim())) {
      setPetTypes([...petTypes, newType.trim()]);
      setPetFormData({ ...petFormData, Type: newType.trim() }); // Одразу обираємо його
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
    Description: ''
  };

  const [petFormData, setPetFormData] = useState(initialFormState);

  // Функція показу Toast
  const showToast = (message) => {
    setToastMsg(message);
    setTimeout(() => setToastMsg(''), 3500);
  };

  useEffect(() => {
    fetchPets();
  }, []);

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
    setPetFormData({ ...pet });
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
        // 👇 Замінили alert на Toast
        showToast("❌ Будь ласка, оберіть фотографію!");
        setIsUploading(false);
        return;
      }

      const dataToSave = { ...petFormData, ImageName: finalImageName };

      if (editMode) {
        const { error } = await supabase.from('Pets').update(dataToSave).eq('Id', currentPetId);
        if (error) throw error;
        showToast("✅ Профіль тваринки успішно оновлено!"); // Toast успіху
      } else {
        const { error } = await supabase.from('Pets').insert([dataToSave]);
        if (error) throw error;
        showToast("🎉 Нового хвостика успішно додано!"); // Toast успіху
      }

      setIsModalOpen(false);
      fetchPets();
    } catch (error) {
      // 👇 Замінили alert на Toast
      showToast("❌ Помилка: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // 👇 Відкриваємо кастомне вікно видалення замість alert/confirm
  const confirmDeleteClick = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setPetToDelete(id);
  };

  // 👇 Виконуємо видалення
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

  const sortedPets = [...petsList].sort((a, b) => {
    if (sortOrder === 'name') return a.Name.localeCompare(b.Name);
    if (sortOrder === 'oldest') return a.Id - b.Id;
    return b.Id - a.Id; // default: newest
  });

  return (
    <div className="admin-main page-transition" style={{ position: 'relative' }}>
      <div className="admin-page-layout">
        
        {/* 👇 САЙДБАР ФІЛЬТРІВ */}
        <aside className="admin-sidebar">
          <h3 className="sidebar-title">🔍 Фільтри</h3>
          
          <div className="filter-group">
            <label>Вид тварини</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="custom-select-wrapper" style={{width: '100%'}}>
              <option value="Всі">Всі види</option>
              {petTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Стать</label>
            <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="custom-select-wrapper" style={{width: '100%'}}>
              <option value="Всі">Всі</option>
              <option value="Хлопчик">Хлопчик</option>
              <option value="Дівчинка">Дівчинка</option>
            </select>
          </div>

          <button className="reset-filters-btn" onClick={resetFilters}>Скинути фільтри</button>
        </aside>

        {/* 👇 ОСНОВНИЙ КОНТЕНТ */}
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
                <div key={pet.Id} className="pet-card-wrapper admin-mode">
                  <div className="admin-card-actions">
                    <button className="edit-icon-btn" onClick={(e) => handleEditOpen(e, pet)}>✎</button>
                    <button className="delete-icon-btn" onClick={(e) => confirmDeleteClick(e, pet.Id)}>×</button>
                  </div>
                  <UserPetCard {...pet} image={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${pet.ImageName}`} />
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
              <button className="close-x" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleSavePet} className="admin-form">
              <div className="input-group">
                <label>Кличка тваринки</label>
                <input type="text" placeholder="Наприклад: Марс" value={petFormData.Name} onChange={e => setPetFormData({ ...petFormData, Name: e.target.value })} required />
              </div>

              <div className="form-row">
                {/* Заміни свій старий блок Вид на цей: */}
                <div className="input-group">
                  <label>Вид тваринки</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <select
                      value={petFormData.Type}
                      onChange={e => setPetFormData({ ...petFormData, Type: e.target.value })}
                      className="custom-select-wrapper" /* Використовуємо той самий клас CSS */
                      style={{ flex: 1 }}
                    >
                      {petTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Додаткове поле для введення нового виду */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <input
                      type="text"
                      placeholder="Інший вид..."
                      value={newType}
                      onChange={e => setNewType(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="save-btn"
                      onClick={handleAddNewType}
                      style={{ padding: '0 15px', background: '#6847DD' }}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="input-group">
                  <label>Стать</label>
                  <select value={petFormData.Gender} onChange={e => setPetFormData({ ...petFormData, Gender: e.target.value })}>
                    <option>Хлопчик</option>
                    <option>Дівчинка</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Вік</label>
                  <input type="text" placeholder="2 міс. / 1 рік" value={petFormData.Age} onChange={e => setPetFormData({ ...petFormData, Age: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label>Теги (через кому)</label>
                  <input type="text" placeholder="грайливий, лагідний" value={petFormData.Tags} onChange={e => setPetFormData({ ...petFormData, Tags: e.target.value })} />
                </div>
              </div>

              <div className="file-upload-container">
                <label>Фотографія</label>
                <label className="file-upload-label"> {/* <--- ВИПРАВЛЕНО НА LABEL */}
                  {selectedFile ? `✅ Обрано: ${selectedFile.name}` : (editMode ? "🖼️ Залишити поточне або змінити" : "📷 Обрати фото з пристрою")}
                  <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files[0])} style={{ display: 'none' }} />
                </label>
              </div>

              <div className="input-group">
                <label>Опис історії та характеру</label>
                <textarea placeholder="Опишіть тваринку детальніше..." value={petFormData.Description} onChange={e => setPetFormData({ ...petFormData, Description: e.target.value })} required rows="4"></textarea>
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

      {/* 👇 НОВЕ: Красиве вікно підтвердження видалення */}
      {petToDelete && (
        <div className="modal-overlay" onClick={() => setPetToDelete(null)}>
          <div className="admin-modal" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#ef4444', fontSize: '24px', marginBottom: '10px' }}>⚠️ Видалення</h3>
            <p style={{ color: '#555', fontSize: '16px', marginBottom: '30px' }}>
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