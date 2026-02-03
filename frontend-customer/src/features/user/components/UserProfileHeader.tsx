import React from "react";
import { FaUser } from "react-icons/fa";

interface Props {
    fullName: string;
    email: string;
}

export const UserProfileHeader: React.FC<Props> = ({ fullName, email }) => {
    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
            <div className="relative flex flex-col sm:flex-row items-center gap-6">
                <div className="w-24 h-24 bg-emerald-600 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-200">
                    <FaUser className="text-white text-4xl" />
                </div>
                <div className="text-center sm:text-left">
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">
                        {fullName}
                    </h1>
                    <p className="text-gray-500 font-medium">{email}</p>
                    <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider">
                            Khách hàng thân thiết
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
