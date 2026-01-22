import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { useProductSearchSuggestions } from "../hooks/useProductSearchSuggestions";
import type { Product } from "../types/domain";

type Variant = "desktop" | "mobile";

interface Props {
    variant: Variant;
}

const getDisplayName = (product: Product) => product.webName || product.name;

export const ProductSearchBar: React.FC<Props> = ({ variant }) => {
    const navigate = useNavigate();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState("");
    const { suggestions, loading, isOpen, setIsOpen } = useProductSearchSuggestions(query);

    const trimmedQuery = useMemo(() => query.trim(), [query]);

    const handleSearch = () => {
        if (!trimmedQuery) return;
        setIsOpen(false);
        navigate(`/products?q=${encodeURIComponent(trimmedQuery)}`);
    };

    const handleSuggestionClick = (slug: string) => {
        setIsOpen(false);
        navigate(`/${slug}`);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [setIsOpen]);

    useEffect(() => {
        if (trimmedQuery.length < 2) {
            setIsOpen(false);
        }
    }, [setIsOpen, trimmedQuery]);

    const desktopStyles = variant === "desktop"
        ? {
            wrapper: "flex-1 max-w-2xl relative group",
            inner: "relative flex items-center h-12",
            input: "w-full h-full pl-11 pr-32 rounded-[16px] border border-gray-100 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white transition-all text-sm font-medium shadow-sm group-hover:shadow-md",
            icon: "absolute left-4 text-gray-400 transition-colors group-focus-within:text-emerald-500",
            button: "h-full px-5 bg-emerald-600 text-white rounded-[12px] font-bold text-xs hover:bg-emerald-700 transition-all active:scale-95 shadow-sm",
            dropdown: "absolute left-0 right-0 top-full mt-2 bg-white rounded-[24px] border border-gray-100 shadow-2xl overflow-hidden z-[60]",
            item: "px-4 py-3 hover:bg-emerald-50 transition-colors flex items-center gap-3 cursor-pointer",
        }
        : {
            wrapper: "flex-1 relative group",
            inner: "relative flex items-center h-10",
            input: "w-full h-10 pl-4 pr-10 rounded-[16px] border border-gray-100 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium transition-all",
            icon: "absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-gray-400 hover:text-emerald-500 rounded-r-[16px] transition-colors",
            button: "hidden",
            dropdown: "absolute left-0 right-0 top-full mt-2 bg-white rounded-[18px] border border-gray-100 shadow-2xl overflow-hidden z-[60]",
            item: "px-3 py-3 hover:bg-emerald-50 transition-colors flex items-center gap-3 cursor-pointer",
        };

    return (
        <div ref={wrapperRef} className={desktopStyles.wrapper}>
            <div className={desktopStyles.inner}>
                <div className={variant === "desktop" ? desktopStyles.icon : "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-emerald-500"}>
                    <FaMagnifyingGlass className="text-sm" />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleSearch();
                        }
                    }}
                    onFocus={() => {
                        if (trimmedQuery.length >= 2) {
                            setIsOpen(true);
                        }
                    }}
                    placeholder={variant === "desktop" ? "Tìm thuốc, mỹ phẩm, thực phẩm chức năng..." : "Tìm thuốc, mỹ phẩm..."}
                    className={desktopStyles.input}
                />
                {variant === "desktop" ? (
                    <div className="absolute right-1.5 flex items-center h-full py-1.5">
                        <button onClick={handleSearch} className={desktopStyles.button}>
                            Tìm kiếm
                        </button>
                    </div>
                ) : (
                    <button onClick={handleSearch} className={desktopStyles.icon}>
                        <FaMagnifyingGlass className="text-sm" />
                    </button>
                )}
            </div>

            {isOpen && trimmedQuery.length >= 2 && (
                <div className={desktopStyles.dropdown}>
                    {loading ? (
                        <div className="px-4 py-4 text-sm text-gray-500 font-medium">Đang tìm kiếm...</div>
                    ) : suggestions.length > 0 ? (
                        <>
                            <div className="px-4 py-3 border-b border-gray-50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                Gợi ý sản phẩm
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {suggestions.map((product) => (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => handleSuggestionClick(product.slug)}
                                        className={desktopStyles.item}
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                                            {product.primaryImage ? (
                                                <img src={product.primaryImage} alt={getDisplayName(product)} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-emerald-600 font-black text-sm">SP</span>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1 text-left">
                                            <p className="text-sm font-bold text-[#001737] truncate">{getDisplayName(product)}</p>
                                            <p className="text-[11px] text-gray-400 truncate">{product.slug}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="px-4 py-4 text-sm text-gray-500 font-medium">Không tìm thấy gợi ý phù hợp.</div>
                    )}
                </div>
            )}
        </div>
    );
};
