import React from "react";

const Card = ({
  children,
  variant = "default",
  padding = "md",
  hoverable = false,
  onClick,
  className = "",
}) => {
  const variants = {
    default: "bg-white border border-gray-200",
    elevated: "bg-white shadow-soft-md",
    outlined: "bg-white border-2 border-primary-200",
  };

  const paddings = {
    none: "p-0",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const hoverClass = hoverable
    ? "hover:shadow-soft-lg hover:-translate-y-1 cursor-pointer"
    : "";
  const clickableClass = onClick ? "cursor-pointer" : "";

  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl transition-all duration-300
        ${variants[variant]}
        ${paddings[padding]}
        ${hoverClass}
        ${clickableClass}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
