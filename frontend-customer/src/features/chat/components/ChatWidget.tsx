import React, { useState } from "react";
import { FaComments, FaTimes, FaUserMd, FaRobot, FaArrowLeft, FaShieldAlt, FaChevronRight, FaHeartbeat, FaPlus, FaHistory } from "react-icons/fa";
import { useChatContext } from "../context/ChatContext";
import { ChatCore } from "./ChatCore";
import type { ChatMode } from "../types/domain";

const modeOptions: { mode: ChatMode; icon: React.ReactNode; title: string; desc: string; gradient: string }[] = [
    {
        mode: "instant",
        icon: <FaUserMd className="text-lg" />,
        title: "Chat với Dược sĩ",
        desc: "Kết nối ngay với dược sĩ trực tuyến",
        gradient: "from-emerald-500 to-teal-600",
    },
    {
        mode: "ai",
        icon: <FaRobot className="text-lg" />,
        title: "Chat AI Chatbot",
        desc: "Tư vấn sơ bộ với trợ lý AI",
        gradient: "from-violet-500 to-purple-600",
    },
    // {
    //     mode: "history",
    //     icon: <FaComments className="text-lg" />,
    //     title: "Lịch sử tư vấn",
    //     desc: "Xem lại các cuộc trò chuyện cũ",
    //     gradient: "from-blue-500 to-indigo-600",
    // },
];

// ── Main Widget ──
export const ChatWidget: React.FC = () => {
    const { isWidgetOpen, activeMode, activeRoomId, messages, rooms, isLoading, isTyping, historyFilter, toggleWidget, startChat, selectRoom, sendMessage, goBack, startNewAiChat, openAiHistory, openPharmacistHistory } = useChatContext();
    const [inputValue, setInputValue] = useState("");

    const handleSend = () => {
        if (!inputValue.trim()) return;
        sendMessage(inputValue);
        setInputValue("");
    };

    const handleModeSelect = (mode: ChatMode) => {
        if (mode === "instant") {
            const activeRoom = rooms.find(r => r.type === "PHARMACIST" && (r.status === "ACTIVE" || r.status === "WAITING"));
            if (activeRoom) {
                selectRoom(activeRoom.id);
            } else {
                startChat("instant");
            }
        } else if (mode === "ai") {
            const activeAiRoom = rooms.find(r => r.type === "AI" && (r.status === "ACTIVE" || r.status === "WAITING"));
            if (activeAiRoom) {
                selectRoom(activeAiRoom.id);
            } else {
                startChat("ai");
            }
        } else {
            startChat(mode);
        }
    };


    const handleBack = () => {
        void goBack();
    };

    const isAi = activeMode === "ai";
    const isHistory = activeMode === "history";
    const chatTitle = isAi ? "AI Chatbot" : (isHistory ? "Lịch sử tư vấn" : "Dược sĩ tư vấn");
    const activeRoom = activeRoomId ? rooms.find(room => room.id === activeRoomId) : undefined;
    const historyRooms =
        historyFilter === "AI"
            ? rooms.filter(r => r.type === "AI")
            : historyFilter === "PHARMACIST"
                ? rooms.filter(r => r.type === "PHARMACIST")
                : rooms;
    const showPharmacistHistoryButton = activeMode === "instant" && !isAi && !isHistory;

    return (
        <>
            {/* ── Floating Button ── */}
            <button
                onClick={toggleWidget}
                className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-2xl flex flex-col items-center justify-center transition-all duration-300 ${isWidgetOpen
                    ? "bg-gray-800 hover:bg-gray-900 rotate-90 scale-90"
                    : "bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 hover:scale-110 shadow-emerald-500/30 font-black text-white"}`}
            >
                {isWidgetOpen ? (
                    <FaTimes className="text-2xl" />
                ) : (
                    <div className="flex flex-col items-center gap-0.5">
                        <FaComments className="text-xl" />
                        <span className="text-[10px] uppercase leading-none">Tư vấn</span>
                    </div>
                )}
            </button>

            {/* ── Chat Panel ── */}
            {isWidgetOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-[380px] h-[620px] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-scaleIn" style={{ animation: "scaleIn 0.2s ease-out" }}>
                    {/* Header (Matching Long Châu style) */}
                    <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-50">
                        <div className="flex items-center gap-3">
                            {activeMode ? (
                                <button onClick={handleBack} className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all">
                                    <FaArrowLeft className="text-sm" />
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
                                        <FaHeartbeat className="text-white text-xl" />
                                    </div>
                                    <div className="flex flex-col -gap-1">
                                        <span className="font-black text-[#001737] tracking-tighter text-base leading-tight">SmartPharma</span>
                                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Chăm sóc sức khỏe</span>
                                    </div>
                                </div>
                            )}
                            {activeMode && (
                                <div className="ml-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-[#001737] text-[14px] font-black leading-tight">
                                            {chatTitle}
                                        </h3>
                                        {showPharmacistHistoryButton && (
                                            <button
                                                onClick={() => void openPharmacistHistory()}
                                                className="w-7 h-7 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-emerald-600 flex items-center justify-center transition-all"
                                                title="Xem lịch sử tư vấn"
                                            >
                                                <FaHistory className="text-xs" />
                                            </button>
                                        )}
                                        {isAi && (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => void openAiHistory()}
                                                    className="w-7 h-7 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-emerald-600 flex items-center justify-center transition-all"
                                                    title="Xem lịch sử chat AI"
                                                >
                                                    <FaHistory className="text-xs" />
                                                </button>
                                                <button
                                                    onClick={() => void startNewAiChat()}
                                                    className="w-7 h-7 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-emerald-600 flex items-center justify-center transition-all"
                                                    title="Tạo chat AI mới"
                                                >
                                                    <FaPlus className="text-xs" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                            <span className="text-emerald-600 text-[10px] font-black uppercase tracking-wider">
                                                {isHistory && historyFilter === "AI"
                                                    ? "Lịch sử AI"
                                                    : isHistory && historyFilter === "PHARMACIST"
                                                        ? "Lịch sử tư vấn dược sĩ"
                                                        : "Đang trực tuyến"}
                                            </span>
                                        </div>
                                </div>
                            )}
                        </div>

                        {/* Close Button (Clean Black X on the Right) */}
                        <button
                            onClick={toggleWidget}
                            className="w-10 h-10 flex items-center justify-center text-[#001737] hover:text-black transition-all transform hover:scale-110"
                        >
                            <FaTimes className="text-3xl font-light" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-grow flex flex-col overflow-hidden bg-[#F8FAFC]">
                        {!activeMode ? (
                            /* ── Mode Selection ── */
                            <div className="p-5 space-y-4 overflow-y-auto">
                                <div className="flex items-center gap-2 px-1 mb-2">
                                    <FaShieldAlt className="text-emerald-500 text-[11px]" />
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Bảo mật & Chuẩn y khoa</span>
                                </div>
                                {modeOptions.map(opt => (
                                    <button
                                        key={opt.mode}
                                        onClick={() => handleModeSelect(opt.mode)}
                                        className="w-full text-left p-5 rounded-2xl bg-white border border-gray-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${opt.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                                {opt.icon}
                                            </div>
                                            <div>
                                                <h4 className="text-[15px] font-black text-[#001737] group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{opt.title}</h4>
                                                <p className="text-[11px] text-gray-400 font-bold leading-tight mt-0.5">{opt.desc}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : isHistory ? (
                            /* ── History View ── */
                            <div className="p-4 space-y-2 overflow-y-auto">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center h-40 gap-3">
                                        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Đang tải lịch sử...</p>
                                    </div>
                                ) : historyRooms.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 opacity-40 text-center">
                                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                            <FaComments className="text-3xl text-gray-300" />
                                        </div>
                                        <p className="text-[11px] font-black uppercase tracking-widest">
                                            {historyFilter === "AI"
                                                ? "Chưa có lịch sử chat AI"
                                                : historyFilter === "PHARMACIST"
                                                    ? "Chưa có lịch sử tư vấn dược sĩ"
                                                    : "Chưa có lịch sử tư vấn"}
                                        </p>
                                    </div>
                                ) : (
                                    historyRooms.map(room => (
                                        <button
                                            key={room.id}
                                            onClick={() => selectRoom(room.id)}
                                            className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-50 hover:border-emerald-200 transition-all group shadow-sm hover:shadow-md"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                                    <FaUserMd />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-black text-[#001737] group-hover:text-emerald-600 transition-colors uppercase tracking-tighter">
                                                        {room.title || "Phiên tư vấn"}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">
                                                        {new Date(room.createdAt).toLocaleDateString('vi-VN')} • {room.status}
                                                    </p>
                                                </div>
                                            </div>
                                            <FaChevronRight className="text-gray-300 text-[10px] group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                                        </button>
                                    ))
                                )}
                            </div>
                        ) : (
                            /* ── Active Chat ── */
                            <ChatCore
                                messages={messages}
                                isTyping={isTyping}
                                isAiMode={isAi}
                                compact
                                inputValue={inputValue}
                                onInputChange={setInputValue}
                                onSend={handleSend}
                                consultationStatus={activeRoom?.status}
                                pharmacistName={activeRoom?.pharmacistName}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Inline keyframes for animation */}
            <style>{`
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </>
    );
};
