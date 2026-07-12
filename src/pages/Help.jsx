import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import BackgroundPaws from '../components/BackgroundPaws';
import { supabase } from '../supabaseClient';
import './Help.css';
import { useToast } from '../context/ToastContext';
import { AnimatePresence, motion } from 'framer-motion';

function Help() {
  const navigate = useNavigate();

  const [openFaq, setOpenFaq] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessScreen, setIsSuccessScreen] = useState(false);

  const [volunteerName, setVolunteerName] = useState('');
  const [volunteerPhone, setVolunteerPhone] = useState(''); 
  
  const [helpType, setHelpType] = useState('');
  const [customHelpType, setCustomHelpType] = useState('');
  
  const [preferredDay, setPreferredDay] = useState('');
  
  const [selectedPet, setSelectedPet] = useState(null);
  const [pets, setPets] = useState([]);

  const [isHelpTypeOpen, setIsHelpTypeOpen] = useState(false);
  const [isPetDropdownOpen, setIsPetDropdownOpen] = useState(false);

  const { showToast } = useToast();

  const todayObj = new Date();
  const todayStr = todayObj.toISOString().split('T')[0];
  const twoWeeksObj = new Date(todayObj);
  twoWeeksObj.setDate(todayObj.getDate() + 14);
  const twoWeeksStr = twoWeeksObj.toISOString().split('T')[0];

  useEffect(() => {
    const fetchPets = async () => {
      const { data, error } = await supabase.from('Pets').select('Id, Name, ImageName');
      if (!error && data) {
        setPets(data);
      }
    };
    fetchPets();
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const formatExistingPhone = (phoneStr) => {
    if (!phoneStr) return '';
    let digits = phoneStr.replace(/\D/g, '');
    
    if (digits.startsWith('380')) {
      digits = digits.substring(3);
    } else if (digits.startsWith('0')) {
      digits = digits.substring(1);
    } else if (digits.startsWith('38')) {
      digits = digits.substring(2);
    }
    
    digits = digits.substring(0, 9); 
    
    let formatted = '+38(0';
    if (digits.length > 0) formatted += digits.substring(0, 2);
    if (digits.length > 2) formatted += ') ' + digits.substring(2, 5);
    if (digits.length > 5) formatted += ' ' + digits.substring(5, 7);
    if (digits.length > 7) formatted += ' ' + digits.substring(7, 9);
    
    return formatted;
  };

  const openModal = async () => {
    const localNickname = localStorage.getItem('userNickname');

    if (!localNickname || localNickname === 'Гість') {
      showToast('⚠️ Будь ласка, увійдіть або зареєструйтесь, щоб надіслати заявку на волонтерство!');
      navigate('/login'); 
      return; 
    }

    setIsSuccessScreen(false);
    setIsModalOpen(true);

    let name = '';
    let phone = '';

    try {
      const { data: userData, error } = await supabase
        .from('Users')
        .select('FirstName, Phone')
        .eq('Nickname', localNickname)
        .maybeSingle();

      if (userData) {
        name = userData.FirstName || '';
        phone = userData.Phone || '';
      } else if (error) {
        console.error("Помилка завантаження з БД:", error);
      }
    } catch (err) {
      console.error("Помилка автоматичного завантаження профілю:", err);
    }

    if (!name) {
      name = localNickname;
    }

    if (name) setVolunteerName(name);
    if (phone) {
      setVolunteerPhone(formatExistingPhone(phone));
    } else {
      setVolunteerPhone(''); 
    }
  };

  // Виправлене закриття вікна без конфлікту анімацій
  const closeModal = () => {
    setIsModalOpen(false); 
  };

  const toggleDropdown = (dropdownName) => {
    if (dropdownName === 'help') {
      setIsHelpTypeOpen(!isHelpTypeOpen);
      setIsPetDropdownOpen(false);
    } else if (dropdownName === 'pet') {
      setIsPetDropdownOpen(!isPetDropdownOpen);
      setIsHelpTypeOpen(false);
    }
  };

  const handlePhoneChange = (e) => {
    let input = e.target.value;
    
    if (input.length < 5 || !input.startsWith('+38(0')) {
      setVolunteerPhone('+38(0');
      return;
    }
    
    let rawAfter = input.substring(5).replace(/\D/g, '');
    rawAfter = rawAfter.substring(0, 9);
    
    let formatted = '+38(0';
    if (rawAfter.length > 0) formatted += rawAfter.substring(0, 2);
    if (rawAfter.length > 2) formatted += ') ' + rawAfter.substring(2, 5);
    if (rawAfter.length > 5) formatted += ' ' + rawAfter.substring(5, 7);
    if (rawAfter.length > 7) formatted += ' ' + rawAfter.substring(7, 9);
    
    setVolunteerPhone(formatted);
  };

  const formatToDDMMYYYY = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}.${y}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!helpType || !preferredDay || (helpType === 'Інше' && !customHelpType.trim())) {
      showToast("⚠️ Будь ласка, заповніть усі необхідні поля.");
      return;
    }

    const finalHelpType = helpType === 'Інше' ? `Інше (${customHelpType.trim()})` : helpType;
    const formattedDate = formatToDDMMYYYY(preferredDay);

    const volunteerData = {
      PetIds: selectedPet ? [selectedPet.Id] : [],
      UserNickname: localStorage.getItem('userNickname') || 'Гість',
      PetName: selectedPet ? `Волонтерство (${selectedPet.Name})` : 'Волонтерство', 
      AdopterName: volunteerName,
      AdopterPhone: volunteerPhone,
      Reason: `Вид допомоги: ${finalHelpType}.\nЗручний день: ${formattedDate}.`,
      LivingConditions: '-',
      HasExperience: false,
      HasOtherPets: false,
      Status: 'Нова'
    };

    const { error } = await supabase.from('AdoptionRequests').insert([volunteerData]);

    if (!error) {
      setIsSuccessScreen(true);
    } else {
      showToast("❌ Помилка відправки заявки: " + error.message);
    }
  };

  const getPetImage = (pet) => {
    if (!pet || !pet.ImageName) return '/paw-placeholder.png';
    
    try {
      let fileName = null;

      if (Array.isArray(pet.ImageName)) {
        fileName = pet.ImageName.length > 0 ? pet.ImageName[0] : null;
      } else if (typeof pet.ImageName === 'string') {
        if (pet.ImageName.trim().startsWith('[')) {
          const validJsonString = pet.ImageName.replace(/'/g, '"');
          const parsed = JSON.parse(validJsonString);
          fileName = parsed.length > 0 ? parsed[0] : null;
        } else if (pet.ImageName.includes(',')) {
          fileName = pet.ImageName.split(',')[0].trim();
        } else {
          fileName = pet.ImageName.trim();
        }
      }

      if (!fileName) return '/paw-placeholder.png';
      if (fileName.startsWith('http')) return fileName;

      const { data } = supabase.storage.from('pets').getPublicUrl(fileName);
      return data.publicUrl;
      
    } catch (e) {
      console.error("Помилка обробки фото:", e);
      return '/paw-placeholder.png';
    }
  };

  const faqs = [
    { question: "В які дні та години можна відвідати притулок?", answer: "Ми завжди раді гостям з понеділка по п'ятницю, з 08:30 до 16:30." },
    { question: "Чи потрібно попереджати про свій візит?", answer: "Так, заповнюйте анкету або телефонуйте нам заздалегідь." },
    { question: "Чи можна приходити до притулку з дітьми?", answer: "Звісно! Але діти до 16 років повинні бути з дорослими." },
    { question: "Як краще одягнутися?", answer: "Обирайте зручний, закритий одяг, який не шкода забруднити." },
    { question: "Чи можу я вигуляти собаку, якщо в мене немає досвіду?", answer: "Так! Наші куратори підберуть спокійну собачку та все розкажуть." }
  ];

  return (
    <>
      <div className="help-section">
        <BackgroundPaws />

        <div className="help-content-wrapper">
          <div className="help-header">
            <img src="/brush4.png" alt="Фон" className="header-brush" />
            <h2 className="header-text">Як допомогти?</h2>
          </div>

          <div className="help-intro">
            <p>Навіть година вашого часу чи невеликий пакуночок корму мають величезне значення. Якщо ви знаходитесь у Житомирі або просто проїздом, завітайте до нас!</p>
          </div>

          <div className="volunteer-block">
            <h3 className="section-title">Стати волонтером</h3>
            <div className="volunteer-cards">
              <div className="vol-card">
                <div className="vol-icon-wrapper"><img src="/dog-walking.png" alt="Вигул" className="vol-icon" /></div>
                <h4>Вигул собак</h4>
                <p>Собакам життєво необхідний рух та свіже повітря.</p>
              </div>
              <div className="vol-card">
                <div className="vol-icon-wrapper"><img src="/cleaning.png" alt="Прибирання" className="vol-icon" /></div>
                <h4>Прибирання та догляд</h4>
                <p>Нам завжди потрібні додаткові руки для прибирання вольєрів.</p>
              </div>
              <div className="vol-card">
                <div className="vol-icon-wrapper"><img src="/hugging.png" alt="Соціалізація" className="vol-icon" /></div>
                <h4>Соціалізація</h4>
                <p>Просто приїхати, погладити котика чи погратися з цуценям.</p>
              </div>
            </div>
            <button className="volunteer-action-btn" onClick={openModal}>Записатися</button>
          </div>

          <div className="page-separator"><span>🐾</span></div>

          <div className="needs-block">
            <h3 className="section-title">Що завжди потрібно притулку?</h3>
            <p className="needs-subtitle">Ви можете принести ці речі особисто або відправити поштою.</p>
            <div className="needs-grid">
              <div className="need-item"><img src="/food-bag.png" alt="Їжа" className="need-img" /><h5>Їжа та смаколики</h5></div>
              <div className="need-item"><img src="/medicine.png" alt="Ліки" className="need-img" /><h5>Медикаменти</h5></div>
              <div className="need-item"><img src="/blanket.png" alt="Одяг" className="need-img" /><h5>Теплі речі</h5></div>
              <div className="need-item"><img src="/cleaning-tools.png" alt="Побутові" className="need-img" /><h5>Побутові речі</h5></div>
              <div className="need-item"><img src="/toys.png" alt="Іграшки" className="need-img" /><h5>Іграшки та амуніція</h5></div>
            </div>
          </div>

          <div className="page-separator"><span>🐾</span></div>

          <div className="faq-block">
            <h3 className="section-title">Правила відвідування (FAQ)</h3>
            <div className="faq-container">
              {faqs.map((faq, index) => (
                <div key={index} className={`faq-item ${openFaq === index ? 'active' : ''}`}>
                  <button className="faq-question" onClick={() => toggleFaq(index)}>
                    {faq.question}
                    <span className="faq-toggle-icon">{openFaq === index ? '−' : '+'}</span>
                  </button>
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="faq-contact-prompt">
              <p>
                Не знайшли відповіді на своє запитання? <Link to="/contact">Зв'яжіться з нами</Link>
              </p>
            </div>
          </div>

        </div>
      </div>

      <AnimatePresence 
        onExitComplete={() => {
          setVolunteerName('');
          setVolunteerPhone('');
          setHelpType('');
          setCustomHelpType('');
          setPreferredDay('');
          setSelectedPet(null);
          setIsHelpTypeOpen(false);
          setIsPetDropdownOpen(false);
          setIsSuccessScreen(false);
        }}
      >
          {isModalOpen && (
            <motion.div 
                key="modal-overlay"
                className="help-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={closeModal} 
            >
              <motion.div 
                  className="help-modal-content"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  onClick={(e) => e.stopPropagation()} 
              >
                <span className="close-btn" onClick={closeModal}>&times;</span>

                {isSuccessScreen ? (
                  <div className="success-message-container fade-view">
                    <div className="success-icon">🙌</div>
                    <h3 className="success-title">Дякуємо, {volunteerName}!</h3>
                    <p className="success-text">Ваша заявка успішно надіслана.</p>
                    <p className="success-text">Наш куратор зв'яжеться з вами найближчим часом для підтвердження часу та деталей.</p>
                    <button type="button" className="volunteer-action-btn success-close-btn" onClick={closeModal}>Чудово!</button>
                  </div>
                ) : (
                  <div className="fade-view">
                    <div className="modal-header">
                      <h3>Анкета волонтера</h3>
                    </div>
                    
                    <form className="volunteer-form" onSubmit={handleSubmit}>
                      <div className="input-group">
                        <input 
                          type="text" 
                          placeholder="Ваше ім'я" 
                          value={volunteerName} 
                          onChange={(e) => setVolunteerName(e.target.value)} 
                          required 
                          className="vol-input" 
                        />
                      </div>
                      <div className="input-group">
                        <input 
                          type="text" 
                          placeholder="+38(0__) ___ __ __" 
                          value={volunteerPhone} 
                          onChange={handlePhoneChange}
                          onFocus={() => {
                            if (volunteerPhone === '') setVolunteerPhone('+38(0');
                          }}
                          onBlur={() => {
                            if (volunteerPhone === '+38(0') setVolunteerPhone('');
                          }}
                          required 
                          className="vol-input" 
                        />
                      </div>
                      
                      <div className="input-group">
                        <div className="custom-dropdown">
                          <div 
                            className={`vol-input dropdown-display ${isHelpTypeOpen ? 'open-down' : ''}`}
                            onClick={() => toggleDropdown('help')}
                          >
                            {helpType ? <span className="dropdown-selected">{helpType}</span> : <span className="dropdown-placeholder">Як ви хочете допомогти?</span>}
                            <span className="dropdown-arrow">{isHelpTypeOpen ? '▲' : '▼'}</span>
                          </div>
                          
                          {isHelpTypeOpen && (
                            <div className="dropdown-list down">
                              {['Вигул собак', 'Прибирання та догляд', 'Соціалізація тварин', 'Інше'].map(option => (
                                <div key={option} className="dropdown-option" onClick={() => { setHelpType(option); setIsHelpTypeOpen(false); }}>
                                  <span>{option}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {helpType === 'Інше' && (
                        <div className="input-group fade-view">
                          <input 
                            type="text" 
                            placeholder="Напишіть, як саме ви хочете допомогти..." 
                            value={customHelpType} 
                            onChange={(e) => setCustomHelpType(e.target.value)} 
                            required 
                            className="vol-input" 
                          />
                        </div>
                      )}

                      <div className="input-group">
                        <label className="date-input-label">
                          Оберіть зручний день
                        </label>
                        <input
                          type="date"
                          value={preferredDay}
                          min={todayStr}
                          max={twoWeeksStr}
                          onChange={(e) => {
                            const selectedDate = e.target.value;
                            if (selectedDate) {
                              const dateObj = new Date(selectedDate);
                              const dayOfWeek = dateObj.getDay();
                              if (dayOfWeek === 0) {
                                showToast("❌ Притулок закритий у неділю. Будь ласка, оберіть інший день.");
                                setPreferredDay('');
                                return;
                              }
                            }
                            setPreferredDay(selectedDate);
                          }}
                          required
                          className={`vol-input date-input ${preferredDay ? 'has-value' : ''}`}
                        />
                      </div>

                      <div className="input-group">
                        <div className="custom-dropdown">
                          <div 
                            className={`vol-input dropdown-display ${isPetDropdownOpen ? 'open-up' : ''}`}
                            onClick={() => toggleDropdown('pet')}
                          >
                            {selectedPet ? (
                              <div className="selected-pet-info">
                                <img src={getPetImage(selectedPet)} alt={selectedPet.Name} className="pet-selector-img" />
                                <span className="dropdown-selected">{selectedPet.Name}</span>
                              </div>
                            ) : (
                              <span className="dropdown-placeholder">Оберіть хвостика (за бажанням)</span>
                            )}
                            <span className="dropdown-arrow">{isPetDropdownOpen ? '▲' : '▼'}</span>
                          </div>

                          {isPetDropdownOpen && (
                            <div className="dropdown-list up">
                              <div 
                                className="dropdown-option" 
                                onClick={() => { setSelectedPet(null); setIsPetDropdownOpen(false); }}
                              >
                                <span className="any-pet-text">Будь-який хвостик</span>
                              </div>
                              {pets.map(pet => (
                                <div 
                                  key={pet.Id} 
                                  className="dropdown-option pet-option-flex" 
                                  onClick={() => { setSelectedPet(pet); setIsPetDropdownOpen(false); }}
                                >
                                  <img src={getPetImage(pet)} alt={pet.Name} className="pet-option-img" />
                                  <span>{pet.Name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <p className="form-note">*Притулок відкритий для відвідувань Пн-Сб 08:30 – 16:30.</p>

                      <button type="submit" className="submit-volunteer-btn">Надіслати заявку</button>
                    </form>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
      </AnimatePresence>
    </>
  );
}

export default Help;