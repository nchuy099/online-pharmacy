import { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaChevronDown, FaFilePrescription, FaPills, FaCalendarAlt, FaShoppingCart } from 'react-icons/fa';
import type { ChatMessage } from '../types/domain';

interface Props {
    messages: ChatMessage[];
    onSendMessage: (content: string) => void;
    customerName: string;
    status: 'WAITING' | 'ACTIVE' | 'CLOSED';
    disabled?: boolean;
}

interface RecommendedItem {
    id: string;
    name: string;
    webName?: string;
    variantName?: string;
    price: number;
    image?: string;
    quantity?: number;
}

const templates = [
    { label: 'Chào hỏi', text: 'Chào bạn! Tôi là dược sĩ tư vấn. Bạn cần hỗ trợ gì ạ?' },
    { label: 'Hỏi triệu chứng', text: 'Bạn có thể mô tả cụ thể hơn triệu chứng của mình không ạ?' },
    { label: 'Khuyên khám', text: 'Trường hợp này bạn nên đến cơ sở y tế để được khám trực tiếp ạ.' },
    { label: 'Kết thúc', text: 'Cảm ơn bạn đã tin tưởng SmartPharma! Chúc bạn mau khỏe nhé!' },
];

const formatVND = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const DrugRecommendationMessage = ({ items }: { items: RecommendedItem[] }) => {
    if (!items.length) {
        return <div className="text-red-500 text-xs italic">Cấu trúc đề xuất không hợp lệ</div>;
    }

    return (
        <div className="space-y-3 min-w-[240px] max-w-sm">
            <p className="text-[11px] font-black text-emerald-600 uppercase tracking-wider mb-1">Sản phẩm đã đề xuất:</p>
            {items.map((item, i) => (
                <div key={`${item.id}-${i}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="flex gap-3 p-3">
                        <div className="w-16 h-16 bg-gray-50 rounded-xl flex-shrink-0 overflow-hidden border border-gray-50">
                            {item.image ? (
                                <img src={item.image} alt={item.webName || item.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-200">
                                    <FaShoppingCart className="text-xl" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 truncate leading-snug">{item.webName || item.name}</h4>
                            <p className="text-[11px] font-black text-emerald-600 mt-1">Giá/variant: {formatVND(item.price || 0)}</p>
                            <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Số lượng: {item.quantity || 1}</p>
                            <p className="text-[11px] font-black text-blue-600 mt-0.5">Tổng: {formatVND((item.price || 0) * (item.quantity || 1))}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default function ChatWindow({ messages, onSendMessage, customerName, status, disabled }: Props) {
    const [input, setInput] = useState('');
    const [showTemplates, setShowTemplates] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const isWaiting = status === 'WAITING';
    const isClosed = status === 'CLOSED';
    const isInputDisabled = disabled || isWaiting || isClosed;

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || isInputDisabled) return;
        onSendMessage(input.trim());
        setInput('');
    };

    const handleTemplate = (text: string) => {
        setInput(text);
        setShowTemplates(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 relative">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm font-medium">
                        Chưa có tin nhắn nào
                    </div>
                ) : (
                    messages.map(msg => {
                        const isPharmacist = msg.senderType === 'PHARMACIST';
                        const isSystem = msg.senderType === 'SYSTEM' || msg.type === 'SYSTEM';
                        const isRecommend = msg.type === 'DRUG_RECOMMEND';
                        const isPrescription = msg.type === 'PRESCRIPTION';

                        if (isSystem && !isRecommend) {
                            return (
                                <div key={msg.id} className="flex justify-center">
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold px-4 py-2 rounded-full">
                                        {msg.content}
                                    </div>
                                </div>
                            );
                        }

                        let recommendItems: any[] = msg.metadata || [];
                        if (isRecommend && recommendItems.length === 0) {
                            try {
                                recommendItems = JSON.parse(msg.content);
                            } catch {
                                recommendItems = [];
                            }
                        }

                        let prescription: any = msg.metadata;
                        if (isPrescription && !prescription) {
                            try {
                                prescription = JSON.parse(msg.content);
                            } catch {
                                prescription = null;
                            }
                        }

                        if (isRecommend) {
                            const items = (Array.isArray(recommendItems) ? recommendItems : [recommendItems])
                                .filter(Boolean)
                                .map((it: any) => ({
                                    id: it.id || it.productId || '',
                                    name: it.name || it.productName || 'Sản phẩm',
                                    webName: it.webName || it.productName,
                                    variantName: it.variantName,
                                    price: Number(it.price || it.salePrice || 0),
                                    image: it.image || it.primaryImage,
                                    quantity: Number(it.quantity || 1),
                                }))
                                .filter((it: RecommendedItem) => Boolean(it.id));

                            return (
                                <div key={msg.id} className={`flex ${isPharmacist ? 'justify-end' : 'justify-start'}`}>
                                    <div className="max-w-[85%]">
                                        <DrugRecommendationMessage items={items} />
                                        <div className={`flex items-center justify-end gap-1.5 mt-2.5 ${isPharmacist ? 'text-gray-400' : 'text-gray-400'}`}>
                                            <span className="text-[9px] font-bold tracking-tight">
                                                {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={msg.id} className={`flex ${isPharmacist ? 'justify-end' : 'justify-start'}`}>
                                {isPrescription && prescription ? (
                                    <div className="max-w-[85%] rounded-2xl overflow-hidden shadow-sm border border-indigo-100 dark:border-indigo-800 bg-white dark:bg-gray-800 animate-in slide-in-from-bottom-2 duration-300">
                                        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                                <FaFilePrescription className="text-white text-sm" />
                                            </div>
                                            <div>
                                                <p className="text-white font-black text-xs uppercase tracking-widest">Đơn Thuốc Điện Tử</p>
                                                <p className="text-white/70 text-[9px] font-bold">
                                                    Mã đơn: #{prescription.id?.substring(0, 8).toUpperCase()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="px-4 py-2.5 bg-gray-50/50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
                                            <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Chẩn đoán</p>
                                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{prescription.diagnosis}</p>
                                        </div>
                                        <div className="divide-y divide-gray-50 dark:divide-gray-700 max-h-64 overflow-y-auto">
                                            {prescription.items?.map((item: any, idx: number) => (
                                                <div key={idx} className="flex gap-3 px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                                                    {item.productImageUrl ? (
                                                        <img src={item.productImageUrl} alt="" className="w-10 h-10 rounded-xl object-cover shadow-sm ring-1 ring-gray-100 dark:ring-gray-700" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                                                            <FaPills className="text-indigo-300 dark:text-indigo-500 text-xs" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="text-[11px] font-black text-gray-900 dark:text-white leading-tight line-clamp-2 uppercase tracking-tight">
                                                                {item.productWebName || item.productName}
                                                            </p>
                                                            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 shrink-0">x{item.quantity}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[9px] font-black px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-md uppercase tracking-tighter ring-1 ring-indigo-100 dark:ring-indigo-800">
                                                                {item.variantName}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{item.unit}</span>
                                                        </div>
                                                        <div className="mt-1 space-y-1">
                                                            {(item.dosage || item.frequency || item.duration) && (
                                                                <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 leading-normal">
                                                                    {[item.dosage, item.frequency, item.duration].filter(Boolean).join(" | ")}
                                                                </p>
                                                            )}
                                                            {item.instructions && (
                                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 italic font-medium leading-normal">
                                                                    <span className="font-bold text-gray-400 not-italic">HDSD:</span> {item.instructions}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700">
                                            {(prescription.generalInstructions || prescription.followUpDate) && (
                                                <div className="space-y-1.5 mb-2">
                                                    {prescription.generalInstructions && (
                                                        <p className="text-[10px] font-medium text-amber-800 dark:text-amber-300 italic">
                                                            Lời dặn: {prescription.generalInstructions}
                                                        </p>
                                                    )}
                                                    {prescription.followUpDate && (
                                                        <div className="flex items-center gap-1.5">
                                                            <FaCalendarAlt className="text-amber-500 text-[9px]" />
                                                            <span className="text-[9px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                                                                Tái khám: {new Date(prescription.followUpDate).toLocaleDateString('vi-VN')}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex justify-end">
                                                <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 italic">
                                                    {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`max-w-[85%] ${isPharmacist
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700 shadow-sm'
                                        } rounded-2xl ${isPharmacist ? 'rounded-br-md shadow-emerald-200/50 dark:shadow-none' : 'rounded-bl-md shadow-gray-200/50 dark:shadow-none'} px-4 py-3 shadow-md transition-all duration-300 animate-in slide-in-from-bottom-2`}>
                                        {!isPharmacist && (
                                            <p className="text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-[0.15em]">{customerName}</p>
                                        )}
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                                        <div className={`flex items-center justify-end gap-1.5 mt-2.5 ${isPharmacist ? 'text-white/60' : 'text-gray-400'}`}>
                                            <span className="text-[9px] font-bold tracking-tight">
                                                {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <button
                            onClick={() => setShowTemplates(!showTemplates)}
                            disabled={isInputDisabled}
                            className="flex items-center gap-1 px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                            Template <FaChevronDown className="text-[8px]" />
                        </button>
                        {showTemplates && (
                            <div className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1 z-50">
                                {templates.map((t, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleTemplate(t.text)}
                                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">{t.label}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{t.text}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isWaiting ? "Vui lòng 'Nhận tư vấn' để chat..." : isClosed ? "Phiên tư vấn đã kết thúc" : 'Nhập tin nhắn...'}
                        disabled={isInputDisabled}
                        className="flex-1 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                    />

                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isInputDisabled}
                        className="w-10 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    >
                        <FaPaperPlane className="text-sm" />
                    </button>
                </div>
            </div>
        </div>
    );
}
