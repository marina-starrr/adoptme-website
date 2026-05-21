import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

function AdminNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    async function fetchNotifications() {
        setLoading(true);
        const { data, error } = await supabase
            .from('TreatmentNotifications')
            .select('*')
            .order('CreatedAt', { ascending: false });
        if (!error) setNotifications(data);
        setLoading(false);
    }

    const handleStatusChange = async (id, currentStatus) => {
        const nextStatus = currentStatus === 'Нова' ? 'Оброблена' : 'Нова';
        const { error } = await supabase
            .from('TreatmentNotifications')
            .update({ Status: nextStatus })
            .eq('Id', id);

        if (!error) {
            setNotifications(prev => prev.map(n => n.Id === id ? { ...n, Status: nextStatus } : n));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Ви впевнені, що хочете видалити це сповіщення?")) return;
        const { error } = await supabase.from('TreatmentNotifications').delete().eq('Id', id);
        if (!error) {
            setNotifications(prev => prev.filter(n => n.Id !== id));
        }
    };

    if (loading) return <h2 className="loading-message">Завантаження сповіщень... 🐾</h2>;

    return (
        <div className="admin-card">
            <h2 className="admin-page-title">
                <div className="admin-page-title-icon">🔔</div>
                Запити на сповіщення про одужання
            </h2>

            <div className="admin-table-container">
                {notifications.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Сповіщень поки немає.</p>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Дата</th>
                                <th>Тваринка</th>
                                <th>Користувач</th>
                                <th>Email</th>
                                <th>Статус</th>
                                <th>Дії</th>
                            </tr>
                        </thead>
                        <tbody>
                            {notifications.map(n => (
                                <tr key={n.Id}>
                                    <td>{new Date(n.CreatedAt).toLocaleDateString('uk-UA')}</td>
                                    <td><strong>{n.PetName}</strong> (ID: {n.PetId})</td>
                                    <td>@{n.UserNickname}</td>
                                    <td>{n.UserEmail || 'Не вказано'}</td>
                                    <td>
                                        <span className={`pet-tag ${n.Status === 'Нова' ? 'status-special' : 'status-home'}`} style={{fontSize: '13px', padding: '4px 10px'}}>
                                            {n.Status}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            onClick={() => handleStatusChange(n.Id, n.Status)}
                                            className="btn-save" 
                                            style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '10px', marginRight: '10px', width: 'auto', display: 'inline-block' }}
                                        >
                                            {n.Status === 'Нова' ? '✓ Оброблено' : '↩ Відновити'}
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(n.Id)}
                                            className="btn-cancel" 
                                            style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '10px', width: 'auto', display: 'inline-block', background: '#ff6b6b', color: 'white' }}
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default AdminNotifications;