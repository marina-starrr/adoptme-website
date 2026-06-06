// src/layouts/UserLayout.jsx
import { Outlet } from 'react-router-dom';
import UserHeader from '../components/UserHeader'; 
import Footer from '../components/Footer';
import { useToast } from '../context/ToastContext'; // Підключаємо для доступу до showToast

function UserLayout() {
  // Дістаємо функцію, якщо раптом захочеш її використати безпосередньо тут
  const { showToast } = useToast(); 

  return (
    <div className="app-container">
      <UserHeader />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default UserLayout;