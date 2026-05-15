// src/layouts/AdminLayout.jsx
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
      logout();
      navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: '#4A148C', padding: '15px 5%', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <h3 style={{ margin: 0 }}>Панель Адміністратора</h3>
         <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
           <Link to="/admin/pets" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>Тварини</Link>
           <Link to="/admin/adoptions" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>Заявки</Link>
           <button onClick={handleLogout} style={{ background: '#ff4d4d', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' }}>Вийти</button>
         </nav>
      </header>
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;