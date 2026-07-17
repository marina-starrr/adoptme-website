// Канонічні статуси тваринки — мають точно збігатися зі значеннями в БД.
export const PET_STATUS = {
  LOOKING: 'Шукає дім',
  SPECIAL: 'Особливий догляд',
  TREATMENT: 'На лікуванні',
  HOME: 'Вже вдома',
  RESERVED: 'Заброньована',
  LOST: 'Не вдалось врятувати',
};

// Візуальна конфігурація статусу (CSS-клас + іконка) для бейджів.
export const getStatusConfig = (petStatus) => {
  switch (petStatus) {
    case 'Особливий догляд': return { class: 'status-special', icon: '❤️‍🩹' };
    case 'На лікуванні': return { class: 'status-treatment', icon: '💊' };
    case 'Вже вдома': return { class: 'status-home', icon: '🏡' };
    case 'Не вдалось врятувати': return { class: 'status-died', icon: '😞' };
    case 'Заброньована':
    case 'Заброньовано': return { class: 'status-reserved', icon: '🔒' };
    default: return { class: 'status-looking', icon: '🐾' };
  }
};
