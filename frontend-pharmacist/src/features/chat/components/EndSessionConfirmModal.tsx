import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';

interface Props {
    isOpen: boolean;
    isSubmitting: boolean;
    sessionName?: string;
    onClose: () => void;
    onConfirm: () => void;
}

export default function EndSessionConfirmModal({
    isOpen,
    isSubmitting,
    sessionName,
    onClose,
    onConfirm,
}: Props) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
            onClick={() => {
                if (!isSubmitting) {
                    onClose();
                }
            }}
        >
            <div
                className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 dark:bg-gray-800"
                role="dialog"
                aria-modal="true"
                aria-labelledby="end-session-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 px-5 py-4 dark:border-gray-700 dark:bg-gray-800/70">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                            <FaExclamationTriangle />
                        </div>
                        <div>
                            <h2 id="end-session-title" className="text-base font-black text-gray-900 dark:text-white">
                                Kết thúc phiên tư vấn
                            </h2>
                            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                                Xác nhận trước khi đóng phiên này
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                        aria-label="Đóng"
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className="px-5 py-5">
                    <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
                        {sessionName ? (
                            <>
                                Phiên tư vấn <span className="font-bold text-gray-900 dark:text-white">{sessionName}</span> sẽ được đánh dấu là đã kết thúc.
                                Sau khi xác nhận, khách hàng sẽ không thể tiếp tục gửi tin nhắn trong phiên này.
                            </>
                        ) : (
                            <>
                                Phiên tư vấn sẽ được đánh dấu là đã kết thúc. Sau khi xác nhận, khách hàng sẽ không thể tiếp tục gửi tin nhắn trong phiên này.
                            </>
                        )}
                    </p>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-5 py-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-black uppercase tracking-wider text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? 'Đang xử lý...' : 'Kết thúc phiên'}
                    </button>
                </div>
            </div>
        </div>
    );
}
