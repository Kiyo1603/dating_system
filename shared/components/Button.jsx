import React from 'react';
import './Button.css';

const Button = ({ children, variant = 'primary', onClick, disabled = false, type = 'button', size = 'medium' }) => {
  return (
    <button
      className={`btn btn-${variant} ${size === 'small' ? 'btn-small' : size === 'large' ? 'btn-large' : ''}`}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
};

export default Button;
