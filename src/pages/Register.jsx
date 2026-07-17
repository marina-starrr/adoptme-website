import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { formatPhone380 } from '../utils/phone';
import './Login.css';
import { useToast } from '../context/ToastContext'; // 👈 Глобальні тости

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

  const navigate = useNavigate();
  const { showToast } = useToast(); // 👈 Підключаємо функцію з контексту

  const handlePhoneChange = (e) => setPhone(formatPhone380(e.target.value));

  const handleRegister = async (e) => {
    e.preventDefault();

    // 1. Додаємо перевірку формату email (Regex)
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

    try {
      const cleanedNickname = nickname.trim();
      const cleanedEmail = email.trim();
      // Очищаємо телефон від дужок, плюсів та пробілів
      const cleanedPhone = phone.replace(/\D/g, '');

      // 1. Перевірка, що нікнейм вільний (безпечний RPC → лише true/false)
      const { data: available, error: nickError } = await supabase
        .rpc('nickname_available', { p_nickname: cleanedNickname });

      if (nickError) {
        showToast('❌ Помилка перевірки даних!');
        return;
      }
      if (!available) {
        showToast('❌ Цей Нікнейм вже зайнятий!');
        return;
      }

      // 2. Реєстрація через Supabase Auth. Профіль створить тригер handle_new_user
      //    з даних, переданих у user_metadata.
      const { error: signUpError } = await supabase.auth.signUp({
        email: cleanedEmail,
        password,
        options: {
          data: {
            nickname: cleanedNickname,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: cleanedPhone,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (signUpError) {
        if (signUpError.message?.toLowerCase().includes('already registered')) {
          showToast('❌ Цей Email вже зареєстровано!');
        } else {
          showToast('❌ Помилка при реєстрації: ' + signUpError.message);
        }
        console.error("SignUp Error:", signUpError);
        return;
      }

      // 3. Email-підтвердження увімкнено → сесії ще нема, ведемо на вхід
      navigate('/login', {
        state: { welcomeMsg: '✅ Майже готово! Перевірте пошту й підтвердьте email, щоб увійти 🐾' }
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