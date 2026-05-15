import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const { login } = useAuth();

  const handleLogin = (e) => {
    e.preventDefault();

    // ПЕРЕВІРКА НА АДМІНІСТРАТОРА
    if (email === 'admin@mail.com' && password === 'admin123') {
      login(); 
      localStorage.setItem('userEmail', email); 
      localStorage.setItem('userRole', 'admin'); 
      window.dispatchEvent(new Event('authChanged')); // Оновлюємо стан на всьому сайті
      navigate('/adoptions'); // Адміна кидаємо на панель заявок
    } else {
      // ЗВИЧАЙНИЙ КОРИСТУВАЧ
      login(); 
      localStorage.setItem('userEmail', email); 
      localStorage.setItem('userRole', 'user'); 
      window.dispatchEvent(new Event('authChanged'));
      navigate('/profile'); // Користувача кидаємо в його кабінет
    }
  };

  return (
    <div className="login-page page-transition">
      <div className="login-card">
        <h2>Вхід в систему 🐾</h2>
        <p>Введіть дані для доступу до свого акаунта</p>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ваша@пошта.com"
              required
            />
          </div>

          <div className="input-group">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="login-submit-btn">Увійти</button>
        </form>
        
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p>Ще немає акаунта? <Link to="/register" style={{ color: '#6d4ce4', fontWeight: 'bold' }}>Створити</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Login;