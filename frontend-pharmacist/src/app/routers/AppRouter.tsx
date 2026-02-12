import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../../shared/layouts/MainLayout';
import LoginPage from '../../features/auth/pages/LoginPage';
import ProfilePage from '../../features/profile/pages/ProfilePage';
import ChatDashboardPage from '../../features/chat/pages/ChatDashboardPage';
import ForbiddenPage from '../../pages/ForbiddenPage';
import { PrivateRoute } from './PrivateRoute';
import { DefaultRoute } from './DefaultRoute';

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage />,
    },
    {
        path: '/forbidden',
        element: <ForbiddenPage />,
    },
    {
        path: '/',
        element: <PrivateRoute />,
        children: [
            {
                element: <MainLayout />,
                children: [
                    { path: '/', element: <DefaultRoute /> },
                    {
                        path: 'chat-dashboard',
                        element: <ChatDashboardPage />,
                    },
                    {
                        path: 'profile',
                        element: <ProfilePage />,
                    },
                ],
            },
        ],
    },
]);
