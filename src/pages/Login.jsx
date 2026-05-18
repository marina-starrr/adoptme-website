import { useState, useEffect } from 'react'; 
import { Link, useNavigate, useLocation } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient'; 
import './Login.css';

function Login() {
  const [nickname, setNickname] = useState(''); // 👈 Змінено з email на nickname
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const [toastMsg, setToastMsg] = useState(''); 
  const { login } = useAuth(); 

  const showToast = (message) => {
      setToastMsg(message);
      setTimeout(() => setToastMsg(''), 3500);
  };

  useEffect(() => {
    if (location.state?.welcomeMsg) {
      showToast(location.state.welcomeMsg);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Синхронізація кошика за Нікнеймом користувача
  const restoreAndMergeCart = async (userNickname) => {
    try {
        const { data: dbFavorites, error } = await supabase
            .from('Favorites')
            .select('PetId')
            .eq('UserNickname', userNickname); // 👈 фільтр за UserNickname

        if (error) throw error;

        const dbPetIds = dbFavorites ? dbFavorites.map(f => f.PetId) : [];
        const guestPets = JSON.parse(localStorage.getItem('favorites')) || [];

        if (guestPets.length > 0) {
            for (const guestPet of guestPets) {
                if (!dbPetIds.includes(guestPet.id)) {
                    await supabase
                        .from('Favorites')
                        .insert([{ UserNickname: userNickname, PetId: guestPet.id }]);
                    dbPetIds.push(guestPet.id);
                }
            }
        }

        if (dbPetIds.length > 0) {
            const { data: fullPetsData, error: petsError } = await supabase
                .from('Pets')
                .select('*')
                .in('Id', dbPetIds);

            if (petsError) throw petsError;

            const formattedFavorites = fullPetsData.map(pet => ({
                id: pet.Id,
                name: pet.Name,
                image: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${pet.ImageName}`
            }));

            localStorage.setItem('favorites', JSON.stringify(formattedFavorites));
        } else {
            localStorage.removeItem('favorites');
        }

        window.dispatchEvent(new Event('cartUpdated'));

    } catch (err) {
        console.error("Помилка синхронізації обраного:", err.message);
    }
  };

  const handleLogin = async (e) => { 
    e.preventDefault();

    try {
        // 🔍 Шукаємо користувача за індивідуальним Нікнеймом
        const { data: user, error } = await supabase
            .from('Users')
            .select('*')
            .eq('Nickname', nickname.trim())
            .eq('Password', password)
            .maybeSingle(); 

        if (error) {
            showToast('❌ Помилка з’єднання з базою даних!');
            return;
        }

        if (!user) {
            showToast('❌ Неправильний Нікнейм або Пароль!');
            return;
        }

        // Записуємо нікнейм сесії
        localStorage.setItem('userNickname', user.Nickname);
        localStorage.setItem('userRole', user.Role); 
        
        login(); 
        window.dispatchEvent(new Event('authChanged')); 
        
        await restoreAndMergeCart(user.Nickname); 

        if (user.Role === 'admin') {
            navigate('/admin/pets', { state: { welcomeMsg: 'Вітаємо в системі, Адміністраторе! 🐾' } }); 
        } else {
            navigate('/', { state: { welcomeMsg: 'Раді бачити вас знову! 🐾' } }); 
        }

    } catch (err) {
        showToast('❌ Сталася помилка при вході!');
    }
  };

  return (
    <div className="login-page page-transition" style={{ position: 'relative' }}>
      {toastMsg && <div className="custom-toast">{toastMsg}</div>}

      <div className="login-card">
        <h2>Вхід у акаунт 🐾</h2>
        <p>Увійдіть за своїм індивідуальним нікнеймом</p>
        
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Нікнейм</label>
            <input 
              type="text" 
              value={nickname} 
              onChange={(e) => setNickname(e.target.value)} 
              placeholder="Введіть свій нікнейм..." 
              required 
            />
          </div>
          
          <div className="input-group">
            <label>Пароль</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Введіть пароль" 
              required 
            />
          </div>
          
          <button type="submit" className="login-submit-btn">Увійти</button>
        </form>

        <div className="register-link-container" style={{ marginTop: '20px', textAlign: 'center' }}>
            <p>Немає акаунту? <Link to="/register" style={{ color: '#6d4ce4', fontWeight: 'bold' }}>Зареєструватися</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Login;