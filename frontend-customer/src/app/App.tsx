import { RouterProvider } from "react-router-dom"
import { router } from "./router"
import { AuthProvider } from "@/features/auth/context/AuthContext"
import { AccountLockedModal } from "@/features/auth/components/AccountLockedModal"

export const App = () => {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <AccountLockedModal />
    </AuthProvider>
  )
}
