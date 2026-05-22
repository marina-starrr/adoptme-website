import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

// --- ОБГОРТКИ ТА ЗАХИСТ ---
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

// --- СТОРІНКИ КОРИСТУВАЧА ---
import Home from './pages/Home';
import UserPets from './pages/UserPets'; 
import About from './pages/About';
import Reviews from './pages/Reviews';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import PetDetails from './pages/PetDetails';

// --- СПІЛЬНІ СТОРІНКИ ---
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';

// --- СТОРІНКИ АДМІНА ---
import AdminAdoptions from './pages/admin/AdminAdoptions'; 
import AdminPets from './pages/admin/AdminPets'; 
import AdminReviews from './pages/admin/AdminReviews';
import AdminUsers from './pages/admin/AdminUsers';
import AdminHappyPets from './pages/admin/AdminHappyPets';
import AdminNotifications from './pages/admin/AdminNotifications';

function AppRoutes() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // 👇 1. ПЛАВНИЙ БІЛИЙ ФОН
  const overlayVariants = {
    initial: { opacity: 1, display: "flex" },
    animate: { 
      opacity: 0, 
      transition: { duration: 0.5, ease: "easeInOut", delay: 0.1 },
      transitionEnd: { display: "none" } 
    },
    exit: { 
      opacity: 1, 
      display: "flex",
      transition: { duration: 0.4, ease: "easeInOut" }
    }
  };

  // 👇 2. СЕРЦЕ ЗБІЛЬШУЄТЬСЯ ТА ЗМЕНШУЄТЬСЯ
  const heartVariants = {
    initial: { scale: 1.8, opacity: 1 },
    animate: { 
      scale: 0, 
      opacity: 0, 
      transition: { duration: 0.5, ease: "backIn" } 
    },
    exit: { 
      scale: 1.8, 
      opacity: 1, 
      transition: { duration: 0.4, ease: "backOut" } 
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={location.pathname} 
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%' }}
      >
        
        <Routes location={location}>
          <Route element={<UserLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/pets" element={<UserPets />} />
            <Route path="/pets/:id" element={<PetDetails />} />
            <Route path="/about" element={<About />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/register" element={<Register />} />

            <Route path="/profile" element={
                <ProtectedRoute requireAdmin={false}><Profile /></ProtectedRoute>
            }/>
          </Route>

          <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>
          }>
            {/* 🌟 ДОДАНО: Перенаправлення з /admin на /admin/adoptions */}
            <Route index element={<Navigate to="adoptions" replace />} />
            
            <Route path="adoptions" element={<AdminAdoptions />} />
            <Route path="pets" element={<AdminPets />} />
            <Route path="pets/:id" element={<PetDetails />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="happy-pets" element={<AdminHappyPets />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Route>
        </Routes>

        {/* --- АНІМОВАНИЙ БІЛИЙ ЕКРАН ТА СЕРЦЕ --- */}
        <motion.div
          variants={overlayVariants}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: '#b49dff', 
            zIndex: 99999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'none'
          }}
        >
          <motion.div
            variants={heartVariants}
            style={{ width: '120px', height: '120px' }} 
          >
            <svg viewBox="0 0 512 512" style={{ width: '100%', height: '100%', fill: '#805cfe' }}>
              <path d="M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z" />
            </svg>
          </motion.div>
        </motion.div>

      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;