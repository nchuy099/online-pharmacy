import { useState, useEffect } from 'react';
import { FaCircle, FaPowerOff, FaChevronDown } from 'react-icons/fa';
import SessionList from '../components/SessionList';
import ChatWindow from '../components/ChatWindow';
import UserInfoPanel from '../components/UserInfoPanel';
import DrugRecommendModal from '../components/DrugRecommendModal';
import PatientDetailsModal from '../components/PatientDetailsModal';
import PurchaseHistoryModal from '../components/PurchaseHistoryModal';
import CreatePrescriptionModal from '../components/CreatePrescriptionModal';
import EndSessionConfirmModal from '../components/EndSessionConfirmModal';
import { chatService } from '../services/chat.service';
import { subscribeNewActiveRoom } from '../../../shared/realtime/chatActiveRoomSocket';
import { subscribeRoomMessages, type RoomChatRealtimeMessage } from '../../../shared/realtime/chatRoomSocket';
import { patientApi } from '../services/patient.service';
import type { ChatSession, ChatMessage, CustomerInfo, PharmacistStatus, DrugRecommendation } from '../types/domain';
import type { PatientHistoryResponse, PrescriptionRequest } from '../types/patient';
import toast from 'react-hot-toast';

export default function ChatDashboardPage() {
    // State
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [customer, setCustomer] = useState<CustomerInfo | null>(null);
    const [status, setStatus] = useState<PharmacistStatus>('ONLINE');
    const [isDrugModalOpen, setIsDrugModalOpen] = useState(false);
    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
    const [isEndSessionModalOpen, setIsEndSessionModalOpen] = useState(false);
    const [isEndingSession, setIsEndingSession] = useState(false);
    const [endSessionTarget, setEndSessionTarget] = useState<ChatSession | null>(null);
    const [patientHistory, setPatientHistory] = useState<PatientHistoryResponse | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isSubmittingRx, setIsSubmittingRx] = useState(false);
    const [loading, setLoading] = useState(true);

    const mapRealtimeMessageToChatMessage = (msg: RoomChatRealtimeMessage): ChatMessage => ({
        id: msg.id,
        senderId: msg.senderId,
        senderType: msg.senderType as ChatMessage['senderType'],
        content: msg.content,
        type: (msg.type as ChatMessage['type']) || 'TEXT',
        createdAt: msg.createdAt,
    });

    // Load initial sessions
    useEffect(() => {
        const loadSessions = async () => {
            try {
                const data = await chatService.getSessions();
                setSessions(data);
            } catch (error) {
                toast.error('Không thể tải danh sách phiên tư vấn');
            } finally {
                setLoading(false);
            }
        };
        loadSessions();

        // No polling: sessions are refreshed by explicit actions and websocket events.
    }, []);
    useEffect(() => {
        const unsubscribe = subscribeNewActiveRoom(async () => {
            try {
                const data = await chatService.getSessions();
                setSessions(data);
            } catch (error) {
                console.error("Failed to refresh active rooms from websocket event:", error);
            }
        });

        return () => unsubscribe();
    }, []);


    // Load session details when selected
    useEffect(() => {
        if (!selectedSession) {
            setMessages([]);
            setCustomer(null);
            setPatientHistory(null);
            return;
        }

        const loadDetails = async () => {
            try {
                const [info, history] = await Promise.all([
                    chatService.getCustomerInfo(selectedSession.customerId),
                    chatService.getMessages(selectedSession.id),
                ]);
                setMessages(history);
                setCustomer(info);

                // Mark as read in session list locally
                setSessions(prev => prev.map(s =>
                    s.id === selectedSession.id ? { ...s, unreadCount: 0 } : s
                ));
            } catch (error) {
                console.error('Failed to load session details:', error);
                toast.error('Không thể tải thông tin chi tiết');
            }
        };

        loadDetails();

        if (selectedSession.status === 'CLOSED') {
            return;
        }

        const unsubscribeRoomMessages = subscribeRoomMessages(selectedSession.id, (incomingMessage) => {
            const mapped = mapRealtimeMessageToChatMessage(incomingMessage);
            setMessages((prev) => {
                if (prev.some((item) => item.id === mapped.id)) {
                    return prev;
                }
                return [...prev, mapped];
            });
        });

        return () => {
            unsubscribeRoomMessages();
        };
    }, [selectedSession?.id]); // Use id to avoid unnecessary effect triggers

    // Handlers
    const handleSendMessage = async (content: string, type: string = 'TEXT') => {
        if (!selectedSession) return;
        if (selectedSession.status !== 'ACTIVE') {
            toast.error('Cần nhận phiên tư vấn trước khi gửi tin nhắn');
            return;
        }
        try {
            await chatService.sendMessageRealtime(selectedSession.id, content, type);
        } catch (error) {
            toast.error('Không thể gửi tin nhắn');
        }
    };

    const handleRecommendDrug = (items: DrugRecommendation[]) => {
        if (!selectedSession) return;

        const drugData = items
            .filter((item) => item.productId && item.variantId)
            .map((item) => ({
                // Keep `id` for backward compatibility in customer parser,
                // but it must be variantId for add-to-cart.
                id: item.variantId,
                productId: item.productId,
                variantId: item.variantId,
                name: item.productName,
                webName: item.productName,
                price: item.salePrice ?? 0,
                quantity: item.quantity || 1,
                image: item.primaryImage || undefined,
                variantName: item.variantName || undefined
            }));

        if (drugData.length === 0) {
            toast.error("Không có thuốc hợp lệ để gửi");
            return;
        }

        handleSendMessage(JSON.stringify(drugData), "DRUG_RECOMMEND");

        setIsDrugModalOpen(false);
        toast.success("Đã gửi đề xuất thuốc");
    };

    const loadPatientHistory = async () => {
        if (!selectedSession?.customerId) return;
        setIsLoadingHistory(true);
        try {
            const history = await patientApi.getPatientHistory(selectedSession.customerId);
            setPatientHistory(history);
        } catch (error) {
            toast.error('Không thể tải lịch sử bệnh nhân');
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleOpenPatientHistory = () => {
        setIsHistoryModalOpen(true);
        if (!patientHistory) {
            loadPatientHistory();
        }
    };

    const handleOpenPatientDetails = () => {
        setIsPatientModalOpen(true);
        if (!patientHistory) {
            loadPatientHistory();
        }
    };

    const handleCreatePrescription = async (request: PrescriptionRequest) => {
        setIsSubmittingRx(true);
        try {
            const prescription = await patientApi.createPrescription(request);
            
            // Send prescription as a chat message so customer can see it in chat
            if (selectedSession) {
                await handleSendMessage(JSON.stringify(prescription), 'PRESCRIPTION');
            }

            toast.success('Đã tạo đơn thuốc và gửi cho khách hàng');
            setIsPrescriptionModalOpen(false);
            // Reload history to reflect the new prescription
            loadPatientHistory();
        } catch (error) {
            toast.error('Lỗi khi tạo đơn thuốc');
        } finally {
            setIsSubmittingRx(false);
        }
    };

    const handleJoinSession = async (session?: ChatSession) => {
        const targetSession = session || selectedSession;
        if (!targetSession || targetSession.status !== 'WAITING') return;
        try {
            await chatService.joinSession(targetSession.id);
            // Update local status to ACTIVE
            setSessions(prev => prev.map(s =>
                s.id === targetSession.id ? { ...s, status: 'ACTIVE' } : s
            ));
            if (selectedSession?.id === targetSession.id) {
                setSelectedSession(prev => prev ? { ...prev, status: 'ACTIVE' } : null);
            }
            toast.success('Đã nhận phiên tư vấn');
        } catch (error) {
            toast.error('Không thể nhận phiên tư vấn');
        }
    };

    const handleEndSession = () => {
        if (!selectedSession) return;
        setEndSessionTarget(selectedSession);
        setIsEndSessionModalOpen(true);
    };

    const handleConfirmEndSession = async () => {
        if (!endSessionTarget) return;
        setIsEndingSession(true);
        try {
            await chatService.closeSession(endSessionTarget.id);
            setSessions(prev => prev.map(s =>
                s.id === endSessionTarget.id ? { ...s, status: 'CLOSED' } : s
            ));
            setSelectedSession(prev => prev && prev.id === endSessionTarget.id ? { ...prev, status: 'CLOSED' } : prev);
            setEndSessionTarget(null);
            setIsEndSessionModalOpen(false);
            toast.success('Đã kết thúc phiên tư vấn');
        } catch (error) {
            toast.error('Không thể kết thúc phiên');
        } finally {
            setIsEndingSession(false);
        }
    };

    const toggleStatus = (newStatus: PharmacistStatus) => {
        setStatus(newStatus);
        toast.success(`Trạng thái: ${newStatus}`);
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }
    return (
        <div className="h-[calc(100vh-80px)] flex flex-col -m-6 transition-colors overflow-hidden">
            {/* Top Toolbar */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-14 flex items-center justify-between px-6 shadow-sm z-10">
                <div className="flex items-center gap-6">
                    <h1 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-2">
                        Pharmacist Portal
                    </h1>

                    <div className="h-6 w-[1px] bg-gray-200 dark:bg-gray-700" />

                    <div className="relative group">
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-lg group-hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                            <FaCircle className={`text-[8px] ${status === 'ONLINE' ? 'text-green-500' : status === 'BUSY' ? 'text-yellow-500' : 'text-gray-400'}`} />
                            <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">{status}</span>
                            <FaChevronDown className="text-[8px] text-gray-400" />
                        </button>
                        <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                            <button onClick={() => toggleStatus('ONLINE')} className="w-full text-left px-4 py-2 text-[10px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                                <FaCircle className="text-[6px] text-green-500" /> ONLINE
                            </button>
                            <button onClick={() => toggleStatus('BUSY')} className="w-full text-left px-4 py-2 text-[10px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                                <FaCircle className="text-[6px] text-yellow-500" /> BUSY
                            </button>
                            <button onClick={() => toggleStatus('OFFLINE')} className="w-full text-left px-4 py-2 text-[10px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                                <FaCircle className="text-[6px] text-gray-400" /> OFFLINE
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* 1. Session List Column */}
                <div className="w-80 flex-shrink-0 flex flex-col">
                    {sessions.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                <FaPowerOff className="text-2xl" />
                            </div>
                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-2">Đang chờ khách...</h3>
                            <p className="text-xs text-gray-400 font-medium mb-6">Mọi thứ đang hoạt động bình thường.</p>
                            <button
                                onClick={() => toggleStatus('OFFLINE')}
                                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-black rounded-xl hover:bg-gray-200 transition-all uppercase tracking-widest"
                            >
                                Chuyển sang Offline
                            </button>
                        </div>
                    ) : (
                        <SessionList
                            sessions={sessions}
                            selectedId={selectedSession?.id || null}
                            onSelect={setSelectedSession}
                            onAccept={handleJoinSession}
                        />
                    )}
                </div>

                {/* 2. Chat Window Column */}
                <div className="flex-1 flex flex-col min-w-0">
                    {selectedSession ? (
                        <ChatWindow
                            messages={messages}
                            onSendMessage={handleSendMessage}
                            customerName={selectedSession.customerName}
                            status={selectedSession.status}
                            disabled={selectedSession.status === 'CLOSED'}
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-10 text-center">
                            <div className="w-20 h-20 bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm flex items-center justify-center mb-6 text-emerald-100">
                                <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em]">Chọn một phiên tư vấn</h2>
                            <p className="text-xs text-gray-400 font-medium mt-2">Dữ liệu bệnh nhân và lịch sử chat sẽ hiển thị tại đây.</p>
                        </div>
                    )}
                </div>

                {/* 3. User Info Panel Column */}
                <div className="w-80 flex-shrink-0 z-10 pl-1 pb-1">
                    <UserInfoPanel
                        customer={customer}
                        onRecommendDrug={() => setIsDrugModalOpen(true)}

                        onEndSession={handleEndSession}
                        onViewPatientDetails={handleOpenPatientDetails}
                        onViewPurchaseHistory={handleOpenPatientHistory}
                        onCreatePrescription={() => setIsPrescriptionModalOpen(true)}
                        sessionStatus={selectedSession?.status}
                    />
                </div>
            </div>

            {/* Modals */}
            <DrugRecommendModal
                isOpen={isDrugModalOpen}
                onClose={() => setIsDrugModalOpen(false)}
                onSubmit={handleRecommendDrug}
            />
            <PatientDetailsModal
                isOpen={isPatientModalOpen}
                onClose={() => setIsPatientModalOpen(false)}
                patient={patientHistory}
                isLoading={isLoadingHistory}
            />
            <PurchaseHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                patient={patientHistory}
                isLoading={isLoadingHistory}
            />
            <CreatePrescriptionModal
                isOpen={isPrescriptionModalOpen}
                onClose={() => setIsPrescriptionModalOpen(false)}
                customer={customer}
                onSubmit={handleCreatePrescription}
                isSubmitting={isSubmittingRx}
            />
            <EndSessionConfirmModal
                isOpen={isEndSessionModalOpen}
                isSubmitting={isEndingSession}
                sessionName={endSessionTarget?.customerName}
                onClose={() => {
                    setIsEndSessionModalOpen(false);
                    setEndSessionTarget(null);
                }}
                onConfirm={handleConfirmEndSession}
            />
        </div>
    );
}
