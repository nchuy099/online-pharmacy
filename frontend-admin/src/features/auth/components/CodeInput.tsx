import React, { RefObject } from "react";

interface CodeInputProps {
    values: string[];
    onChange: (idx: number, value: string) => void;
    onKeyDown: (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
    inputRefs: RefObject<(HTMLInputElement | null)[]>;
    type?: "text" | "password";
    error?: boolean;
}

const CodeInput: React.FC<CodeInputProps> = ({ values, onChange, onKeyDown, inputRefs, type = "text", error }) => (
    <div className="flex justify-between gap-2">
        {values.map((digit, idx) => (
            <input
                key={idx}
                ref={el => { if (inputRefs.current) inputRefs.current[idx] = el; }}
                type={type}
                inputMode="numeric"
                maxLength={1}
                className={`w-10 h-12 text-center text-xl border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${error ? "border-red-500" : "border-gray-300"}`}
                value={digit}
                onChange={e => onChange(idx, e.target.value)}
                onKeyDown={e => onKeyDown(idx, e)}
            />
        ))}
    </div>
);

export default CodeInput; 