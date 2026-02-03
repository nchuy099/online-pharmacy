import { useState, useEffect } from "react";
import type { User } from "../types/domain";
import { userService } from "../services/user.service";

export const useUser = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUser = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await userService.getCurrentUserProfile();
            setUser(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    return { user, loading, error, refreshUser: fetchUser };
};
