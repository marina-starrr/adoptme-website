import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
// Імпорт сторінок
import Home from './pages/Home';
import Pets from './pages/Pets';
import About from './pages/About';
import Reviews from './pages/Reviews';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import PetDetails from './pages/PetDetails';

function App() {
  return (
    <BrowserRouter>
      <div className="background-paws">
        <div className="paw paw-1"></div>
        <div className="paw paw-2"></div>
        <div className="paw paw-3"></div>
        <div className="paw paw-4"></div>
      </div>

      <div className="app-container">
        <Header />

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pets" element={<Pets />} />
            {/* Рядок нижче тепер на своєму місці всередині Routes */}
            <Route path="/pets/:id" element={<PetDetails />} /> 
            <Route path="/about" element={<About />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;