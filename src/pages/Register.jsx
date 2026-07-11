import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import './Login.css';
import { useToast } from '../context/ToastContext';

function Register() {
  const [nickname, setNickname] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [secretQuestion, setSecretQuestion] = useState('Як звали вашого першого домашнього улюбленця?');
  const [secretAnswer, setSecretAnswer] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const handlePhoneChange = (e) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (rawDigits.length === 0) { setPhone(''); return; }
    let digits = rawDigits;
    if (!digits.startsWith('380')) digits = '380' + digits;
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('❌ Будь ласка, введіть коректну адресу електронної пошти!');
      return;
    }

    if (password.length < 6) {
      showToast('❌ Пароль має містити мінімум 6 символів!');
      return;
    }

    if (password !== confirmPassword) {
      showToast('❌ Паролі не співпадають!');
      return;
    }

    if (!secretAnswer.trim()) {
      showToast('❌ Будь ласка, дайте відповідь на секретне запитання!');
      return;
    }

    try {
      const cleanedNickname = nickname.trim();
      const cleanedEmail = email.trim();
      const cleanedPhone = phone.replace(/\D/g, '');

      const { data: existingUsers, error: checkError } = await supabase
        .from('Users')
        .select('Nickname, Email, Phone')
        .or(`Nickname.eq.${cleanedNickname},Email.eq.${cleanedEmail},Phone.eq.${cleanedPhone}`);

      if (checkError) {
        showToast('❌ Помилка перевірки даних!');
        return;
      }

      if (existingUsers && existingUsers.length > 0) {
        if (existingUsers.some(u => u.Nickname === cleanedNickname)) showToast('❌ Цей Нікнейм вже зайнятий!');
        else if (existingUsers.some(u => u.Email === cleanedEmail)) showToast('❌ Цей Email вже зареєстровано!');
        else if (existingUsers.some(u => u.Phone === cleanedPhone)) showToast('❌ Цей номер телефону вже використовується!');
        return;
      }

      const { error: insertError } = await supabase
        .from('Users')
        .insert([
          {
            Nickname: cleanedNickname,
            FirstName: firstName.trim(),
            LastName: lastName.trim(),
            Phone: cleanedPhone,
            Email: cleanedEmail,
            Password: password,
            SecretQuestion: secretQuestion,
            SecretAnswer: secretAnswer.trim().toLowerCase()
          }
        ]);

      if (insertError) {
        showToast('❌ Помилка при реєстрації!');
        console.error("Insert Error:", insertError);
        return;
      }

      localStorage.setItem('userNickname', cleanedNickname);
      localStorage.setItem('userRole', 'user');
      login();
      window.dispatchEvent(new Event('authChanged'));

      navigate('/', {
        state: { welcomeMsg: '✅ Реєстрація успішна! Вітаємо в родині AdoptMe 🐾' }
      });

    } catch (err) {
      showToast('❌ Сталася непередбачувана помилка!');
      console.error(err);
    }
  };

  return (
    <div className="login-page" style={{ position: 'relative' }}>
      <div className="login-card" style={{ maxWidth: '450px' }}>
        <h2>Реєстрація 🐾</h2>
        <p>Створіть акаунт за індивідуальним нікнеймом</p>

        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label>Унікальний Нікнейм</label>
            <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Наприклад: @ivan" maxLength="20" required />
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Ім'я</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ім'я" maxLength="30" required />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Прізвище</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Прізвище" maxLength="30" required />
            </div>
          </div>

          <div className="input-group">
            <label>Телефон</label>
            <input type="text" value={phone} onChange={handlePhoneChange} placeholder="+38(0__) ___ __ __" maxLength="19" required />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vash@mail.com" maxLength="30" required />
          </div>

          <div className="input-group">
            <label>Пароль</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Створіть пароль"
                maxLength="50"
                required
              />
              <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "🙉" : "🙈"}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label>Повторіть пароль</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторіть пароль"
                maxLength="64"
                required
              />
              <button type="button" className="toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? "🙉" : "🙈"}
              </button>
            </div>
          </div>

          <div className="input-group" style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
            <label>Секретне запитання</label>
            <p>Для відновлення паролю</p>
            <select
              value={secretQuestion}
              onChange={(e) => setSecretQuestion(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '10px' }}
            >
              <option value="Як звали вашого першого домашнього улюбленця?">Як звали вашого першого домашнього улюбленця?</option>
              <option value="Яка ваша улюблена порода собак/котів?">Яка ваша улюблена порода собак/котів?</option>
              <option value="Місто, у якому ви народилися?">Місто, у якому ви народилися?</option>
              <option value="Який ваш улюблений колір?">Який ваш улюблений колір?</option>
            </select>

            <input
              type="text"
              value={secretAnswer}
              onChange={(e) => setSecretAnswer(e.target.value)}
              placeholder="Ваша відповідь..."
              maxLength="30"
              required
            />
          </div>

          <button type="submit" className="login-submit-btn" style={{ marginTop: '15px' }}>Зареєструватися</button>
        </form>

        <div className="register-link-container" style={{ marginTop: '15px', textAlign: 'center' }}>
          <p>Вже маєте акаунт? <Link to="/login" style={{ color: '#6d4ce4', fontWeight: 'bold' }}>Увійти</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Register;