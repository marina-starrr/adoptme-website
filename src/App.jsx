import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';

// Імпорт сторінок
import Home from './pages/Home';
import Pets from './pages/Pets';
import About from './pages/About';
import Reviews from './pages/Reviews';
import Contact from './pages/Contact';

function App() {
  return (
    <BrowserRouter>
      {/* 1. Фонові лапки (твої paw-1, paw-2...) можна додати сюди, щоб вони були скрізь */}
      <div className="background-paws">
        <div className="paw paw-1"></div>
        <div className="paw paw-2"></div>
        <div className="paw paw-3"></div>
        <div className="paw paw-4"></div>
      </div>

      <div className="app-container">
        {/* 2. Шапка завжди зверху */}
        <Header />

        {/* 3. Тут змінюється контент */}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pets" element={<Pets />} />
            <Route path="/about" element={<About />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>

        {/* 4. Футер завжди знизу */}
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;