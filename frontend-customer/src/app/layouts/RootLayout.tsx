import { Outlet } from "react-router-dom"
import { Header } from "@/features/shared/components/Header";
import { Navbar } from "@/features/shared/components/Navbar";
import { Footer } from "@/features/shared/components/Footer";
import { ChatProvider } from "@/features/chat/context/ChatContext";
import { ChatWidget } from "@/features/chat/components/ChatWidget";
import { Toaster } from "react-hot-toast";
import { AuthModal } from "@/features/auth/components/AuthModal";
import { ScrollToTop } from "@/app/ScrollToTop";

export const RootLayout = () => {
    return (
        <ChatProvider>
            <ScrollToTop />
            <Toaster position="top-center" reverseOrder={false} />
            <div className="flex flex-col min-h-screen">
                <Header />
                <Navbar />
                <main className="flex-grow">
                    <Outlet />
                </main>
                <Footer />
                <ChatWidget />
                <AuthModal />
            </div>
        </ChatProvider>
    )
}
