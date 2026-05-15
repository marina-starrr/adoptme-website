import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Універсальні стани для будь-якого користувача (звичайного або адміна)
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('userEmail'));
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || null);

    // Ця функція оновлює стан після успішного входу (викликається в Login.jsx)
    const login = () => {
        setIsLoggedIn(true);
        // Беремо роль, яку Login.jsx щойно записав у localStorage
        setUserRole(localStorage.getItem('userRole')); 
    };

    // Функція виходу
    const logout = () => {
        setIsLoggedIn(false);
        setUserRole(null);
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        // Якщо використовували старий isAdmin, теж підчищаємо про всяк випадок
        localStorage.removeItem('isAdmin'); 
    };

    // Слухаємо нашу кастомну подію 'authChanged', яку ми додали в Login.jsx
    useEffect(() => {
        const handleAuthChange = () => {
            setIsLoggedIn(!!localStorage.getItem('userEmail'));
            setUserRole(localStorage.getItem('userRole'));
        };

        window.addEventListener('authChanged', handleAuthChange);
        window.addEventListener('storage', handleAuthChange); // Для синхронізації між вкладками

        return () => {
            window.removeEventListener('authChanged', handleAuthChange);
            window.removeEventListener('storage', handleAuthChange);
        };
    }, []);

    return (
        <AuthContext.Provider value={{ isLoggedIn, userRole, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);