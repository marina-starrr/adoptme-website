import React, { useState } from 'react';
import BackgroundPaws from '../components/BackgroundPaws';
import { supabase } from '../supabaseClient'; // 👈 ДОДАНО ІМПОРТ SUPABASE
import './Help.css';
import { useToast } from '../context/ToastContext';

function Help() {
  const [openFaq, setOpenFaq] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [isSuccessScreen, setIsSuccessScreen] = useState(false);

  const [volunteerName, setVolunteerName] = useState('');
  const [volunteerPhone, setVolunteerPhone] = useState('');
  const [helpType, setHelpType] = useState('');
  const [preferredDay, setPreferredDay] = useState('');

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const openModal = () => {
    setIsSuccessScreen(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsModalClosing(false);
      setVolunteerName('');
      setVolunteerPhone('');
      setHelpType('');
      setPreferredDay('');
    }, 300);
  };

  const handlePhoneChange = (e) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (rawDigits.length === 0) { setVolunteerPhone(''); return; }
    let digits = rawDigits;
    if (!digits.startsWith('38')) digits = '38' + digits;
    digits = digits.substring(0, 12);
    let formatted = '+';
    if (digits.length > 0) formatted += digits.substring(0, 2);
    if (digits.length > 2) formatted += '(' + digits.substring(2, 5);
    if (digits.length > 5) formatted += ') ' + digits.substring(5, 8);
    if (digits.length > 8) formatted += ' ' + digits.substring(8, 10);
    if (digits.length > 10) formatted += ' ' + digits.substring(10, 12);
    setVolunteerPhone(formatted);
  };

  // 👇 ОНОВЛЕНА ФУНКЦІЯ ВІДПРАВКИ ДАНИХ
  const handleSubmit = async (e) => {
    e.preventDefault();

    const volunteerData = {
        PetIds: [], 
        UserNickname: localStorage.getItem('userNickname') || 'Гість',
        PetName: 'Волонтерство', // 👈 Маркер для адмінки, що це волонтер
        AdopterName: volunteerName,
        AdopterPhone: volunteerPhone,
        Reason: `Вид допомоги: ${helpType}. Зручний день: ${preferredDay}.`,
        LivingConditions: '-',
        HasExperience: false,
        HasOtherPets: false,
        Status: 'Нова'
    };

    const { error } = await supabase.from('AdoptionRequests').insert([volunteerData]);

    if (!error) {
        setIsSuccessScreen(true);
    } else {
        alert("Помилка відправки заявки: " + error.message);
    }
  };

  const faqs = [
    {
      question: "В які дні та години можна відвідати притулок?",
      answer: "Ми завжди раді гостям з понеділка по п'ятницю, з 08:30 до 16:30. У суботу та неділю притулок закритий для відвідувачів (вихідні дні)."
    },
    {
      question: "Чи потрібно попереджати про свій візит?",
      answer: "Так, ми дуже просимо заповнювати анкету на сторінці або телефонувати нам заздалегідь. Так ми зможемо вас зустріти, провести інструктаж та підказати, яка саме допомога сьогодні найбільш актуальна."
    },
    {
      question: "Чи можна приходити до притулку з дітьми?",
      answer: "Звісно! Спілкування з хвостиками дуже корисне та виховує емпатію. Проте, заради безпеки, діти до 16 років обов'язково повинні знаходитись на території притулку виключно у супроводі дорослих."
    },
    {
      question: "Як краще одягнутися, якщо я хочу допомогти руками?",
      answer: "Обирайте зручний, закритий одяг, який не шкода забруднити або зачепити, та комфортне закрите взуття (кросівки, черевики). Собаки дуже емоційні і можуть радісно стрибати на вас брудними лапками!"
    },
    {
      question: "Чи можу я вигуляти собаку, якщо в мене немає досвіду?",
      answer: "Так! Наші куратори підберуть для вас спокійну та дружню собачку, яка вміє гуляти на повідці, та детально розкажуть про всі правила безпечного вигулу."
    }
  ];

  return (
    <>
      <div className="help-section">
        <BackgroundPaws />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div className="help-header">
            <img src="/brush4.png" alt="Фон" className="header-brush" />
            <h2 className="header-text">Як допомогти?</h2>
          </div>

          <div className="help-intro">
            <p>
              Навіть година вашого часу чи невеликий пакуночок корму мають величезне значення. 
              Якщо ви знаходитесь у Житомирі або просто проїздом, завітайте до нас — наші хвостики завжди чекають на спілкування та вашу підтримку!
            </p>
          </div>

          <div className="volunteer-block">
            <h3 className="section-title">Стати волонтером</h3>
            <div className="volunteer-cards">
              <div className="vol-card">
                <div className="vol-icon-wrapper">
                  <img src="/dog-walking.png" alt="Вигул" className="vol-icon" />
                </div>
                <h4>Вигул собак</h4>
                <p>Собакам життєво необхідний рух та свіже повітря. Допоможіть нам з щоденним вигулом — це корисно і для вас, і для них!</p>
              </div>
              <div className="vol-card">
                <div className="vol-icon-wrapper">
                  <img src="/cleaning.png" alt="Прибирання" className="vol-icon" />
                </div>
                <h4>Прибирання та догляд</h4>
                <p>Чистота — запорука здоров'я. Нам завжди потрібні додаткові руки для прибирання вольєрів та миття мисочок.</p>
              </div>
              <div className="vol-card">
                <div className="vol-icon-wrapper">
                  <img src="/hugging.png" alt="Соціалізація" className="vol-icon" />
                </div>
                <h4>Соціалізація</h4>
                <p>Тваринкам потрібна увага. Просто приїхати, погладити котика чи погратися з цуценям — це адаптує їх до майбутньої родини.</p>
              </div>
            </div>
            <button className="action-btn" onClick={openModal}>Записатися</button>
          </div>

          <div className="needs-block">
            <h3 className="section-title">Що завжди потрібно притулку?</h3>
            <p className="needs-subtitle">Ви можете принести ці речі особисто або відправити поштою.</p>
            <div className="needs-grid">
              <div className="need-item">
                <img src="/food-bag.png" alt="Їжа" className="need-img" />
                <h5>Їжа та смаколики</h5>
                <p>Сухий та вологий корм для котів і собак, лікувальні дієти, крупи, м'ясні обрізки, жувальні смаколики.</p>
              </div>
              <div className="need-item">
                <img src="/medicine.png" alt="Ліки" className="need-img" />
                <h5>Медикаменти</h5>
                <p>Засоби від бліх та кліщів, глистогінні препарати, бинти, шприци, пелюшки, антисептики та вітаміни.</p>
              </div>
              <div className="need-item">
                <img src="/blanket.png" alt="Одяг і ковдри" className="need-img" />
                <h5>Теплі речі</h5>
                <p>Старі чисті ковдри, пледи, постільна білизна, рушники. Взимку потрібен теплий одяг для собак.</p>
              </div>
              <div className="need-item">
                <img src="/cleaning-tools.png" alt="Побутові речі" className="need-img" />
                <h5>Побутові речі</h5>
                <p>Миючі засоби (без хлору), губки, металеві відра, віники, гумові рукавички, сміттєві пакети.</p>
              </div>
              <div className="need-item">
                <img src="/toys.png" alt="Іграшки" className="need-img" />
                <h5>Іграшки та амуніція</h5>
                <p>М'ячики, канатики, кігтеточки, лотки, нашийники різних розмірів, міцні повідці, металеві миски.</p>
              </div>
            </div>
          </div>

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
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className={`help-modal-overlay ${isModalClosing ? 'closing' : ''}`}>
          <div className={`help-modal-content ${isModalClosing ? 'closing' : ''}`}>
            <span className="close-btn" onClick={closeModal}>&times;</span>

            {isSuccessScreen ? (
              <div className="success-message-container fade-view">
                <div className="success-icon">🙌</div>
                <h3 className="success-title">Дякуємо, {volunteerName}!</h3>
                <p className="success-text">Ваша заявка успішно надіслана.</p>
                <p className="success-text">Наш куратор зв'яжеться з вами найближчим часом для підтвердження часу та деталей.</p>
                <button className="action-btn" style={{ marginTop: '25px' }} onClick={closeModal}>Чудово!</button>
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
                      required 
                      className="vol-input"
                    />
                  </div>
                  
                  <div className="input-group">
                    <select 
                      value={helpType} 
                      onChange={(e) => setHelpType(e.target.value)} 
                      required 
                      className="vol-select"
                    >
                      <option value="" disabled>Як ви хочете допомогти?</option>
                      <option value="Вигул собак">Вигул собак</option>
                      <option value="Прибирання та догляд">Прибирання та догляд</option>
                      <option value="Соціалізація">Соціалізація тварин</option>
                      <option value="Інше">Інше (фото, машиною тощо)</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <select 
                      value={preferredDay} 
                      onChange={(e) => setPreferredDay(e.target.value)} 
                      required 
                      className="vol-select"
                    >
                      <option value="" disabled>Оберіть зручний день</option>
                      <option value="Понеділок">Понеділок</option>
                      <option value="Вівторок">Вівторок</option>
                      <option value="Середа">Середа</option>
                      <option value="Четвер">Четвер</option>
                      <option value="П'ятниця">П'ятниця</option>
                    </select>
                  </div>
                  
                  <p className="form-note">*Притулок відкритий для відвідувань Пн-Пт 08:30 – 16:30.</p>

                  <button type="submit" className="submit-volunteer-btn">Надіслати заявку</button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Help;