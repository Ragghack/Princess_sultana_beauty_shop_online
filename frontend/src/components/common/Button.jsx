import React from "react";
import { FiLoader } from "react-icons/fi";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  onClick,
  type = "button",
  className = "",
}) => {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-medium rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    primary:
      "bg-gradient-to-r from-primary-300 to-primary-400 text-white hover:from-primary-400 hover:to-primary-500 focus:ring-primary-300 shadow-soft hover:shadow-soft-md hover:-translate-y-0.5",
    secondary:
      "bg-secondary-300 text-gray-800 hover:bg-secondary-400 focus:ring-secondary-300",
    outline:
      "border-2 border-primary-300 text-primary-500 hover:bg-primary-50 focus:ring-primary-300",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-300",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-400",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const widthClass = fullWidth ? "w-full" : "";
  const disabledClass =
    disabled || loading ? "opacity-60 cursor-not-allowed" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClass} ${disabledClass} ${className}`}
    >
      {loading && <FiLoader className="animate-spin" size={18} />}
      {icon && !loading && icon}
      <span>{children}</span>
    </button>
  );
};

export default Button;
