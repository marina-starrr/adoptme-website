import { Link } from 'react-router-dom';

// Права шторка сповіщень користувача. Дані та обробники живуть у UserHeader.
export default function NotificationsDrawer({
  isModalClosing,
  handleCloseNotifications,
  notifications,
  handleNotificationCardClick,
  handleDeleteNotification,
  getStatusClass,
  getPetStatusClass,
}) {
  return (
    <div className={`modal ${isModalClosing ? 'closing' : ''}`} style={{ display: 'flex' }}>
      <div className={`modal-content ${isModalClosing ? 'closing' : ''}`}>
        <span className="close-btn" onClick={handleCloseNotifications}>&times;</span>
        <div className="modal-header">
          <h3>Ваші сповіщення</h3>
        </div>
        <div className="notifications-container">
          {notifications.length === 0 ? (
            <p className="empty-favorites-text">У вас поки немає нових сповіщень.</p>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.uniqueId}
                className="notification-card"
                onClick={() => handleNotificationCardClick(notif)}
                style={{ cursor: notif.type !== 'treatment' && notif.PetName !== 'Модерація' ? 'pointer' : 'default' }}
              >
                {notif.type === 'treatment' ? (
                  <p>
                    🎉 Радісна новина! Тваринка{' '}
                    <Link
                      to={`/pets/${notif.PetId}`}
                      onClick={handleCloseNotifications}
                      className="notification-pet-link"
                    >
                      {notif.PetName}
                    </Link>{' '}
                    упішно пройшла лікування і тепер чекає на вас!
                  </p>
                ) : notif.type === 'adoption_status' ? (
                  <p>
                    📋 Статус вашої заявки на <strong>{notif.PetName}</strong> було змінено! Новий статус:{' '}
                    <span className={`status-badge-inline ${getStatusClass(notif.Status)}`}>
                      {notif.Status}
                    </span>
                  </p>
                ) : notif.type === 'favorite_status' && notif.NewStatus === 'Новенький хвостик' ? (
                  <p>
                    ✨ У притулку поповнення! Зустрічайте хвостика на ім'я <strong>{notif.PetName}</strong>.{' '}
                    <Link
                      to={`/pets/${notif.PetId}`}
                      onClick={handleCloseNotifications}
                      className="notification-pet-link"
                    >
                      Дивитися
                    </Link>
                  </p>
                ) : notif.type === 'favorite_status' && notif.PetName === 'Модерація' ? (
                  <p style={{ color: '#ef4444' }}>
                    ⚠️ <strong>Модерація:</strong> {notif.NewStatus}
                  </p>
                ) : (
                  <p>
                    ❤️ Тваринка <strong>{notif.PetName}</strong> з вашого обраного змінила статус на:{' '}
                    <span className={`status-badge-inline ${getPetStatusClass(notif.NewStatus)}`}>
                      {notif.NewStatus}
                    </span>
                  </p>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNotification(notif);
                  }}
                  className="mark-read-btn"
                >
                  Зрозуміло
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
