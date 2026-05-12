import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // 👈 ДОДАЛИ ІМПОРТ КОНТЕКСТУ
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const { login } = useAuth(); // 👈 БЕРЕМО ФУНКЦІЮ ВХОДУ З КОНТЕКСТУ

  const handleLogin = (e) => {
    e.preventDefault();

    if (email === 'admin@mail.com' && password === 'admin123') {
      login(); 
      localStorage.setItem('userEmail', email); 
      localStorage.setItem('userRole', 'admin'); 
      window.dispatchEvent(new Event('authChanged')); // 👈 Кажемо всьому сайту, що статус змінився
      navigate('/adoptions');
    } else {
      login(); 
      localStorage.setItem('userEmail', email); 
      localStorage.setItem('userRole', 'user'); 
      window.dispatchEvent(new Event('authChanged')); // 👈 Кажемо всьому сайту, що статус змінився
      navigate('/profile');
    }
  };

  return (
    <div className="login-page page-transition">
      <div className="login-card">
        <h2>Вхід в систему 🐾</h2>
        <p>Введіть дані для доступу до панелі керування</p>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@mail.com"
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