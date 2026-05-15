// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, requireAdmin = false }) {
    const { isLoggedIn, userRole } = useAuth();

    // Якщо людина взагалі не увійшла -> кидаємо на сторінку входу
    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    // Якщо сторінка тільки для адміна, а це звичайний юзер -> кидаємо на головну
    if (requireAdmin && userRole !== 'admin') {
        return <Navigate to="/" replace />;
    }

    // Якщо все добре -> пускаємо на сторінку
    return children;
}

export default ProtectedRoute;