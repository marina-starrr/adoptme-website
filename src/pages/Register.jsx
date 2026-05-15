import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // 👈 Додали імпорт контексту
import './Login.css'; // Використовуємо ті ж самі стилі, що і для входу

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  
  const { login } = useAuth(); // 👈 Беремо функцію login

  const handleRegister = (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
        alert('Паролі не співпадають!');
        return;
    }

    // Для дипломної роботи робимо просту імітацію реєстрації
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userRole', 'user'); // 👈 Вказуємо, що це звичайний юзер
    login(); // 👈 Оновлюємо стан авторизації
    window.dispatchEvent(new Event('authChanged')); // 👈 Миттєво оновлюємо Header

    alert('Реєстрація успішна! Вітаємо в родині AdoptMe 🐾');
    navigate('/profile'); // Перекидаємо в особистий кабінет
  };

  return (
    <div className="login-page page-transition">
      <div className="login-card">
        <h2>Реєстрація 🐾</h2>
        <p>Створіть акаунт, щоб подати заявку на прихисток</p>
        
        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="vash@mail.com" 
              required 
            />
          </div>
          
          <div className="input-group">
            <label>Пароль</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Створіть пароль" 
              required 
            />
          </div>

          <div className="input-group">
            <label>Повторіть пароль</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              placeholder="Повторіть пароль" 
              required 
            />
          </div>
          
          <button type="submit" className="login-submit-btn">Зареєструватися</button>
        </form>

        <div className="register-link-container" style={{ marginTop: '20px', textAlign: 'center' }}>
            <p>Вже маєте акаунт? <Link to="/login" style={{ color: '#6d4ce4', fontWeight: 'bold' }}>Увійти</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Register;