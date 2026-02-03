import { RouterProvider } from "react-router-dom";
import router from "./routers";
import { AccountLockedModal } from "../features/auth/components/AccountLockedModal";

const App = () => {
  return (
    <>
      <RouterProvider router={router} />
      <AccountLockedModal />
    </>
  );
};

export default App;
