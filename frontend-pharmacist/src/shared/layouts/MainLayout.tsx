import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function MainLayout() {
    return (
        <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-900 transition-colors overflow-hidden">
            {/* Header */}
            <Header />

            {/* Main Content Area */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-950 p-6 transition-colors">
                <Outlet />
            </main>
        </div>
    );
}
