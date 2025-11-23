import React from 'react';

const Input = ({ label, value, onChange, type = "text", placeholder, min, max, step, className = "", icon, error, readOnly, ...props }) => {
    return (
        <div className="w-full">
            {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>}
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        {icon}
                    </div>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    min={min}
                    max={max}
                    step={step}
                    readOnly={readOnly}
                    className={`w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all ${icon ? 'pl-10' : ''} ${readOnly ? 'opacity-70 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''} ${className}`}
                    {...props}
                />
            </div>
            {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
};

export default Input;
