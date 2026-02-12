import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaClipboardCheck, FaNotesMedical, FaUserInjured, FaUserMd } from 'react-icons/fa';
import medicalConsultationService from '../services';
import { MedicalConsultationDetail } from '../types/dto';

const formatDateTime = (value?: string) => {
    if (!value) return '-';
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
};

const statusConfig: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: 'Đang mở', className: 'bg-emerald-100 text-emerald-700' },
    CLOSED: { label: 'Đã đóng', className: 'bg-slate-100 text-slate-700' },
    WAITING: { label: 'Chờ xử lý', className: 'bg-amber-100 text-amber-700' },
};

const MedicalConsultationDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [detail, setDetail] = useState<MedicalConsultationDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            setIsLoading(true);
            setError(null);
            try {
                const response = await medicalConsultationService.getDetail(id);
                setDetail(response);
            } catch (loadError) {
                console.error(loadError);
                setError('Không thể tải chi tiết phiên tư vấn.');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600" />
            </div>
        );
    }

    if (error || !detail) {
        return (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
                <p className="text-lg font-bold">Không thể tải phiên tư vấn</p>
                <p className="mt-1 text-sm">{error || 'Không tìm thấy dữ liệu.'}</p>
            </div>
        );
    }

    const status = statusConfig[detail.status] || { label: detail.status, className: 'bg-slate-100 text-slate-700' };

    return (
        <div className="space-y-6 py-6">
            <div className="flex flex-wrap items-center gap-4">
                <button
                    onClick={() => navigate('/medical-consultations')}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
                >
                    <FaArrowLeft /> Quay lại
                </button>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-500">Consultation Detail</p>
                    <h1 className="mt-2 truncate text-3xl font-black tracking-tight text-slate-900">{detail.title}</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {detail.specialtyName || detail.specialtyCode || 'Chưa phân loại'} • {detail.type}
                    </p>
                </div>
                <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.2em] ${status.className}`}>
                    {status.label}
                </span>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="space-y-6 xl:col-span-2">
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                                <FaNotesMedical />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Tóm tắt phiên</p>
                                <h2 className="text-lg font-bold text-slate-900">Metadata tư vấn</h2>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                            {[
                                { label: 'Bệnh nhân', value: detail.customerName, icon: FaUserInjured },
                                { label: 'Dược sĩ', value: detail.pharmacistName || 'Chưa gán', icon: FaUserMd },
                                { label: 'Chuyên khoa', value: detail.specialtyName || detail.specialtyCode || '-', icon: FaClipboardCheck },
                                { label: 'Mã tư vấn', value: detail.consultationId || '-', icon: FaNotesMedical },
                                { label: 'Tạo lúc', value: formatDateTime(detail.createdAt), icon: FaNotesMedical },
                                { label: 'Cập nhật cuối', value: formatDateTime(detail.updatedAt), icon: FaNotesMedical },
                            ].map((item) => (
                                <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                                    <p className="mt-2 text-sm font-semibold text-slate-800">{item.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Summary</p>
                            <p className="mt-2 text-sm leading-6 text-slate-700">{detail.summary || 'Chưa có summary được tạo cho phiên tư vấn này.'}</p>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Timeline</p>
                        <h2 className="mt-2 text-lg font-bold text-slate-900">Diễn tiến phiên tư vấn</h2>
                        <div className="mt-6 space-y-4">
                            {detail.timeline.length === 0 ? (
                                <p className="text-sm text-slate-500">Chưa có mốc thời gian nào.</p>
                            ) : detail.timeline.map((event, index) => (
                                <div key={`${event.type}-${index}`} className="flex gap-4">
                                    <div className="mt-1 flex flex-col items-center">
                                        <span className="h-3.5 w-3.5 rounded-full bg-emerald-500" />
                                        {index < detail.timeline.length - 1 && <span className="mt-2 h-full w-px bg-slate-200" />}
                                    </div>
                                    <div className="pb-4">
                                        <p className="text-sm font-bold text-slate-800">{event.label}</p>
                                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">{event.type}</p>
                                        <p className="mt-2 text-sm text-slate-500">{formatDateTime(event.occurredAt)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Prescriptions</p>
                        <h2 className="mt-2 text-lg font-bold text-slate-900">Đơn thuốc được kê</h2>
                        <div className="mt-6 space-y-4">
                            {detail.prescriptions.length === 0 ? (
                                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                                    Chưa có đơn thuốc nào gắn với phiên tư vấn này.
                                </p>
                            ) : detail.prescriptions.map((prescription) => (
                                <div key={prescription.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{prescription.diagnosis}</p>
                                            <p className="mt-1 text-xs text-slate-500">{formatDateTime(prescription.createdAt)}</p>
                                        </div>
                                        <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                                            {prescription.items.length} thuốc
                                        </span>
                                    </div>
                                    {prescription.generalInstructions && (
                                        <p className="mt-3 text-sm leading-6 text-slate-600">{prescription.generalInstructions}</p>
                                    )}
                                    <div className="mt-4 space-y-2">
                                        {prescription.items.map((item) => (
                                            <div key={item.id} className="rounded-xl border border-white bg-white px-3 py-2.5">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">{item.productName}</p>
                                                        <p className="mt-1 text-xs text-slate-500">{item.instructions}</p>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-500">x{item.quantity}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MedicalConsultationDetailPage;
