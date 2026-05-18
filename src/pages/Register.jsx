import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import { supabase } from '../supabaseClient'; 
import './Login.css'; 

function Register() {
  const [nickname, setNickname] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [toastMsg, setToastMsg] = useState(''); 
  const navigate = useNavigate();
  const { login } = useAuth(); 

  const showToast = (message) => {
      setToastMsg(message);
      setTimeout(() => setToastMsg(''), 3500);
  };

  // Красиве форматування телефону, яке у тебе вже було в анкеті
  const handlePhoneChange = (e) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (rawDigits.length === 0) { setPhone(''); return; }
    let digits = rawDigits;
    if (!digits.startsWith('38')) digits = '38' + digits;
    digits = digits.substring(0, 12);
    let formatted = '+';
    if (digits.length > 0) formatted += digits.substring(0, 2);
    if (digits.length > 2) formatted += '(' + digits.substring(2, 5);
    if (digits.length > 5) formatted += ') ' + digits.substring(5, 8);
    if (digits.length > 8) formatted += ' ' + digits.substring(8, 10);
    if (digits.length > 10) formatted += ' ' + digits.substring(10, 12);
    setPhone(formatted);
  };

  const handleRegister = async (e) => { 
    e.preventDefault();
    
    // 👇 1. Додаємо перевірку на мінімальну довжину пароля
    if (password.length < 6) {
        showToast('❌ Пароль має містити мінімум 6 символів!');
        return;
    }

    // 2. Перевірка на співпадіння паролів
    if (password !== confirmPassword) {
        showToast('❌ Паролі не співпадають!');
        return;
    }

    try {
        const { error } = await supabase
            .from('Users')
            .insert([
                { 
                  Nickname: nickname.trim(), 
                  FirstName: firstName.trim(), 
                  LastName: lastName.trim(), 
                  Phone: phone, 
                  Email: email.trim(), 
                  Password: password 
                }
            ]);

        if (error) {
            if (error.code === '23505') {
                showToast('🐾 Нікнейм або Email вже зайняті!');
            } else {
                showToast('❌ Помилка при реєстрації!');
            }
            return;
        }

        // Зберігаємо НІКНЕЙМ як головний ідентифікатор сесії
        localStorage.setItem('userNickname', nickname.trim());
        localStorage.setItem('userRole', 'user'); 
        login(); 
        window.dispatchEvent(new Event('authChanged')); 

        navigate('/', { 
            state: { welcomeMsg: '✅ Реєстрація успішна! Вітаємо в родині AdoptMe 🐾' } 
        }); 

    } catch (err) {
        showToast('❌ Сталася непередбачувана помилка!');
    }
  };

  return (
    <div className="login-page page-transition" style={{ position: 'relative' }}>
      {toastMsg && <div className="custom-toast">{toastMsg}</div>}

      <div className="login-card" style={{ maxWidth: '450px' }}>
        <h2>Реєстрація 🐾</h2>
        <p>Створіть акаунт за індивідуальним нікнеймом</p>
        
        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label>Унікальний Нікнейм</label>
            <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Введіть нікнейм..." required />
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Ім'я</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ім'я" required />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Прізвище</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Прізвище" required />
              </div>
          </div>

          <div className="input-group">
            <label>Телефон</label>
            <input type="text" value={phone} onChange={handlePhoneChange} placeholder="+38(0__) ___ __ __" required />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vash@mail.com" required />
          </div>
          
          <div className="input-group">
            <label>Пароль</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Створіть пароль" required />
          </div>

          <div className="input-group">
            <label>Повторіть пароль</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Повторіть пароль" required />
          </div>
          
          <button type="submit" className="login-submit-btn">Зареєструватися</button>
        </form>

        <div className="register-link-container" style={{ marginTop: '15px', textAlign: 'center' }}>
            <p>Вже маєте акаунт? <Link to="/login" style={{ color: '#6d4ce4', fontWeight: 'bold' }}>Увійти</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Register;