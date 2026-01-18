import { useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import type { LoginRequestDTO, SignUpRequestDTO } from "../types/dto";
import { authService } from "../services/auth.service";

export const useAuth = () => {
    const { loginSuccess } = useAuthContext();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loginUser = async (data: LoginRequestDTO) => {
        try {
            setLoading(true);
            setError(null);
            const res = await authService.login(data);
            await loginSuccess(res.user, res.accessToken, res.refreshToken);
            return true;
        } catch (err) {
            setError((err as Error).message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const signUpUser = async (data: SignUpRequestDTO) => {
        try {
            setLoading(true);
            setError(null);
            await authService.signUp(data);
            return true;
        } catch (err) {
            setError((err as Error).message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { loginUser, signUpUser, loading, error };
};
