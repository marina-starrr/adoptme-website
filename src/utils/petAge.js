// Приблизний вік у місяцях із довільного рядка: "9 місяців", "2 роки",
// "3 тижні", "10 днів". Використовується для фільтра за віком.
export const getAgeInMonths = (ageStr) => {
  if (!ageStr) return 0;
  const lowerStr = ageStr.toLowerCase();
  const match = lowerStr.match(/(\d+([.,]\d+)?)/);
  if (!match) return 0;
  const num = parseFloat(match[0].replace(',', '.'));

  if (lowerStr.includes('рік') || lowerStr.includes('рок') || lowerStr.includes('річ') || lowerStr.includes('р.')) return num * 12;
  if (lowerStr.includes('тиж')) return num * 0.25;
  if (lowerStr.includes('дн') || lowerStr.includes('день')) return num / 30;
  return num;
};
