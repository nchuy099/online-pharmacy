import { Modal } from '../../../shared/components/ui';
import { PharmacistResponse, getSpecialistName } from '../types/dto';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    pharmacist?: PharmacistResponse;
}

const PharmacistDetails = ({ isOpen, onClose, pharmacist }: Props) => {
    if (!pharmacist) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Chi tiết dược sĩ"
            className="max-w-2xl"
        >
            <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="flex items-center space-x-4">
                    <div className="h-20 w-20 flex-shrink-0">
                        <div className="h-full w-full rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-2xl font-bold">
                            {pharmacist.fullName.charAt(0)}
                        </div>
                    </div>
                    <div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">{pharmacist.fullName}</h3>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                                {getSpecialistName(pharmacist.specialtyCode, pharmacist.specialtyName)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</label>
                        <p className="mt-1 text-sm text-slate-900 font-medium">{pharmacist.email}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Số điện thoại</label>
                        <p className="mt-1 text-sm text-slate-900 font-medium">{pharmacist.phoneNumber}</p>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Học vấn</label>
                        <p className="mt-1 text-sm text-slate-900 font-medium">{pharmacist.education}</p>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Bằng cấp</label>
                        <p className="mt-1 text-sm text-slate-900 font-medium">{pharmacist.qualifications}</p>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Kinh nghiệm</label>
                        <p className="mt-1 text-sm text-slate-900 font-medium whitespace-pre-wrap">{pharmacist.experience}</p>
                    </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default PharmacistDetails;
