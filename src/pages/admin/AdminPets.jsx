import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import UserPetCard from '../../components/UserPetCard';
import { supabase } from '../../supabaseClient';
import './AdminPets.css';
import { useToast } from '../../context/ToastContext';

// Універсальний компонент випадаючого списку
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
    <div className={`custom-dropdown-container ${disabled ? 'disabled' : ''}`} ref={dropdownRef} style={{ width: '100%', opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto', position: 'relative' }}>
      <div
        className={`custom-dropdown-header ${isOpen ? 'open' : ''} form-control`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{ padding: '14px 18px', border: isOpen ? '1px solid #6847DD' : '1px solid rgba(104, 71, 221, 0.2)' }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && !disabled && (
        <div className="custom-dropdown-list-wrapper" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%', zIndex: 1000 }}>
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

  // Пагінація для адмінки (12 карток разом з плюсиком на першій сторінці)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentPetId, setCurrentPetId] = useState(null);
  const [petToDelete, setPetToDelete] = useState(null);

  const [isModalClosing, setIsModalClosing] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const [sortOrder, setSortOrder] = useState('newest');

  const { showToast } = useToast();

  const [petTypes, setPetTypes] = useState(['Кіт', 'Собака']);
  const [newType, setNewType] = useState('');

  const [petBreeds, setPetBreeds] = useState(['Безпородна', 'Не вказано']);
  const [newBreed, setNewBreed] = useState('');

  const defaultFavoriteFoods = ["М'яско", 'Рибка', 'Сухий корм', 'Вологий корм', 'Паштет', 'Смаколики', 'Усе смачненьке'];
  const [petFavoriteFoods, setPetFavoriteFoods] = useState(defaultFavoriteFoods);
  const [newFavoriteFood, setNewFavoriteFood] = useState('');

  const [filterType, setFilterType] = useState('Всі');
  const [filterBreed, setFilterBreed] = useState('Всі');
  const [filterGender, setFilterGender] = useState('Всі');
  const [filterAge, setFilterAge] = useState('Всі');
  const [filterStatus, setFilterStatus] = useState('Всі');
  const [filterSize, setFilterSize] = useState('Всі');
  const [filterEnergy, setFilterEnergy] = useState('Всі');
  const [filterVaccinated, setFilterVaccinated] = useState('Всі');
  const [filterTraining, setFilterTraining] = useState('Всі');

  const getAgeInMonths = (ageStr) => {
    if (!ageStr) return 0;
    const lowerStr = ageStr.toLowerCase();
    const match = lowerStr.match(/(\d+([.,]\d+)?)/);
    if (!match) return 0;
    const num = parseFloat(match[0]);
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
      const matchType = filterType === 'Всі' || (pet.Type || '').trim().toLowerCase() === filterType.trim().toLowerCase();
      const safePetBreed = pet.Breed ? pet.Breed.trim() : 'Безпородна';
      const matchBreed = filterBreed === 'Всі' || safePetBreed === filterBreed;
      const matchGender = filterGender === 'Всі' || (pet.Gender || '').trim().toLowerCase() === filterGender.trim().toLowerCase();

      const ageInMonths = getAgeInMonths(pet.Age);
      let matchAge = true;
      if (filterAge === 'До 6 місяців') matchAge = ageInMonths < 6;
      else if (filterAge === 'Від 6 міс. до 1 року') matchAge = ageInMonths >= 6 && ageInMonths <= 12;
      else if (filterAge === 'Від 1 до 3 років') matchAge = ageInMonths > 12 && ageInMonths <= 36;
      else if (filterAge === 'Більше 3 років') matchAge = ageInMonths > 36;

      const matchStatus = filterStatus === 'Всі' || (pet.Status || 'Шукає дім').trim().toLowerCase() === filterStatus.trim().toLowerCase();
      const safePetSize = pet.Size ? pet.Size.trim() : 'Середній';
      const matchSize = filterSize === 'Всі' || safePetSize === filterSize;
      const safePetEnergy = pet.EnergyLevel ? pet.EnergyLevel.trim() : 'Середній';
      const matchEnergy = filterEnergy === 'Всі' || safePetEnergy === filterEnergy;

      let matchVaccinated = true;
      if (filterVaccinated === 'Вакциновані') matchVaccinated = pet.IsVaccinated === true;
      else if (filterVaccinated === 'Не вакциновані') matchVaccinated = !pet.IsVaccinated;

      let matchTraining = true;
      if (filterTraining === 'Так') matchTraining = pet.NeedsTraining === true;
      else if (filterTraining === 'Ні') matchTraining = !pet.NeedsTraining;

      return matchType && matchBreed && matchGender && matchAge && matchStatus && matchSize && matchEnergy && matchVaccinated && matchTraining;
    })
    .sort((a, b) => {
      if (sortOrder === 'name') return (a.Name || '').localeCompare(b.Name || '');
      if (sortOrder === 'oldest') {
        const dateA = a.ArrivalDate ? new Date(a.ArrivalDate).getTime() : a.Id;
        const dateB = b.ArrivalDate ? new Date(b.ArrivalDate).getTime() : b.Id;
        return dateA - dateB;
      }
      const dateA = a.ArrivalDate ? new Date(a.ArrivalDate).getTime() : a.Id;
      const dateB = b.ArrivalDate ? new Date(b.ArrivalDate).getTime() : b.Id;
      return dateB - dateA;
    });

  // Автоматичне скидання пагінації на 1 сторінку при зміні фільтрів
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterBreed, filterGender, filterAge, filterStatus, filterSize, filterEnergy, filterVaccinated, filterTraining, sortOrder]);

  // 👇 ДОДАНО: Перенесення користувача на самий верх сторінки при перелистуванні сторінок
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Логіка зрізу: на першій сторінці беремо на 1 менше (бо є картка «Додати»)
  const totalItems = filteredAndSortedPets.length;
  const adminPageSize = currentPage === 1 ? ITEMS_PER_PAGE - 1 : ITEMS_PER_PAGE;
  
  // Рахуємо правильний зміщення індексів
  const offset = currentPage === 1 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE - 1;
  const paginatedPets = filteredAndSortedPets.slice(offset, offset + adminPageSize);
  const totalPages = Math.ceil((totalItems + 1) / ITEMS_PER_PAGE);

  const resetFilters = () => {
    setFilterType('Всі');
    setFilterBreed('Всі');
    setFilterGender('Всі');
    setFilterAge('Всі');
    setFilterStatus('Всі');
    setFilterSize('Всі');
    setFilterEnergy('Всі');
    setFilterVaccinated('Всі');
    setFilterTraining('Всі');
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

  const handleAddNewBreed = (e) => {
    e.preventDefault();
    if (newBreed.trim() && !petBreeds.includes(newBreed.trim())) {
      setPetBreeds([...petBreeds, newBreed.trim()]);
      setPetFormData({ ...petFormData, Breed: newBreed.trim() });
      setNewBreed('');
      showToast("✨ Нову породу додано до списку!");
    } else {
      showToast("⚠️ Така порода вже існує або назва порожня");
    }
  };

  const handleAddNewFavoriteFood = (e) => {
    e.preventDefault();
    if (newFavoriteFood.trim() && !petFavoriteFoods.includes(newFavoriteFood.trim())) {
      setPetFavoriteFoods([...petFavoriteFoods, newFavoriteFood.trim()]);
      setPetFormData({ ...petFormData, FavoriteFood: newFavoriteFood.trim() });
      setNewFavoriteFood('');
      showToast("✨ Нову улюблену їжу додано до списку!");
    } else {
      showToast("⚠️ Така їжа вже є в списку або назва порожня");
    }
  };

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const initialFormState = {
    Name: '', Type: 'Кіт', Breed: 'Безпородна', Age: '', Gender: 'Хлопчик', ImageName: '', Images: [], Tags: '', Description: '', HomeDescription: null, Status: 'Шукає дім', OwnerUserId: null, OwnerName: '', ArrivalDate: getTodayDate(), IsVaccinated: false, MedicalNotes: '', EnergyLevel: 'Середній', Friendliness: 'Дружелюбний до всіх', NeedsTraining: false, Size: 'Середній', FavoriteFood: "М'яско"
  };

  const [petFormData, setPetFormData] = useState(initialFormState);

  useEffect(() => {
    fetchPets();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (petsList.length > 0) {
      const uniqueTypes = [...new Set(petsList.map(pet => pet.Type).filter(Boolean))];
      setPetTypes([...new Set(['Кіт', 'Собака', ...uniqueTypes])]);

      const uniqueBreeds = [...new Set(petsList.map(pet => pet.Breed).filter(Boolean))];
      setPetBreeds([...new Set(['Безпородна', 'Не вказано', ...uniqueBreeds])]);

      const uniqueFavoriteFoods = [...new Set(petsList.map(pet => pet.FavoriteFood).filter(Boolean))];
      setPetFavoriteFoods([...new Set([...defaultFavoriteFoods, ...uniqueFavoriteFoods])]);
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
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, nickname');
    if (!error) {
      setUsersList(data || []);
    }
  }

  const closeEditModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsModalClosing(false);
    }, 300);
  };

  const closeDeleteModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setPetToDelete(null);
      setIsModalClosing(false);
    }, 300);
  };

  const handleEditOpen = (e, pet) => {
    e.preventDefault();
    e.stopPropagation();
    setEditMode(true);
    setCurrentPetId(pet.Id);

    setPetFormData({
      ...pet,
      Name: pet.Name || '', Type: pet.Type || 'Кіт', Breed: pet.Breed || 'Безпородна', Age: pet.Age || '', Gender: pet.Gender || 'Хлопчик', ImageName: pet.ImageName || '', Images: pet.Images || [], Tags: pet.Tags || '', Description: pet.Description || '', HomeDescription: pet.HomeDescription || '', Status: pet.Status || 'Шукає дім', OwnerUserId: pet.OwnerUserId || null, OwnerName: pet.OwnerName || '', ArrivalDate: pet.ArrivalDate || getTodayDate(), IsVaccinated: pet.IsVaccinated || false, MedicalNotes: pet.MedicalNotes || '', EnergyLevel: pet.EnergyLevel || 'Середній', Friendliness: pet.Friendliness || 'Дружелюбний до всіх', NeedsTraining: pet.NeedsTraining || false, Size: pet.Size || 'Середній', FavoriteFood: pet.FavoriteFood || "М'яско"
    });
    setSelectedFiles([]);
    setIsModalOpen(true);
  };

  const handleAddOpen = () => {
    setEditMode(false);
    setPetFormData(initialFormState);
    setSelectedFiles([]);
    setIsModalOpen(true);
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('pets').upload(fileName, file);
    if (uploadError) throw new Error('Помилка завантаження файлу: ' + uploadError.message);
    return fileName;
  };

  const handleSavePet = async (e) => {
    e.preventDefault();

    const todayStr = getTodayDate();
    if (petFormData.ArrivalDate > todayStr) {
      showToast("❌ Дата прибуття в притулок не може бути в майбутньому!");
      return;
    }

    setIsUploading(true);

    try {
      let finalImageName = petFormData.ImageName;
      let finalImages = petFormData.Images || [];

      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(file => uploadImage(file));
        const uploadedFileNames = await Promise.all(uploadPromises);

        finalImages = uploadedFileNames;
        finalImageName = uploadedFileNames[0];
      } else if (!editMode && !finalImageName) {
        showToast("❌ Будь ласка, оберіть хоча б одне photo чи відео!");
        setIsUploading(false);
        return;
      }

      const isHome = petFormData.Status === 'Вже вдома';

      const processTags = (tagString) => {
        if (!tagString) return '';
        return tagString
          .split(/[ ,]+/) 
          .filter(t => t.trim() !== '') 
          .map(t => t.startsWith('#') ? t : `#${t}`) 
          .join(' ');
      };

      const dataToSave = {
        ...petFormData,
        Tags: processTags(petFormData.Tags), 
        ImageName: finalImageName,
        Images: finalImages
      };

      if (!isHome) {
        dataToSave.OwnerUserId = null;
        dataToSave.OwnerName = null;
        dataToSave.HomeDescription = null;
      }

      if (editMode) {
        const oldPet = petsList.find(p => p.Id === currentPetId);
        const isStatusChanged = oldPet && oldPet.Status?.trim().toLowerCase() !== dataToSave.Status?.trim().toLowerCase();

        const { error } = await supabase.from('Pets').update(dataToSave).eq('Id', currentPetId);
        if (error) throw error;

        const cleanStatus = dataToSave.Status?.trim();
        if (isStatusChanged && ['На лікуванні', 'Вже вдома', 'Не вдалось врятувати', 'Заброньована', 'Шукає дім'].includes(cleanStatus)) {
          const targetStatus = cleanStatus === 'Вже вдома' ? 'Вже знайшла дім' : cleanStatus;

          const { data: favUsers } = await supabase.from('Favorites').select('user_id').eq('PetId', currentPetId);
          const validFavUsers = favUsers ? favUsers.filter(fav => fav.user_id) : [];

          if (validFavUsers.length > 0) {
            const notificationsToInsert = validFavUsers.map(fav => ({
              user_id: fav.user_id,
              PetId: currentPetId,
              PetName: dataToSave.Name,
              NewStatus: targetStatus,
              IsRead: false
            }));
            await supabase.from('FavoriteNotifications').insert(notificationsToInsert);
          }
        }
        showToast("✅ Профіль тваринки успішно оновлено!");
      } else {
        const { data: newPetData, error } = await supabase.from('Pets').insert([dataToSave]).select();
        if (error) throw error;

        if (newPetData && newPetData.length > 0) {
          const newPetId = newPetData[0].Id || newPetData[0].id;

          const { data: freshUsers } = await supabase.from('profiles').select('id');

          if (freshUsers && freshUsers.length > 0) {
            const notificationsToInsert = freshUsers.map(user => ({
              user_id: user.id,
              PetId: newPetId,
              PetName: dataToSave.Name,
              NewStatus: 'Новенький хвостик',
              IsRead: false
            }));

            await supabase.from('FavoriteNotifications').insert(notificationsToInsert);
          }
        }
        showToast("🎉 Нового хвостика успішно додано!");
      }

      closeEditModal();
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
    closeDeleteModal();
    try {
      const { error } = await supabase.from('Pets').delete().eq('Id', petToDelete);
      if (error) throw error;
      showToast("🗑️ Профіль успішно видалено!");
      setPetsList(prev => prev.filter(p => p.Id !== petToDelete));
    } catch (err) {
      showToast("❌ Помилка видалення: " + err.message);
    }
  };

  return (
    <div className="admin-page-wrap">
      <div className="admin-page-layout">
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
            <label>Порода</label>
            <CustomDropdown
              options={[
                { value: 'Всі', label: 'Будь-яка' },
                ...petBreeds.map(breed => ({ value: breed, label: breed }))
              ]}
              value={filterBreed}
              onChange={setFilterBreed}
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
            <label>Розмір</label>
            <CustomDropdown
              options={[
                { value: 'Всі', label: 'Будь-який' },
                { value: 'Маленький', label: 'Маленький' },
                { value: 'Середній', label: 'Середній' },
                { value: 'Великий', label: 'Великий' }
              ]}
              value={filterSize}
              onChange={setFilterSize}
            />
          </div>

          <div className="filter-block">
            <label>Рівень енергії</label>
            <CustomDropdown
              options={[
                { value: 'Всі', label: 'Будь-який' },
                { value: 'Низький', label: 'Низький' },
                { value: 'Середній', label: 'Середній' },
                { value: 'Високий', label: 'Високий' }
              ]}
              value={filterEnergy}
              onChange={setFilterEnergy}
            />
          </div>

          <div className="filter-block">
            <label>Вік</label>
            <CustomDropdown
              options={[
                { value: 'Всі', label: 'Будь-який' },
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
            <label>Вакцинація</label>
            <CustomDropdown
              options={[
                { value: 'Всі', label: 'Не важливо' },
                { value: 'Вакциновані', label: '💉 Вакциновані' },
                { value: 'Не вакциновані', label: '⚠️ Не вакциновані' }
              ]}
              value={filterVaccinated}
              onChange={setFilterVaccinated}
            />
          </div>

          <div className="filter-block">
            <label>Навчання / Дресирування</label>
            <CustomDropdown
              options={[
                { value: 'Всі', label: 'Не важливо' },
                { value: 'Так', label: 'Потребує навчання' },
                { value: 'Ні', label: 'Слухняна(ий)' }
              ]}
              value={filterTraining}
              onChange={setFilterTraining}
            />
          </div>

          <div className="filter-block">
            <label>Позначка (Статус тваринки)</label>
            <CustomDropdown
              options={[
                { value: 'Всі', label: 'Всі статуси' },
                { value: 'Шукає дім', label: '🐾 Шукає дім' },
                { value: 'Особливий догляд', label: '❤️‍🩹 Особливий догляд' },
                { value: 'На лікуванні', label: '💊 На лікуванні' },
                { value: 'Вже вдома', label: '🏡 Вже вдома' },
                { value: 'Не вдалось врятувати', label: '😞 Не вдалось врятувати' }
              ]}
              value={filterStatus}
              onChange={setFilterStatus}
            />
          </div>
        </aside>

        <div className="admin-content-area">
          <div className="admin-card">
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
              {/* Картка додавання відображається тільки на 1 сторінці */}
              {currentPage === 1 && (
                <div className="add-pet-card" onClick={handleAddOpen}>
                  <div className="plus-icon">+</div>
                  <h3>Додати хвостика</h3>
                </div>
              )}

              {paginatedPets.map((pet) => (
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

            {/* БЛОК ПАГІНАЦІЇ АДМІНІСТРАТОРА */}
            {totalPages > 1 && (
              <div className="pagination-container">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  «
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  »
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && createPortal(
        <div className={`modal-overlay ${isModalClosing ? 'closing' : ''}`} onClick={() => !isUploading && closeEditModal()}>
          <div className={`admin-modal ${isModalClosing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editMode ? "Редагування профілю" : "Новий підопічний"}</h3>
              <button className="close-x" onClick={closeEditModal} title="Закрити">×</button>
            </div>

            <form onSubmit={handleSavePet} className="admin-form">
              <div className="input-group">
                <label>Кличка тваринки</label>
                <input type="text" placeholder="Наприклад: Mars" value={petFormData.Name} onChange={e => setPetFormData({ ...petFormData, Name: e.target.value })} className="form-control" required />
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Вид тваринки</label>
                  <div className="add-type-row">
                    <CustomDropdown
                      options={petTypes.map(type => ({ value: type, label: type }))}
                      value={petFormData.Type}
                      onChange={val => setPetFormData({ ...petFormData, Type: val })}
                    />
                  </div>
                  <div className="add-type-row" style={{ marginTop: '10px' }}>
                    <input type="text" placeholder="Інший вид..." value={newType} onChange={e => setNewType(e.target.value)} className="form-control" />
                    <button type="button" className="add-type-btn" onClick={handleAddNewType}>+</button>
                  </div>
                </div>

                <div className="input-group">
                  <label>Порода</label>
                  <div className="add-type-row">
                    <CustomDropdown
                      options={petBreeds.map(breed => ({ value: breed, label: breed }))}
                      value={petFormData.Breed}
                      onChange={val => setPetFormData({ ...petFormData, Breed: val })}
                    />
                  </div>
                  <div className="add-type-row" style={{ marginTop: '10px' }}>
                    <input type="text" placeholder="Інша порода..." value={newBreed} onChange={e => setNewBreed(e.target.value)} className="form-control" />
                    <button type="button" className="add-type-btn" onClick={handleAddNewBreed}>+</button>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Стать</label>
                  <CustomDropdown
                    options={[
                      { value: 'Хлопчик', label: 'Хлопчик' },
                      { value: 'Дівчинка', label: 'Дівчинка' }
                    ]}
                    value={petFormData.Gender}
                    onChange={val => setPetFormData({ ...petFormData, Gender: val })}
                  />
                </div>

                <div className="input-group">
                  <label>Вік</label>
                  <input type="text" placeholder="Наприклад: 9 місяців" value={petFormData.Age} onChange={e => setPetFormData({ ...petFormData, Age: e.target.value })} className="form-control" required />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Дата прибуття в притулок</label>
                  <input type="date" value={petFormData.ArrivalDate} max={getTodayDate()} onChange={e => setPetFormData({ ...petFormData, ArrivalDate: e.target.value })} className="form-control" required />
                </div>
                <div className="input-group">
                  <label>Розмір</label>
                  <CustomDropdown
                    options={[
                      { value: 'Маленький', label: 'Маленький' },
                      { value: 'Середній', label: 'Середній' },
                      { value: 'Великий', label: 'Великий' }
                    ]}
                    value={petFormData.Size}
                    onChange={val => setPetFormData({ ...petFormData, Size: val })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Рівень енергії</label>
                  <CustomDropdown
                    options={[
                      { value: 'Низький', label: 'Низький' },
                      { value: 'Середній', label: 'Середній' },
                      { value: 'Високий', label: 'Високий' }
                    ]}
                    value={petFormData.EnergyLevel}
                    onChange={val => setPetFormData({ ...petFormData, EnergyLevel: val })}
                  />
                </div>
                <div className="input-group">
                  <label>Дружелюбність</label>
                  <CustomDropdown
                    options={[
                      { value: 'Дружелюбний до всіх', label: 'Дружелюбний до всіх' },
                      { value: 'Любить дітей', label: 'Любить дітей' },
                      { value: 'Добрий/а до інших тварин', label: 'Добрий/а до інших тварин' },
                      { value: 'Обережний / Потребує часу', label: 'Обережний / Потребує часу' }
                    ]}
                    value={petFormData.Friendliness}
                    onChange={val => setPetFormData({ ...petFormData, Friendliness: val })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Улюблена їжа</label>
                  <div className="add-type-row">
                    <CustomDropdown
                      options={petFavoriteFoods.map(food => ({ value: food, label: food }))}
                      value={petFormData.FavoriteFood || "М'яско"}
                      onChange={val => setPetFormData({ ...petFormData, FavoriteFood: val })}
                    />
                  </div>
                  <div className="add-type-row" style={{ marginTop: '10px' }}>
                    <input type="text" placeholder="Інша їжа..." value={newFavoriteFood} onChange={e => setNewFavoriteFood(e.target.value)} className="form-control" />
                    <button type="button" className="add-type-btn" onClick={handleAddNewFavoriteFood}>+</button>
                  </div>
                </div>

                <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '30px' }}>
                  <input type="checkbox" id="needsTraining" checked={petFormData.NeedsTraining} onChange={e => setPetFormData({ ...petFormData, NeedsTraining: e.target.checked })} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                  <label htmlFor="needsTraining" style={{ margin: 0, cursor: 'pointer' }}>Потребує дресирування / навчання</label>
                </div>
              </div>

              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#49109f' }}>Медичний статус</h4>
                <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <input type="checkbox" id="isVaccinated" checked={petFormData.IsVaccinated} onChange={e => setPetFormData({ ...petFormData, IsVaccinated: e.target.checked })} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                  <label htmlFor="isVaccinated" style={{ margin: 0, cursor: 'pointer', fontWeight: 'bold', color: '#2E7D32' }}>💉 Тваринка вакцинована</label>
                </div>
                <div className="input-group">
                  <label>Медичні нотатки (ліки, особливості)</label>
                  <textarea
                    placeholder="Наприклад: Потребує гіпоалергенний корм..."
                    value={petFormData.MedicalNotes || ''}
                    onChange={e => setPetFormData({ ...petFormData, MedicalNotes: e.target.value })}
                    className="form-control"
                    rows="3"
                    maxLength={300}
                  />
                  <div className="char-counter">
                    {petFormData.MedicalNotes?.length || 0} / 300
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label>Позначка (Статус тваринки)</label>
                <CustomDropdown
                  options={[
                    { value: 'Шукає дім', label: '🐾 Шукає дім' },
                    { value: 'Особливий догляд', label: '❤️‍🩹 Особливий догляд' },
                    { value: 'На лікуванні', label: '💊 На лікуванні' },
                    { value: 'Вже вдома', label: '🏡 Вже вдома' },
                    { value: 'Не вдалось врятувати', label: '😞 Не вдалось врятувати' },
                    { value: 'Заброньована', label: '🔒 Заброньована' }
                  ]}
                  value={petFormData.Status}
                  onChange={val => {
                    const newStatus = val;
                    let updatedFormData = { ...petFormData, Status: newStatus };

                    if (newStatus === 'Вже вдома') {
                      if (!updatedFormData.HomeDescription) {
                        updatedFormData.HomeDescription = "Ця тваринка вже знайшла свій дім і живе в щасті у новій люблячій родині!";
                      }
                    } else {
                      updatedFormData.HomeDescription = null;
                    }
                    setPetFormData(updatedFormData);
                  }}
                />
              </div>

              {petFormData.Status === 'Вже вдома' && (
                <div className="input-group" style={{ background: '#fdfbfe', padding: '15px', borderRadius: '12px', border: '1px solid #d4cbf9' }}>
                  <label style={{ color: '#6847DD', marginBottom: '8px' }}>🏡 Хто прихистив тваринку?</label>
                  <CustomDropdown
                    placeholder="-- Виберіть користувача --"
                    options={usersList.map(user => ({
                      value: user.id,
                      label: `${user.first_name} ${user.last_name} (@${user.nickname})`
                    }))}
                    value={petFormData.OwnerUserId || ''}
                    onChange={val => {
                      const selectedUser = usersList.find(u => u.id === val);
                      setPetFormData({
                        ...petFormData,
                        OwnerUserId: val || null,
                        OwnerName: selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}` : ''
                      });
                    }}
                  />
                </div>
              )}

              <div className="input-group">
                <label>Теги</label>
                <input type="text" placeholder="#добра #розумна" value={petFormData.Tags} onChange={e => setPetFormData({ ...petFormData, Tags: e.target.value })} className="form-control" />
              </div>

              <div className="input-group">
                <label>Фотографії або відео (можна обрати декілька)</label>
                <label className="file-upload-label">
                  <span className="file-upload-text">
                    {selectedFiles.length > 0
                      ? `✅ Обрано файлів: ${selectedFiles.length}`
                      : (editMode ? "🖼️ Натисніть, щоб замінити медіа (оберіть всі потрібні файли)" : "📷 Натисніть, щоб обрати photo/відео")}
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                    style={{ display: 'none' }}
                  />
                </label>
                {selectedFiles.length > 0 && (
                  <div style={{ marginTop: '10px', fontSize: '13px', color: '#6847DD', wordBreak: 'break-word', lineHeight: '1.4' }}>
                    <strong>Вибрані файли:</strong> {selectedFiles.map(f => f.name).join(', ')}
                  </div>
                )}
                {editMode && selectedFiles.length === 0 && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
                    * Якщо ви не оберете нових файлів, залишаться попередні зображення.
                  </div>
                )}
              </div>

              <div className="pet-story-block">
                <div style={{ marginBottom: '20px' }}>
                  <h3 className="section-subtitle" style={{ fontSize: '15px' }}>📖 Опис історії та характеру в притулку:</h3>
                  <div className="editable-container">
                    <textarea
                      value={petFormData.Description || ''}
                      onChange={e => setPetFormData({ ...petFormData, Description: e.target.value })}
                      className="inline-input input-desc"
                      required
                      rows="4"
                      maxLength={700}
                    />
                  </div>
                  <div className="char-counter">
                    {petFormData.Description?.length || 0} / 700
                  </div>
                </div>

                {petFormData.Status === 'Вже вдома' && (
                  <div style={{ background: '#fdfbfe', padding: '15px', borderRadius: '12px', border: '1px solid #d4cbf9' }}>
                    <h3 className="section-subtitle" style={{ color: '#6847DD', marginBottom: '10px', fontSize: '15px' }}>🏡 Історія успіху (Життя в новій родині):</h3>
                    <div className="editable-container">
                      <textarea
                        value={petFormData.HomeDescription || ''}
                        onChange={e => setPetFormData({ ...petFormData, HomeDescription: e.target.value })}
                        className="inline-input input-desc"
                        required
                        rows="4"
                        maxLength={700}
                      />
                    </div>
                    <div className="char-counter">
                      {petFormData.HomeDescription?.length || 0} / 700
                    </div>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={closeEditModal} disabled={isUploading}>Скасувати</button>
                <button type="submit" className="save-btn" disabled={isUploading}>
                  {isUploading ? 'Завантаження...' : 'Зберегти зміни'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {petToDelete && createPortal(
        <div className={`modal-overlay ${isModalClosing ? 'closing' : ''}`} onClick={closeDeleteModal}>
          <div className={`admin-modal confirm-modal ${isModalClosing ? 'closing' : ''}`} style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#ef4444', fontSize: '24px', marginBottom: '10px', marginTop: 0 }}>⚠️ Видалення</h3>
            <p style={{ color: '#555', fontSize: '16px', marginBottom: '30px', lineHeight: '1.5' }}>
              Ви дійсно хочете назавжди видалити профіль цієї тваринки? Цю дію неможливо скасувати.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button className="cancel-btn" onClick={closeDeleteModal}>Скасувати</button>
              <button className="save-btn" style={{ background: '#ef4444', boxShadow: '0 5px 15px rgba(239, 68, 68, 0.3)' }} onClick={executeDelete}>
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

export default AdminPets;