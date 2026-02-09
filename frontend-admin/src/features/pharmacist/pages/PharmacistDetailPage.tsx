import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUserMd, FaSave } from 'react-icons/fa';
import pharmacistService from '../services';
import { PharmacistResponse } from '../types/dto';
import specialtyService from '../../specialty/services';
import { Specialty } from '../../specialty/types/domain';

const PharmacistDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [pharmacist, setPharmacist] = useState<PharmacistResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);
    const [specialties, setSpecialties] = useState<Specialty[]>([]);

    const [qualifications, setQualifications] = useState('');
    const [education, setEducation] = useState('');
    const [experience, setExperience] = useState('');
    const [specialtyCode, setSpecialtyCode] = useState('');
    const [isApproved, setIsApproved] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            try {
                const [p, spec] = await Promise.all([
                    pharmacistService.getDetails(id),
                    specialtyService.getList(1, 200)
                ]);
                setPharmacist(p);
                setQualifications(p.qualifications || '');
                setEducation(p.education || '');
                setExperience(p.experience || '');
                setSpecialtyCode(p.specialtyCode || '');
                setIsApproved(!!p.isApproved);
                setSpecialties(spec.specialties || []);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [id]);

    const canApprove = !!(education && education.trim() && specialtyCode && specialtyCode.trim());

    const handleSave = async () => {
        if (!id) return;
        setIsSaving(true);
        setSaveMsg(null);
        try {
            if (isApproved && !canApprove) {
                setSaveMsg('✗ Không thể duyệt: cần điền đủ Học vấn và Chuyên khoa');
                setIsSaving(false);
                return;
            }

            const updated = await pharmacistService.update(id, {
                qualifications,
                education,
                experience,
                specialtyCode,
                isApproved,
            });
            if (updated) {
                setPharmacist(updated);
                setIsApproved(!!updated.isApproved);
            }
            setSaveMsg('✓ Đã lưu thay đổi thành công');
        } catch (e) {
            console.error(e);
            setSaveMsg('✗ Có lỗi xảy ra khi lưu');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin h-10 w-10 border-b-2 border-indigo-600 rounded-full" />
            </div>
        );
    }
    if (!pharmacist) return <div className="p-10 text-center text-slate-400">Không tìm thấy dược sĩ</div>;

    const statusLabel = pharmacist.isApproved ? 'ĐÃ DUYỆT' : 'CHƯA DUYỆT';
    const statusClass = pharmacist.isApproved
        ? 'bg-emerald-100 text-emerald-700'
        : 'bg-amber-100 text-amber-700';

    return (
        <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/pharmacists')}
                    className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <FaArrowLeft />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-slate-900">{pharmacist.fullName}</h1>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Admin › Dược sĩ › Chi tiết</p>
                </div>
                <span className={'ml-auto px-3 py-1 rounded-full text-[10px] font-black tracking-wider ' + statusClass}>{statusLabel}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm text-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />

                        <div className="relative mb-6">
                            {pharmacist.avatarUrl ? (
                                <img src={pharmacist.avatarUrl} alt="Avatar" className="w-28 h-28 rounded-3xl mx-auto border-4 border-white shadow-md object-cover transition-transform group-hover:scale-105" />
                            ) : (
                                <div className="w-28 h-28 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-500 text-4xl font-black mx-auto border-4 border-white shadow-md">
                                    {pharmacist.fullName?.charAt(0)}
                                </div>
                            )}
                        </div>

                        <p className="font-bold text-xl text-slate-800 leading-tight">{pharmacist.fullName}</p>
                        <p className="text-sm text-indigo-500 font-bold mt-2 break-all px-2">{pharmacist.email}</p>
                        <p className="text-sm text-slate-400 font-medium mt-1">{pharmacist.phoneNumber}</p>
                    </div>
                </div>

                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <FaUserMd className="text-indigo-400" /> Thông tin chuyên môn
                        </h2>
                        <div className="space-y-3">
                            {[ 
                                { label: 'Bằng cấp', value: qualifications, set: setQualifications },
                                { label: 'Học vấn', value: education, set: setEducation },
                                { label: 'Kinh nghiệm', value: experience, set: setExperience },
                            ].map((f) => (
                                <div key={f.label}>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">{f.label}</label>
                                    <textarea
                                        rows={2}
                                        value={f.value}
                                        onChange={(e) => f.set(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-700 mb-4">Chuyên khoa</h2>
                        <select
                            value={specialtyCode}
                            onChange={(e) => setSpecialtyCode(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        >
                            <option value="">Chọn chuyên khoa</option>
                            {specialties.map((item) => (
                                <option key={item.id} value={item.code}>{item.name} ({item.code})</option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-700 mb-4">Duyệt tư vấn</h2>
                        <label className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                checked={isApproved}
                                onChange={(e) => setIsApproved(e.target.checked)}
                                disabled={!canApprove && !isApproved}
                                className="mt-1 h-4 w-4 accent-indigo-600"
                            />
                            <div>
                                <p className="text-sm font-semibold text-slate-700">Cho phép dược sĩ tư vấn</p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Chỉ được bật khi đã điền đủ Học vấn và Chuyên khoa.
                                </p>
                                {!canApprove && (
                                    <p className="text-xs text-amber-600 mt-2">Thiếu dữ liệu: cần Học vấn và Chuyên khoa để duyệt.</p>
                                )}
                            </div>
                        </label>
                    </div>

                    {saveMsg && (
                        <div className={
                            'px-4 py-2 rounded-xl text-sm font-medium ' +
                            (saveMsg.indexOf('✓') >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600')
                        }>
                            {saveMsg}
                        </div>
                    )}
                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md shadow-indigo-200 min-w-[200px]"
                        >
                            <FaSave /> {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PharmacistDetailPage;
