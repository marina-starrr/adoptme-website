// src/layouts/UserLayout.jsx
import { Outlet } from 'react-router-dom';
import UserHeader from '../components/UserHeader'; // або просто Header, якщо ти не змінювала назву файлу
import Footer from '../components/Footer';

function UserLayout() {
  return (
    <div className="app-container">
      <UserHeader />
      <main>
         {/* Сюди автоматично підставлятимуться Home, Pets, About і т.д. */}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default UserLayout;