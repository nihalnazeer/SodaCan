import React from 'react';
import PropTypes from 'prop-types';

export function Button({ children, disabled, className, onClick }) {
  console.log('Rendering Button');
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  onClick: PropTypes.func,
};

Button.defaultProps = {
  disabled: false,
  className: '',
  onClick: () => {},
};

export default Button;