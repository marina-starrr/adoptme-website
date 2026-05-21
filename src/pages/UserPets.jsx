import { useState, useEffect, useRef } from 'react';
import UserPetCard from '../components/UserPetCard';
import BackgroundPaws from '../components/BackgroundPaws';
import { supabase } from '../supabaseClient';
import './UserPets.css';

// 🌟 КАСТОМНИЙ ВИТОНЧЕНИЙ ВИПАДАЮЧИЙ СПИСОК (Без системного дизайну)
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

function UserPets() {
  const [petsList, setPetsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Стейти фільтрів та сортування
  const [petTypes, setPetTypes] = useState([{ value: 'Всі', label: 'Всі види' }]);
  const [filterType, setFilterType] = useState('Всі');
  const [filterGender, setFilterGender] = useState('Всі');
  const [filterAge, setFilterAge] = useState('Всі');
  const [filterStatus, setFilterStatus] = useState('Всі');
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    fetchPets();
  }, []);

  // Збираємо унікальні види тварин для фільтра
  useEffect(() => {
    if (petsList.length > 0) {
      const uniqueTypes = [...new Set(petsList.map(pet => pet.Type).filter(Boolean))];
      const typeOptions = [
        { value: 'Всі', label: 'Всі види' },
        ...uniqueTypes.map(type => ({ value: type, label: type }))
      ];
      setPetTypes(typeOptions);
    }
  }, [petsList]);

  async function fetchPets() {
    try {
      const { data, error } = await supabase
        .from('Pets')
        .select('*')
        .order('Id', { ascending: true });

      if (error) throw error;
      setPetsList(data || []);
    } catch (err) {
      console.error("❌ Помилка завантаження: ", err.message);
    } finally {
      setLoading(false);
    }
  }

  const getAgeInMonths = (ageStr) => {
    if (!ageStr) return 0;
    const lowerStr = ageStr.toLowerCase();
    const match = lowerStr.match(/(\d+([.,]\d+)?)/);
    if (!match) return 0;
    const num = parseFloat(match[0].replace(',', '.'));

    if (lowerStr.includes('рік') || lowerStr.includes('рок') || lowerStr.includes('р.')) return num * 12;
    if (lowerStr.includes('тиж')) return num * 0.25;
    if (lowerStr.includes('дн') || lowerStr.includes('день')) return num / 30;
    return num;
  };

  // Розумна фільтрація та сортування
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
      return b.Id - a.Id; // newest
    });

  const resetFilters = () => {
    setFilterType('Всі');
    setFilterGender('Всі');
    setFilterAge('Всі');
    setFilterStatus('Всі');
  };

  if (loading) return <h2 className="loading-message">Шукаємо пухнастиків... 🐾</h2>;

  return (
      <div className="pets-section">
        <BackgroundPaws />
        
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* ВЕЛИКИЙ ЗАГОЛОВОК ЗВЕРХУ */}
          <div className="pets-title-container">Знайди свого найкращого друга</div>

          {/* КОНТЕЙНЕР: САЙДБАР + КОНТЕНТ */}
          <div className="catalog-layout">
            
            {/* ⬅️ ЛІВА ПАНЕЛЬ: ФІЛЬТРИ */}
            <aside className="catalog-sidebar">
              <div className="sidebar-header">
                <h3>Фільтри</h3>
                <button className="reset-btn" onClick={resetFilters}>Скинути</button>
              </div>

              <div className="filter-block">
                <label>Вид тварини</label>
                <CustomDropdown 
                  options={petTypes} 
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
                    { value: 'На лікуванні', label: '💊 На лікуванні' }
                  ]} 
                  value={filterStatus} 
                  onChange={setFilterStatus} 
                />
              </div>
            </aside>

            {/* ➡️ ПРАВА ПАНЕЛЬ: СОРТУВАННЯ + СІТКА КАРТОК */}
            <main className="catalog-main">
              
              {/* Сортування зверху справа */}
              <div className="catalog-top-bar">
                <div className="results-count">
                  Знайдено пухнастиків: <strong>{filteredAndSortedPets.length}</strong>
                </div>
                <div className="sort-control">
                  <span className="sort-label">Сортувати:</span>
                  <div style={{ width: '200px' }}>
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

              {/* Сітка карток */}
              {filteredAndSortedPets.length === 0 ? (
                <div className="empty-catalog">
                  <h3>За вашими критеріями нікого не знайдено 😔</h3>
                  <p>Спробуйте змінити фільтри або скинути їх.</p>
                  <button className="reset-large-btn" onClick={resetFilters}>Показати всіх тваринок</button>
                </div>
              ) : (
                <div className="pet-grid">
                  {filteredAndSortedPets.map((pet) => (
                    <div key={pet.Id} className="pet-card-wrapper">
                      <UserPetCard
                        id={pet.Id}
                        name={pet.Name}
                        age={pet.Age}
                        gender={pet.Gender}
                        tags={pet.Tags} 
                        image={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${pet.ImageName}`}
                        status={pet.Status} 
                      />
                    </div>
                  ))}
                </div>
              )}
            </main>

          </div>
        </div>
      </div>
  );
}

export default UserPets;