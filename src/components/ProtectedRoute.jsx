import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, requireAdmin = false }) {
    const { isLoggedIn, role, loading } = useAuth();

    // Поки перевіряємо сесію/профіль — не редіректимо (інакше «блимне» логін)
    if (loading) {
        return <h2 className="loading-message">Перевірка доступу... 🐾</h2>;
    }

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;
