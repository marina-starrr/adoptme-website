import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// --- ОБГОРТКИ ТА ЗАХИСТ ---
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

// --- СТОРІНКИ КОРИСТУВАЧА ---
import Home from './pages/Home';
import UserPets from './pages/UserPets'; // 👈 Наш чистий файл для користувачів (раніше був Pets)
import About from './pages/About';
import Reviews from './pages/Reviews';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import PetDetails from './pages/PetDetails';

// --- СПІЛЬНІ СТОРІНКИ ---
import Login from './pages/Login';
import Register from './pages/Register';

// --- СТОРІНКИ АДМІНА ---
import AdminPets from './pages/admin/AdminPets'; // 👈 Той код, що ми зберігали
import AdminAdoptions from './pages/admin/AdminAdoptions'; // 👈 Той код, що ми зберігали

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          
          {/* =========================================
              🟢 1. КЛІЄНТСЬКА ЧАСТИНА (З Хедером і Футером)
              ========================================= */}
          <Route element={<UserLayout />}>
            {/* Публічні сторінки (доступні всім) */}
            <Route path="/" element={<Home />} />
            <Route path="/pets" element={<UserPets />} />
            <Route path="/pets/:id" element={<PetDetails />} />
            <Route path="/about" element={<About />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Приватна сторінка користувача (Особистий кабінет) */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute requireAdmin={false}>
                  <Profile />
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* =========================================
              🔴 2. АДМІНІСТРАТИВНА ЧАСТИНА (Спеціальний дизайн)
              ========================================= */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            {/* Всі посилання починаються з /admin/... */}
            <Route path="pets" element={<AdminPets />} />
            <Route path="adoptions" element={<AdminAdoptions />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;