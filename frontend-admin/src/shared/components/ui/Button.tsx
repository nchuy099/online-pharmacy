import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline";
    fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = "primary",
    type = "button",
    className = "",
    fullWidth = false,
    ...props
}) => {
    const base = "py-2 px-4 text-sm font-medium rounded-lg focus:outline-none transition-colors duration-200 ";
    let color = "";
    if (variant === "primary") {
        color = "text-white bg-emerald-500 hover:bg-emerald-600 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 border border-transparent";
    } else if (variant === "secondary") {
        color = "text-emerald-600 bg-white border border-emerald-500 hover:bg-emerald-50 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500";
    } else if (variant === "outline") {
        color = "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50";
    }
    return (
        <button
            type={type}
            className={`${base} ${color} ${fullWidth ? "w-full" : ""} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
