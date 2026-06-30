import { Navigate, createBrowserRouter } from "react-router-dom";
import LoginPage from "../../features/auth/pages/LoginPage";
import Layout from "../layout/Layout";
import DashboardPage from "../../features/dashboard/pages/DashboardPage";
import UsersPage from "../../features/user/pages/UsersPage";
import CategoryPage from "../../features/category/pages/CategoryPage";
import ProductPage from "../../features/product/pages/ProductPage";
import ProductDetailsPage from "../../features/product/pages/ProductDetailsPage";
import ProductFormPage from "../../features/product/pages/ProductFormPage";
import { PrivateRoute } from "./PrivateRoute";
import { RequireRole } from "./RequireRole";
import OrderPage from "../../features/order/pages/OrderPage";
import OrderDetailsPage from "../../features/order/pages/OrderDetailsPage";
import InventoryPage from "../../features/inventory/pages/InventoryPage";
import InventoryTransactionPage from "../../features/inventory/pages/InventoryTransactionPage";
import InventoryTransactionsPage from "../../features/inventory/pages/InventoryTransactionsPage";
import ProfilePage from "../../features/profile/pages/ProfilePage";
import UserDetailPage from "../../features/user/pages/UserDetailPage";
import AdminsPage from "../../features/user/pages/AdminsPage";
import ForbiddenPage from "../../features/auth/pages/ForbiddenPage";
import HomePage from "../../features/home/pages/HomePage";
import RbacPage from "../../features/rbac/pages/RbacPage";
import RoleDetailPage from "../../features/rbac/pages/RoleDetailPage";
import PermissionDetailPage from "../../features/rbac/pages/PermissionDetailPage";
import MedicalConsultationListPage from "../../features/medical-consultation/pages/MedicalConsultationListPage";
import MedicalConsultationDetailPage from "../../features/medical-consultation/pages/MedicalConsultationDetailPage";
import FlashSalePage from "../../features/flash-sale/pages/FlashSalePage";
import FlashSaleEditorPage from "../../features/flash-sale/pages/FlashSaleEditorPage";

const router = createBrowserRouter([
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        path: "/forbidden",
        element: <ForbiddenPage />,
    },
    {
        path: "/",
        element: (
            <PrivateRoute>
                <Layout />
            </PrivateRoute>
        ),
        children: [
            { index: true, element: <HomePage /> },
            { path: "home", element: <HomePage /> },
            { path: "analytics", element: <RequireRole allowedPermissions={["READ_ANALYTICS"]}><DashboardPage /></RequireRole> },
            { path: "profile", element: <ProfilePage /> },
            { path: "rbac", element: <RequireRole allowedPermissions={["READ_RBAC"]}><RbacPage /></RequireRole> },
            { path: "rbac/roles/:roleId", element: <RequireRole allowedPermissions={["READ_RBAC"]}><RoleDetailPage /></RequireRole> },
            { path: "rbac/permissions/:permissionId", element: <RequireRole allowedPermissions={["READ_RBAC"]}><PermissionDetailPage /></RequireRole> },

            { path: "users", element: <RequireRole allowedPermissions={["READ_USER"]}><UsersPage /></RequireRole> },
            { path: "admins", element: <RequireRole allowedPermissions={["READ_USER"]}><AdminsPage /></RequireRole> },
            { path: "users/:id", element: <RequireRole allowedPermissions={["READ_USER"]}><UserDetailPage /></RequireRole> },
            { path: "medical-consultations", element: <RequireRole allowedPermissions={["READ_USER"]}><MedicalConsultationListPage /></RequireRole> },
            { path: "medical-consultations/:id", element: <RequireRole allowedPermissions={["READ_USER"]}><MedicalConsultationDetailPage /></RequireRole> },
            { path: "pharmacists", element: <Navigate to="/medical-consultations" replace /> },
            { path: "pharmacists/:id", element: <Navigate to="/medical-consultations" replace /> },

            { path: "categories", element: <RequireRole allowedPermissions={["READ_CATEGORY"]}><CategoryPage /></RequireRole> },
            { path: "products", element: <RequireRole allowedPermissions={["READ_PRODUCT"]}><ProductPage /></RequireRole> },
            { path: "products/new", element: <RequireRole allowedPermissions={["CREATE_PRODUCT"]}><ProductFormPage /></RequireRole> },
            { path: "products/:productId/edit", element: <RequireRole allowedPermissions={["UPDATE_PRODUCT"]}><ProductFormPage /></RequireRole> },
            { path: "products/:productId/details", element: <RequireRole allowedPermissions={["READ_PRODUCT"]}><ProductDetailsPage /></RequireRole> },
            { path: "inventories", element: <Navigate to="/inventories/summary" replace /> },
            { path: "inventories/summary", element: <RequireRole allowedPermissions={["READ_INVENTORY"]}><InventoryPage /></RequireRole> },
            { path: "inventories/:variantId/lots", element: <RequireRole allowedPermissions={["READ_INVENTORY"]}><InventoryTransactionPage /></RequireRole> },
            { path: "inventories/:variantId/transactions", element: <RequireRole allowedPermissions={["READ_INVENTORY"]}><InventoryTransactionsPage /></RequireRole> },
            { path: "inventories/:id/transactions", element: <Navigate to="/inventories/summary" replace /> },
            { path: "flash-sales", element: <RequireRole allowedPermissions={["MANAGE_FLASH_SALE"]}><FlashSalePage /></RequireRole> },
            { path: "flash-sales/new", element: <RequireRole allowedPermissions={["MANAGE_FLASH_SALE"]}><FlashSaleEditorPage /></RequireRole> },
            { path: "flash-sales/:campaignId", element: <RequireRole allowedPermissions={["MANAGE_FLASH_SALE"]}><FlashSaleEditorPage /></RequireRole> },
            { path: "orders", element: <RequireRole allowedPermissions={["READ_ORDER"]}><OrderPage /></RequireRole> },
            { path: "orders/:id", element: <RequireRole allowedPermissions={["READ_ORDER"]}><OrderDetailsPage /></RequireRole> },
        ],
    },
]);

export default router;
