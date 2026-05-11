import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Проста перевірка для диплому
    if (email === 'admin@mail.com' && password === 'admin123') {
      localStorage.setItem('isAdmin', 'true'); // Зберігаємо статус адміна
      navigate('/admin-panel'); // Перекидаємо в адмінку (треба буде створити цю сторінку)
    } else {
      alert('Невірний логін або пароль!');
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
      </div>
    </div>
  );
}

export default Login;