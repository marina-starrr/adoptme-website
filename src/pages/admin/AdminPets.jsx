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
      const uniqueTypes = [...new Set(petsList.map(pet => pet.Type).