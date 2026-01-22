import { useEffect, useState } from "react";
import { productService } from "../services/product.service";
import type { Product } from "../types/domain";

const SUGGESTION_MIN_LENGTH = 2;
const SUGGESTION_LIMIT = 6;

export const useProductSearchSuggestions = (query: string) => {
    const [suggestions, setSuggestions] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const normalized = query.trim();

        if (normalized.length < SUGGESTION_MIN_LENGTH) {
            setSuggestions([]);
            setLoading(false);
            setIsOpen(false);
            return;
        }

        let active = true;
        setLoading(true);

        const timer = window.setTimeout(async () => {
            try {
                const response = await productService.getProducts(
                    1,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    normalized,
                    SUGGESTION_LIMIT
                );

                if (!active) return;

                setSuggestions(response.products.slice(0, SUGGESTION_LIMIT));
                setIsOpen(true);
            } catch {
                if (!active) return;
                setSuggestions([]);
                setIsOpen(false);
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }, 250);

        return () => {
            active = false;
            window.clearTimeout(timer);
        };
    }, [query]);

    return {
        suggestions,
        loading,
        isOpen,
        setIsOpen,
        setSuggestions,
    };
};
