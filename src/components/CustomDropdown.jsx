import { useState, useRef, useEffect } from 'react';

// Спільний випадаючий список. `variant` підбирає стилі під різні сторінки:
//   'default' — фільтри/списки (стилі беруться з CSS сторінки)
//   'form'    — форма адмінки (клас form-control + рамка й позиціонування)
//   'inline'  — інлайн-редагування в картці тваринки (клас inline-input)
export default function CustomDropdown({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  variant = 'default',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  const containerStyle =
    variant === 'form'
      ? { width: '100%', opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto', position: 'relative' }
      : variant === 'inline'
        ? { width: '100%', opacity: disabled ? 0.6 : 1 }
        : undefined;

  const headerExtraClass = variant === 'form' ? ' form-control' : variant === 'inline' ? ' inline-input' : '';

  const headerStyle =
    variant === 'form'
      ? { padding: '14px 18px', border: isOpen ? '1px solid #6847DD' : '1px solid rgba(104, 71, 221, 0.2)' }
      : variant === 'inline'
        ? { cursor: disabled ? 'default' : 'pointer' }
        : undefined;

  const wrapperStyle =
    variant === 'form'
      ? { position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%', zIndex: 1000 }
      : undefined;

  return (
    <div className={`custom-dropdown-container ${disabled ? 'disabled' : ''}`} ref={dropdownRef} style={containerStyle}>
      <div
        className={`custom-dropdown-header ${isOpen ? 'open' : ''}${headerExtraClass}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={headerStyle}
      >
        <span>{selectedOption ? selectedOption.label : <span style={{ color: '#999' }}>{placeholder}</span>}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && !disabled && (
        <div className="custom-dropdown-list-wrapper" style={wrapperStyle}>
          <ul className="custom-dropdown-list">
            {options.map((opt) => (
              <li
                key={opt.value}
                className={`custom-dropdown-item ${value === opt.value ? 'selected' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
