import { createBrowserRouter, Navigate } from "react-router-dom";
import { RootLayout } from "./layouts/RootLayout";
import { AccountLayout } from "./layouts/AccountLayout";

import UserProfilePage from "@/features/user/pages/UserProfilePage";
import UserAddressPage from "@/features/user/pages/UserAddressPage";
import PrescriptionsPage from "@/features/user/pages/PrescriptionsPage";
import SlugDispatchPage from "@/features/product/pages/SlugDispatchPage";
import { HomePage } from "@/features/home/pages/HomePage";
import { CartPage } from "@/features/cart/pages/CartPage";
import { CheckoutPage } from "@/features/order/pages/CheckoutPage";
import { OrderDetailsPage } from "@/features/order/pages/OrderDetailsPage";
import { OrderHistoryPage } from "@/features/order/pages/OrderHistoryPage";
import { PaymentPage } from "@/features/order/pages/PaymentPage";
import { OrderSuccessPage } from "@/features/order/pages/OrderSuccessPage";
import HealthProfilePage from "@/features/user/pages/HealthProfilePage";
import { RequireAuth } from "./RequireAuth";
import OAuth2CallbackPage from "@/features/auth/pages/OAuth2CallbackPage";
import ForbiddenPage from "@/features/auth/pages/ForbiddenPage";
import AuthPage from "@/features/auth/pages/AuthPage";

export const router = createBrowserRouter([
    {
        path: "/oauth2/callback",
        element: <OAuth2CallbackPage />
    },
    {
        path: "/forbidden",
        element: <ForbiddenPage />
    },
    {
        path: "/login",
        element: <AuthPage />
    },
    {
        path: "/",
        element: <RootLayout />,
        children: [
            {
                path: "/",
                element: <HomePage />
            },
            {
                path: "/me",
                element: (
                    <RequireAuth>
                        <AccountLayout />
                    </RequireAuth>
                ),
                children: [
                    {
                        path: "/me",
                        element: <Navigate to="/me/profile" replace />
                    },
                    {
                        path: "/me/profile",
                        element: (
                            <RequireAuth>
                                <UserProfilePage />
                            </RequireAuth>
                        )
                    },
                    {
                        path: "/me/orders",
                        element: (
                            <RequireAuth>
                                <OrderHistoryPage />
                            </RequireAuth>
                        )
                    },
                    {
                        path: "/me/prescriptions",
                        element: (
                            <RequireAuth>
                                <PrescriptionsPage />
                            </RequireAuth>
                        )
                    },
                    {
                        path: "/me/addresses",
                        element: (
                            <RequireAuth>
                                <UserAddressPage />
                            </RequireAuth>
                        )
                    },
                    {
                        path: "/me/health-profile",
                        element: (
                            <RequireAuth>
                                <HealthProfilePage />
                            </RequireAuth>
                        )
                    }
                ]
            },
            {
                path: "/cart",
                element: (
                    <RequireAuth>
                        <CartPage />
                    </RequireAuth>
                )
            },
            {
                path: "/checkout",
                element: (
                    <RequireAuth>
                        <CheckoutPage />
                    </RequireAuth>
                )
            },
            {
                path: "/orders/:id",
                element: (
                    <RequireAuth>
                        <OrderDetailsPage />
                    </RequireAuth>
                )
            },
            {
                path: "/orders/:id/payment",
                element: (
                    <RequireAuth>
                        <PaymentPage />
                    </RequireAuth>
                )
            },
            {
                path: "/orders/:id/success",
                element: (
                    <RequireAuth>
                        <OrderSuccessPage />
                    </RequireAuth>
                )
            },
            {
                path: "/orders/history",
                element: <Navigate to="/me/orders" replace />
            },
            {
                path: "/*",
                element: <SlugDispatchPage />
            }
        ]
    }
]);
