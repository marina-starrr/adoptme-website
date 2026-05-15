import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // 👈 Наш глобальний контекст
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  
  const { login } = useAuth(); // Беремо функцію login з контексту

  const handleLogin = (e) => {
    e.preventDefault();

    // 1. ПЕРЕВІРКА НА АДМІНІСТРАТОРА 🔴
    if (email === 'admin@mail.com' && password === 'admin123') {
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userRole', 'admin'); // Записуємо роль адміна
        
        login(); // Оновлюємо глобальний стан авторизації
        window.dispatchEvent(new Event('authChanged')); // Сповіщаємо шапку сайту
        
        alert('Вітаємо в системі, Адміністраторе! 🐾');
        navigate('/admin/pets'); // 👈 Автоматично перенаправляємо в панель адміна!
        return;
    }

    // 2. ПЕРЕВІРКА НА ЗВИЧАЙНОГО КОРИСТУВАЧА 🟢
    // Для диплому робимо просту імітацію (будь-який інший пароль)
    if (password.length >= 4) {
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userRole', 'user'); // Записуємо роль звичайного юзера
        
        login(); // Оновлюємо глобальний стан
        window.dispatchEvent(new Event('authChanged')); // Сповіщаємо шапку сайту
        
        alert('Раді бачити вас знову! 🐾');
        navigate('/profile'); // 👈 Перенаправляємо в особистий кабінет!
    } else {
        alert('Пароль має бути не менше 4 символів!');
    }
  };

  return (
    <div className="login-page page-transition">
      <div className="login-card">
        <h2>Вхід у акаунт 🐾</h2>
        <p>Увійдіть, щоб керувати своїми заявками</p>
        
        <form onSubmit={handleLogin}>
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
              placeholder="Введіть пароль" 
              required 
            />
          </div>
          
          <button type="submit" className="login-submit-btn">Увійти</button>
        </form>

        <div className="register-link-container" style={{ marginTop: '20px', textAlign: 'center' }}>
            <p>Немає акаунту? <Link to="/register" style={{ color: '#6d4ce4', fontWeight: 'bold' }}>Зареєструватися</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Login;