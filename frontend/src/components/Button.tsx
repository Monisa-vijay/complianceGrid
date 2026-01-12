import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none';
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2.5 text-sm h-10',
    lg: 'px-6 py-3 text-base h-12',
  };

  const variantStyles = {
    primary: {
      default: 'bg-[#2F4B7C] text-white',
      hover: 'hover:bg-[#263F69]',
      active: 'active:bg-[#1F3558]',
      disabled: 'bg-[#9FB0CC] text-white opacity-70 cursor-not-allowed',
      focus: 'focus:outline-2 focus:outline-[#88A3D8] focus:outline-offset-2',
    },
    secondary: {
      default: 'bg-transparent text-[#2F4B7C] border-[1.5px] border-[#2F4B7C]',
      hover: 'hover:bg-[rgba(47,75,124,0.08)]',
      active: 'active:bg-[rgba(47,75,124,0.15)]',
      disabled: 'text-[#9FB0CC] border-[#9FB0CC] cursor-not-allowed',
      focus: 'focus:outline-2 focus:outline-[#88A3D8] focus:outline-offset-2',
    },
    success: {
      default: 'bg-[#2FB573] text-white',
      hover: 'hover:bg-[#27A364]',
      active: 'active:bg-[#208B55]',
      disabled: 'bg-[#9ED9BF] cursor-not-allowed',
      focus: 'focus:outline-2 focus:outline-[#88A3D8] focus:outline-offset-2',
    },
    danger: {
      default: 'bg-[#D64545] text-white',
      hover: 'hover:bg-[#C23A3A]',
      active: 'active:bg-[#A83030]',
      disabled: 'bg-[#9FB0CC] text-white opacity-70 cursor-not-allowed',
      focus: 'focus:outline-2 focus:outline-[#88A3D8] focus:outline-offset-2',
    },
  };

  const styles = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  const buttonClasses = `
    ${baseStyles}
    ${sizeStyle}
    ${disabled ? styles.disabled : `${styles.default} ${styles.hover} ${styles.active}`}
    ${styles.focus}
    rounded-md
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      className={buttonClasses}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

