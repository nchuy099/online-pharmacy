import React from "react";

interface PhoneInputProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: boolean;
}

const PhoneInput: React.FC<PhoneInputProps> = ({ value, onChange, error }) => (
    <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Số điện thoại
        </label>
        <input
            id="phone"
            name="phone"
            type="tel"
            className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${error ? "border-red-500" : "border-gray-300"} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm`}
            placeholder="Nhập số điện thoại"
            value={value}
            onChange={onChange}
        />
    </div>
);

export default PhoneInput; 