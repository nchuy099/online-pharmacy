import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ChatMessage, ChatMode, ChatRoom } from "../types/domain";
import { chatService } from "../services/chat.service";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { publishCustomerRoomMessage, subscribeCustomerRoomMessages } from "../realtime/chatRoomSocket";

interface ChatState {
    isWidgetOpen: boolean;
    activeMode: ChatMode | null;
    activeRoomId: string | null;
    messages: ChatMessage[];
    rooms: ChatRoom[];
    isLoading: boolean;
    isTyping: boolean;
    historyFilter: "ALL" | "AI" | "PHARMACIST";
    historyReturnState: ChatReturnState | null;
}

interface ChatReturnState {
    activeMode: ChatMode | null;
    activeRoomId: string | null;
    messages: ChatMessage[];
    isTyping: boolean;
}

interface ChatContextValue extends ChatState {
    openWidget: () => void;
    closeWidget: () => void;
    toggleWidget: () => void;
    startChat: (mode: ChatMode) => Promise<void>;
    selectRoom: (roomId: string) => Promise<void>;
    sendMessage: (content: string) => Promise<void>;
    goBack: () => Promise<void>;
    startNewAiChat: () => Promise<void>;
    openAiHistory: () => Promise<void>;
    openPharmacistHistory: () => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export const useChatContext = () => {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
    return ctx;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<ChatState>({
        isWidgetOpen: false,
        activeMode: null,
        activeRoomId: null,
        messages: [],
        rooms: [],
        isLoading: false,
        isTyping: false,
        historyFilter: "ALL",
        historyReturnState: null,
    });

    const { user } = useAuthContext();
    const navigate = useNavigate();

    const openWidget = useCallback(() => {
        if (!user) {
            navigate("/login");
            return;
        }
        setState(s => ({ ...s, isWidgetOpen: true }));
    }, [user, navigate]);

    const closeWidget = useCallback(() => setState(s => ({ ...s, isWidgetOpen: false })), []);

    const toggleWidget = useCallback(() => {
        if (!user) {
            navigate("/login");
            return;
        }
        setState(s => ({ ...s, isWidgetOpen: !s.isWidgetOpen }));
    }, [user, navigate]);

    const buildAiWelcomeMessage = useCallback((): ChatMessage => ({
        id: "ai-welcome",
        senderId: "AI_BOT",
        senderType: "AI",
        content: "Xin chào! 👋 Tôi là trợ lý AI của SmartPharma. Tôi có thể tư vấn sơ bộ về triệu chứng và gợi ý thuốc phù hợp. Bạn đang gặp vấn đề sức khỏe gì?",
        type: "TEXT",
        status: "SENT",
        createdAt: new Date().toISOString(),
    }), []);

    const loadHistory = useCallback(async (filter: "ALL" | "AI" | "PHARMACIST" = "ALL") => {
        setState(s => ({ ...s, activeMode: "history", isLoading: true, historyFilter: filter }));
        try {
            const rooms = await chatService.getMyChatRooms();
            setState(s => ({ ...s, rooms, isLoading: false, historyFilter: filter }));
        } catch (err) {
            console.error("[Chat] Failed to fetch chat rooms:", err);
            setState(s => ({ ...s, isLoading: false, historyFilter: filter }));
        }
    }, []);

    const startChat = useCallback(async (mode: ChatMode) => {
        setState(s => ({ ...s, activeMode: mode, isLoading: true, isWidgetOpen: true, messages: [], historyFilter: mode === "history" ? s.historyFilter : "ALL" }));

        if (mode === "ai") {
            try {
                const rooms = await chatService.getMyChatRooms();
                const aiRoom =
                    rooms.find(r => r.type === "AI" && (r.status === "ACTIVE" || r.status === "WAITING")) ||
                    rooms
                        .filter(r => r.type === "AI")
                        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

                if (aiRoom) {
                    setState(s => ({
                        ...s,
                        rooms,
                        activeMode: "ai",
                        activeRoomId: aiRoom.id,
                        messages: [],
                        isLoading: false,
                    }));
                    return;
                }
            } catch (err) {
                console.warn("[Chat] Failed to load existing AI room, fallback to welcome message:", err);
            }

            const welcomeMsg = buildAiWelcomeMessage();
            setState(s => ({ ...s, activeMode: mode, messages: [welcomeMsg], isLoading: false }));
        }
        else if (mode === "history") {
            await loadHistory("ALL");
        } else {
            // Pharmacist mode
            const welcomeMsg: ChatMessage = {
                id: "system-welcome",
                senderId: "SYSTEM",
                senderType: "SYSTEM",
                content: "Chào bạn! 👋 Hệ thống đang kết nối bạn với dược sĩ. Trong khi chờ, bạn có thể mô tả triệu chứng hoặc câu hỏi của mình nhé!",
                type: "TEXT",
                status: "SENT",
                createdAt: new Date().toISOString(),
            };

            setState(s => ({
                ...s,
                activeMode: mode,
                messages: [welcomeMsg],
                isLoading: false,
            }));
        }
    }, [buildAiWelcomeMessage, loadHistory, user?.id]);

    const startNewAiChat = useCallback(async () => {
        chatService.startNewAiConversation();
        const welcomeMsg = buildAiWelcomeMessage();
        setState(s => ({
            ...s,
            activeMode: "ai",
            activeRoomId: null,
            messages: [welcomeMsg],
            isLoading: false,
            isTyping: false,
            historyFilter: "ALL",
        }));
    }, [buildAiWelcomeMessage]);

    const openAiHistory = useCallback(async () => {
        await loadHistory("AI");
    }, [loadHistory]);

    const openPharmacistHistory = useCallback(async () => {
        setState(s => ({
            ...s,
            historyReturnState: {
                activeMode: s.activeMode,
                activeRoomId: s.activeRoomId,
                messages: s.messages,
                isTyping: s.isTyping,
            },
        }));

        await loadHistory("PHARMACIST");
    }, [loadHistory]);

    const isClosingSignal = useCallback((incoming: ChatMessage) => {
        if (incoming.senderType !== "SYSTEM") {
            return false;
        }

        const normalized = incoming.content.toLowerCase();
        return normalized.includes("phiên tư vấn đã kết thúc") || normalized.includes("đã kết thúc");
    }, []);

    const selectRoom = useCallback(async (roomId: string) => {
        setState(s => ({ ...s, isLoading: true }));
        try {
            const [messageList, selectedRoom] = await Promise.all([
                chatService.getRoomMessages(roomId),
                Promise.resolve(state.rooms.find(room => room.id === roomId)),
            ]);
            const nextMode: ChatMode = selectedRoom?.type === "AI" ? "ai" : "instant";
            setState(s => ({
                ...s,
                activeRoomId: roomId,
                messages: messageList,
                activeMode: nextMode,
                isLoading: false
            }));
        } catch (err) {
            console.error("[Chat] Failed to load room history:", err);
            setState(s => ({ ...s, isLoading: false }));
        }
    }, [state.rooms]);

    const restoreChatFromHistory = useCallback(async () => {
        const returnState = state.historyReturnState;

        if (!returnState) {
            setState(s => ({
                ...s,
                activeMode: null,
                activeRoomId: null,
                messages: [],
                isTyping: false,
                isLoading: false,
                historyFilter: "ALL",
            }));
            return;
        }

        if (returnState.activeRoomId) {
            await selectRoom(returnState.activeRoomId);
            setState(s => ({ ...s, historyReturnState: null }));
            return;
        }

        setState(s => ({
            ...s,
            activeMode: returnState.activeMode,
            activeRoomId: returnState.activeRoomId,
            messages: returnState.messages,
            isTyping: returnState.isTyping,
            isLoading: false,
            historyFilter: "ALL",
            historyReturnState: null,
        }));
    }, [selectRoom, state.historyReturnState]);

    const goBack = useCallback(async () => {
        if (state.historyReturnState) {
            await restoreChatFromHistory();
            return;
        }

        setState(s => ({
            ...s,
            activeMode: null,
            activeRoomId: null,
            messages: [],
            isTyping: false,
            isLoading: false,
            historyFilter: "ALL",
            historyReturnState: null,
        }));
    }, [restoreChatFromHistory, state.historyReturnState]);

    const sendMessage = useCallback(async (content: string) => {
        const currentRoom = state.activeRoomId ? state.rooms.find(r => r.id === state.activeRoomId) : undefined;
        if (state.activeMode === "instant" && currentRoom?.status === "CLOSED") {
            return;
        }

        const userMsg: ChatMessage = {
            id: `temp-${Date.now()}`,
            senderId: user?.id || "me",
            senderType: "CUSTOMER",
            content,
            type: "TEXT",
            status: "SENT",
            createdAt: new Date().toISOString(),
        };

        // If no room ID yet, create the room first
        let currentRoomId = state.activeRoomId;

        if (!currentRoomId && (state.activeMode === "instant" || state.activeMode === "ai")) {
            try {
                const userId = user?.id || "anonymous";
                const room = await chatService.createChatRoom({
                    type: state.activeMode === "ai" ? "AI" : "PHARMACIST",
                    participantIds: [userId],
                });
                currentRoomId = room.id;
                setState(s => ({
                    ...s,
                    activeRoomId: currentRoomId,
                    rooms: [room, ...s.rooms.filter(existing => existing.id !== room.id)]
                }));
            } catch (err) {
                console.error("[Chat] Failed to create room on first message:", err);
                return;
            }
        }

        if (state.activeMode === "ai") {
            setState(s => ({ ...s, messages: [...s.messages, userMsg] }));
            setState(s => ({ ...s, isTyping: true }));
            try {
                const aiReply = await chatService.sendAiMessage(content, currentRoomId || undefined);
                setState(s => ({
                    ...s,
                    messages: [...s.messages, aiReply],
                    isTyping: false,
                }));
            } catch (err) {
                console.error("[Chat] AI request failed:", err);
                const errorMsg: ChatMessage = {
                    id: `ai-err-${Date.now()}`,
                    senderId: "AI_BOT",
                    senderType: "AI",
                    content: "Xin lỗi, tôi đang gặp sự cố. Bạn vui lòng thử lại sau nhé!",
                    type: "TEXT",
                    status: "SENT",
                    createdAt: new Date().toISOString(),
                };
                setState(s => ({ ...s, messages: [...s.messages, errorMsg], isTyping: false }));
            }
        } else if (currentRoomId) {
            setState(s => ({ ...s, messages: [...s.messages, userMsg] }));
            try {
                await publishCustomerRoomMessage(currentRoomId, { content, type: "TEXT" });
            } catch (err) {
                setState(s => ({ ...s, messages: s.messages.filter(message => message.id !== userMsg.id) }));
                console.warn("[Chat] Failed to send message over websocket", err);
            }
        }
    }, [state.activeMode, state.activeRoomId, state.messages, state.rooms, user?.id]);

    // Realtime subscribe for pharmacist/customer room messages
    useEffect(() => {
        if (!state.activeRoomId || state.activeMode === "ai") return;

        const unsubscribe = subscribeCustomerRoomMessages(state.activeRoomId, (incoming) => {
            setState(s => {
                if (s.activeRoomId !== state.activeRoomId) {
                    return s;
                }

                if (s.messages.some(message => message.id === incoming.id)) {
                    return s;
                }

                const reconciled = s.messages.filter(message => {
                    if (!message.id.startsWith("temp-")) {
                        return true;
                    }
                    return !(message.senderType === incoming.senderType && message.content === incoming.content);
                });

                const nextRooms = isClosingSignal(incoming)
                    ? s.rooms.map(room => room.id === s.activeRoomId ? { ...room, status: "CLOSED" as const, lastMessage: incoming } : room)
                    : s.rooms;

                return {
                    ...s,
                    rooms: nextRooms,
                    messages: [...reconciled, incoming]
                };
            });
        });

        return () => unsubscribe();
    }, [state.activeRoomId, state.activeMode, isClosingSignal]);

    // Fetch rooms when widget opens (no polling)
    useEffect(() => {
        if (!user || !state.isWidgetOpen) return;

        const fetchRooms = async () => {
            try {
                const rooms = await chatService.getMyChatRooms();
                setState(s => ({ ...s, rooms }));
            } catch (err) {
                console.error("[Chat] Failed to fetch rooms:", err);
            }
        };

        fetchRooms();
    }, [user?.id, state.isWidgetOpen]);

    return (
        <ChatContext.Provider value={{
            ...state,
            openWidget,
            closeWidget,
            toggleWidget,
            startChat,
            selectRoom,
            sendMessage,
            goBack,
            startNewAiChat,
            openAiHistory,
            openPharmacistHistory,
        }}>
            {children}
        </ChatContext.Provider>
    );
};
