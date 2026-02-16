import { FaTimes, FaUser, FaCalendarAlt, FaVenusMars } from 'react-icons/fa';
import type { PatientHistoryResponse } from '../types/patient';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    patient: PatientHistoryResponse | null;
    isLoading: boolean;
}

export default function PatientDetailsModal({ isOpen, onClose, patient, isLoading }: Props) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FaUser className="text-blue-500" /> Hồ sơ Bệnh nhân
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className="p-6">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : patient ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {patient.customerName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{patient.customerName}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">ID: {patient.customerId.substring(0, 8)}...</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FaCalendarAlt className="text-gray-400 text-sm" />
                                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tuổi</span>
                                    </div>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{patient.age ? `${patient.age} tuổi` : 'Chưa cập nhật'}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FaVenusMars className="text-gray-400 text-sm" />
                                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Giới tính</span>
                                    </div>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{patient.gender === 'MALE' ? 'Nam' : patient.gender === 'FEMALE' ? 'Nữ' : 'Chưa cập nhật'}</p>
                                </div>
                            </div>                        </div>
                    ) : (
                        <div className="text-center p-8 text-gray-500">
                            Không tìm thấy dữ liệu.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
