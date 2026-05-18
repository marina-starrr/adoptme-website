import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // 👇 ТЕПЕР ПЕРЕВІРЯЄМО НАЯВНІСТЬ userNickname ЗАМІСТЬ userEmail
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('userNickname'));
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || null);

    useEffect(() => {
        const handleAuthChange = () => {
            // 👇 Теж оновлено на userNickname
            setIsLoggedIn(!!localStorage.getItem('userNickname'));
            setUserRole(localStorage.getItem('userRole') || null);
        };

        // Слухаємо наші події входу/виходу
        window.addEventListener('authChanged', handleAuthChange);
        return () => window.removeEventListener('authChanged', handleAuthChange);
    }, []);

    const login = () => {
        setIsLoggedIn(true);
        setUserRole(localStorage.getItem('userRole'));
    };

    const logout = () => {
        setIsLoggedIn(false);
        setUserRole(null);
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, userRole, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);