import { resolveApiErrorMessage } from "@/features/shared/api/error";

export const extractApiMessage = (error: unknown, fallback: string): string => {
    return resolveApiErrorMessage(error, fallback);
};
