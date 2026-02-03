import React, { useRef, useEffect } from "react";
import { FaPaperPlane, FaUserMd, FaRobot, FaCheckDouble, FaCheck, FaSmile, FaShoppingCart, FaBolt, FaPlus } from "react-icons/fa";
import type { ChatMessage } from "../types/domain";
import { useAddToCart } from "../../cart/hooks/useAddToCart";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { PrescriptionMessage } from "./PrescriptionMessage";

const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

interface RecommendedItem {
    id: string;
    productId?: string;
    variantId?: string;
    name: string;
    webName?: string;
    price: number;
    image?: string;
    quantity?: number;
}

const DrugRecommendationMessage = ({ content }: { content: string }) => {
    const { mutate: addToCart, isPending } = useAddToCart();
    const navigate = useNavigate();

    let items: RecommendedItem[] = [];
    try {
        const parsed = JSON.parse(content);
        items = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
        return <div className="text-red-500 text-xs italic">Cấu trúc đề xuất không hợp lệ</div>;
    }

    const handleAddToCart = (item: RecommendedItem) => {
        const variantId = item.variantId || item.id;
        addToCart({ variantId, quantity: item.quantity || 1 }, {
            onSuccess: () => toast.success(`Đã thêm ${item.webName || item.name} vào giỏ`, {
                duration: 3000,
                style: {
                    borderRadius: '16px',
                    background: '#059669',
                    color: '#fff',
                    fontWeight: 'bold',
                },
            }),
            onError: (error: unknown) => {
                const message = error instanceof Error ? error.message : "Không thể thêm vào giỏ";
                toast.error(message);
            }
        });
    };

    const handleBuyNow = (item: RecommendedItem) => {
        const variantId = item.variantId || item.id;
        navigate(`/checkout?mode=BUY_NOW&variantId=${variantId}&quantity=${item.quantity || 1}`);
    };

    return (
        <div className="space-y-3 min-w-[240px] max-w-sm">
            <p className="text-[11px] font-black text-emerald-600 uppercase tracking-wider mb-1">Dược sĩ đề xuất cho bạn:</p>
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
                            <p className="text-[13px] font-black text-emerald-600 mt-1">{formatVND(item.price)}</p>
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">Số lượng: {item.quantity || 1}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-px bg-gray-100 border-t border-gray-100">
                        <button
                            onClick={() => handleAddToCart(item)}
                            disabled={isPending}
                            className="bg-white py-2.5 flex items-center justify-center gap-2 text-[11px] font-black text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <FaPlus className="text-[9px]" /> THÊM GIỎ
                        </button>
                        <button
                            onClick={() => handleBuyNow(item)}
                            disabled={isPending}
                            className="bg-white py-2.5 flex items-center justify-center gap-2 text-[11px] font-black text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                        >
                            <FaBolt className="text-[9px]" /> MUA NGAY
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

interface ChatCoreProps {
    messages: ChatMessage[];
    isTyping?: boolean;
    isAiMode?: boolean;
    compact?: boolean;
    inputValue: string;
    onInputChange: (val: string) => void;
    onSend: () => void;
    consultationStatus?: "WAITING" | "ACTIVE" | "CLOSED";
    pharmacistName?: string;
}

const renderInlineMarkdown = (text: string, me: boolean, keyPrefix: string) => {
    const tokenRegex = /(\*\*[^*]+\*\*|\[[^\]]+\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\))/g;
    const nodes: React.ReactNode[] = [];
    let cursor = 0;
    let match: RegExpExecArray | null;
    let i = 0;

    while ((match = tokenRegex.exec(text)) !== null) {
        const token = match[0];
        const start = match.index;
        if (start > cursor) {
            nodes.push(text.slice(cursor, start));
        }

        if (token.startsWith("**") && token.endsWith("**")) {
            nodes.push(
                <strong key={`${keyPrefix}-b-${i++}`} className="font-extrabold">
                    {token.slice(2, -2)}
                </strong>
            );
        } else {
            const linkMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)$/);
            if (linkMatch) {
                const label = linkMatch[1];
                const url = linkMatch[2];
                nodes.push(
                    <a
                        key={`${keyPrefix}-a-${i++}`}
                        href={url}
                        target={url.startsWith("http") ? "_blank" : undefined}
                        rel={url.startsWith("http") ? "noopener noreferrer" : undefined}
                        className={`underline underline-offset-2 font-semibold ${me ? "text-white/95" : "text-emerald-700"}`}
                    >
                        {label}
                    </a>
                );
            } else {
                nodes.push(token);
            }
        }

        cursor = start + token.length;
    }

    if (cursor < text.length) nodes.push(text.slice(cursor));
    return nodes;
};

const renderMarkdownMessage = (content: string, me: boolean) => {
    const lines = content.split("\n");
    const blocks: React.ReactNode[] = [];
    let listItems: string[] = [];

    const flushList = (prefix: string) => {
        if (!listItems.length) return;
        blocks.push(
            <ul key={`${prefix}-ul-${blocks.length}`} className="list-disc pl-5 space-y-1">
                {listItems.map((item, idx) => (
                    <li key={`${prefix}-li-${idx}`}>{renderInlineMarkdown(item, me, `${prefix}-li-${idx}`)}</li>
                ))}
            </ul>
        );
        listItems = [];
    };

    lines.forEach((rawLine, idx) => {
        const line = rawLine.trim();
        const key = `md-${idx}`;

        if (!line) {
            flushList(key);
            blocks.push(<div key={`${key}-sp`} className="h-1" />);
            return;
        }

        const bullet = line.match(/^[-*]\s+(.*)$/);
        if (bullet) {
            listItems.push(bullet[1]);
            return;
        }

        flushList(key);
        const heading = line.match(/^#{1,3}\s+(.*)$/);
        if (heading) {
            blocks.push(
                <p key={`${key}-h`} className="font-black tracking-tight">
                    {renderInlineMarkdown(heading[1], me, `${key}-h`)}
                </p>
            );
            return;
        }

        blocks.push(<p key={`${key}-p`}>{renderInlineMarkdown(line, me, `${key}-p`)}</p>);
    });

    flushList("final");
    return blocks;
};

export const ChatCore: React.FC<ChatCoreProps> = ({
    messages, isTyping, isAiMode, compact, inputValue, onInputChange, onSend, consultationStatus
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const isConsultationClosed = !isAiMode && consultationStatus === "CLOSED";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isConsultationClosed || !inputValue.trim()) return;
        onSend();
        inputRef.current?.focus();
    };

    const isMe = (msg: ChatMessage) => msg.senderType === "CUSTOMER";
    const isSystem = (msg: ChatMessage) => msg.senderType === "SYSTEM";
    const isFirstInGroup = (idx: number) => idx === 0 || messages[idx].senderType !== messages[idx - 1].senderType;
    const isLastInGroup = (idx: number) => idx === messages.length - 1 || messages[idx].senderType !== messages[idx + 1].senderType;

    const renderStatus = (status: string) => {
        if (status === "READ") return <FaCheckDouble className="text-emerald-400 text-[9px]" />;
        if (status === "DELIVERED") return <FaCheckDouble className="text-gray-300 text-[9px]" />;
        return <FaCheck className="text-gray-300 text-[9px]" />;
    };

    const SenderIcon = isAiMode ? FaRobot : FaUserMd;
    const senderGradient = isAiMode
        ? "from-violet-400 to-purple-600"
        : "from-emerald-400 to-teal-600";
    return (
        <div className={`flex flex-col ${compact ? "h-full" : "h-full"}`}>
            {/* Messages */}
            <div className={`flex-grow overflow-y-auto ${compact ? "px-3 py-3" : "px-6 py-4"}`}>
                <div className="space-y-0.5">
                    {messages.map((msg, idx) => {
                        const me = isMe(msg);
                        const system = isSystem(msg);
                        const first = isFirstInGroup(idx);
                        const last = isLastInGroup(idx);

                        return (
                            <React.Fragment key={msg.id}>
                                {system ? (
                                    <div className="mt-2 flex justify-center">
                                        <div className={`w-fit rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${msg.content.includes("kết thúc")
                                            ? "border-red-200 bg-red-50 text-red-600"
                                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`flex items-end gap-2 ${me ? "justify-end" : "justify-start"} ${first ? "mt-3" : "mt-0.5"}`}>
                                    {!me && (
                                        <div className="w-7 flex-shrink-0">
                                            {last && (
                                                <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${senderGradient} flex items-center justify-center shadow-sm`}>
                                                    <SenderIcon className="text-white text-[10px]" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className={`max-w-[80%]`}>
                                        {msg.type === "DRUG_RECOMMEND" ? (
                                            <DrugRecommendationMessage content={msg.content} />
                                        ) : msg.type === "PRESCRIPTION" ? (
                                            <PrescriptionMessage content={msg.content} />
                                        ) : (
                                            <div className={`px-3 py-2 text-[13px] leading-relaxed font-medium shadow-sm ${me
                                                ? `bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl ${first ? "rounded-br-lg" : last ? "rounded-tr-lg" : "rounded-r-lg"}`
                                                : `bg-white text-gray-700 border border-gray-100/80 rounded-2xl ${first ? "rounded-bl-lg" : last ? "rounded-tl-lg" : "rounded-l-lg"}`
                                                }`}>
                                                <span className="break-words space-y-1.5 block">
                                                    {renderMarkdownMessage(msg.content, me)}
                                                </span>
                                            </div>
                                        )}
                                        {last && (
                                            <div className={`flex items-center gap-1 mt-0.5 px-1 ${me ? "justify-end" : ""}`}>
                                                <span className="text-[10px] text-gray-300 font-semibold">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                                {me && renderStatus(msg.status)}
                                            </div>
                                        )}
                                    </div>
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                    {isTyping && (
                        <div className="flex items-end gap-2 mt-3">
                            <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${senderGradient} flex items-center justify-center shadow-sm`}>
                                <SenderIcon className="text-white text-[10px]" />
                            </div>
                            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-lg px-4 py-3 shadow-sm">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className={`border-t border-gray-100 ${compact ? "px-3 py-2" : "px-6 py-3"} bg-white/80 backdrop-blur-xl`}>
                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                    <div className="flex-grow relative">
                        <input
                            ref={inputRef}
                            type="text"
                            disabled={isConsultationClosed}
                            value={inputValue}
                            onChange={e => onInputChange(e.target.value)}
                            placeholder={isAiMode ? "Hỏi AI về sức khỏe..." : isConsultationClosed ? "Phiên tư vấn đã kết thúc" : "Nhập câu hỏi tư vấn..."}
                            className={`w-full bg-gray-50 border border-gray-200 ${compact ? "rounded-xl px-3 py-2 pr-9 text-xs" : "rounded-2xl px-4 py-3 pr-10 text-sm"} font-medium text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10 transition-all`}
                        />
                        {!compact && (
                            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-amber-400 transition-colors">
                                <FaSmile className="text-lg" />
                            </button>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isConsultationClosed}
                        className={`${compact ? "w-9 h-9 rounded-xl" : "w-11 h-11 rounded-2xl"} flex items-center justify-center transition-all flex-shrink-0 ${inputValue.trim() && !isConsultationClosed
                            ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200/50 hover:scale-[1.04] active:scale-95"
                            : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}
                    >
                        <FaPaperPlane className={compact ? "text-[10px]" : "text-sm"} />
                    </button>
                </form>
            </div>
        </div>
    );
};
