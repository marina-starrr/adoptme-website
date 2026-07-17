// Форматування українських номерів → "+38(0XX) XXX XX XX".
// Історично співіснують дві моделі вводу, тож поки лишаємо обидві.

// Збережений номер ("380...", "0...", "38...") → форматований рядок.
export const formatStoredPhone = (phoneStr) => {
  if (!phoneStr) return '';
  let digits = phoneStr.replace(/\D/g, '');

  if (digits.startsWith('380')) digits = digits.substring(3);
  else if (digits.startsWith('0')) digits = digits.substring(1);
  else if (digits.startsWith('38')) digits = digits.substring(2);

  digits = digits.substring(0, 9);

  let formatted = '+38(0';
  if (digits.length > 0) formatted += digits.substring(0, 2);
  if (digits.length > 2) formatted += ') ' + digits.substring(2, 5);
  if (digits.length > 5) formatted += ' ' + digits.substring(5, 7);
  if (digits.length > 7) formatted += ' ' + digits.substring(7, 9);

  return formatted;
};

// Форматування вводу в полі зі збереженням фіксованого префікса "+38(0".
export const formatPhoneTyping = (input) => {
  if (input.length < 5 || !input.startsWith('+38(0')) return '+38(0';

  const rawAfter = input.substring(5).replace(/\D/g, '').substring(0, 9);

  let formatted = '+38(0';
  if (rawAfter.length > 0) formatted += rawAfter.substring(0, 2);
  if (rawAfter.length > 2) formatted += ') ' + rawAfter.substring(2, 5);
  if (rawAfter.length > 5) formatted += ' ' + rawAfter.substring(5, 7);
  if (rawAfter.length > 7) formatted += ' ' + rawAfter.substring(7, 9);

  return formatted;
};

// Форматування від повного набору цифр з кодом 380.
export const formatPhone380 = (value) => {
  const rawDigits = value.replace(/\D/g, '');
  if (rawDigits.length === 0) return '';

  let digits = rawDigits.startsWith('380') ? rawDigits : '380' + rawDigits;
  digits = digits.substring(0, 12);

  let formatted = '+';
  if (digits.length > 0) formatted += digits.substring(0, 2);
  if (digits.length > 2) formatted += '(' + digits.substring(2, 5);
  if (digits.length > 5) formatted += ') ' + digits.substring(5, 8);
  if (digits.length > 8) formatted += ' ' + digits.substring(8, 10);
  if (digits.length > 10) formatted += ' ' + digits.substring(10, 12);

  return formatted;
};
