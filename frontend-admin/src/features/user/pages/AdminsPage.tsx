import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminsPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        navigate("/rbac?view=admins", { replace: true });
    }, [navigate]);

    return null;
};

export default AdminsPage;
