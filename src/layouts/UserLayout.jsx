import { Outlet } from 'react-router-dom';
import UserHeader from '../components/UserHeader';
import Footer from '../components/Footer';
import { useToast } from '../context/ToastContext';

function UserLayout() {
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