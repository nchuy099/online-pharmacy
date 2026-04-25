import { useEffect, useRef, useState } from "react";
import { FaCircleCheck, FaChevronLeft, FaChevronRight, FaMagnifyingGlass, FaStethoscope } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { useChatContext } from "@/features/chat/context/ChatContext";
import { flashSaleApi } from "@/features/flash-sale/api/flashSale.api";
import type { FlashSaleCampaignDTO } from "@/features/flash-sale/types";
import { getCampaignMetaLabel } from "@/features/flash-sale/utils";

export const Hero = () => {
    const { openWidget } = useChatContext();
    const [events, setEvents] = useState<FlashSaleCampaignDTO[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const transitionRef = useRef<number | null>(null);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const data = await flashSaleApi.getBigEvents();
                if (mounted) {
                    setEvents(data);
                }
            } catch {
                if (mounted) {
                    setEvents([]);
                }
            }
        };
        void load();
        return () => {
            mounted = false;
        };
    }, []);

    const slides: Array<{ type: "default" } | { type: "event"; event: FlashSaleCampaignDTO }> = [
        { type: "default" },
        ...events.map((event) => ({ type: "event" as const, event })),
    ];

    const goToSlide = (nextIndex: number) => {
        if (slides.length <= 1 || nextIndex === activeIndex) {
            return;
        }
        if (transitionRef.current !== null) {
            window.clearTimeout(transitionRef.current);
        }
        setIsVisible(false);
        transitionRef.current = window.setTimeout(() => {
            setActiveIndex(nextIndex);
            setIsVisible(true);
            transitionRef.current = null;
        }, 180);
    };

    useEffect(() => {
        if (slides.length <= 1) return;
        const timer = window.setInterval(() => {
            goToSlide((activeIndex + 1) % slides.length);
        }, 5000);
        return () => window.clearInterval(timer);
    }, [activeIndex, slides.length]);

    useEffect(() => {
        if (activeIndex >= slides.length) {
            setActiveIndex(0);
        }
    }, [activeIndex, slides.length]);

    useEffect(() => () => {
        if (transitionRef.current !== null) {
            window.clearTimeout(transitionRef.current);
        }
    }, []);

    const activeSlide = slides[activeIndex] ?? slides[0];

    return (
        <section className="bg-gray-50 px-4 pt-6 md:px-5 md:pt-8">
            <div className="relative mx-auto min-h-[520px] max-w-[1500px] overflow-hidden rounded-[36px] border border-gray-100 bg-white shadow-sm transition-all duration-300 md:min-h-[560px]">
                <div className={`absolute inset-0 transition-all duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}>
                    {activeSlide.type === "default" ? (
                        <>
                            <div className="absolute top-0 right-0 h-[420px] w-[420px] -translate-y-1/2 translate-x-1/2 rounded-full bg-emerald-50/60 blur-[100px]" />
                            <div className="absolute bottom-0 left-0 h-[260px] w-[260px] translate-y-1/2 -translate-x-1/2 rounded-full bg-emerald-50/40 blur-[80px]" />
                        </>
                    ) : (
                        <>
                            <div className="absolute inset-0 bg-slate-900" />
                            {activeSlide.event.coverImage && (
                                <img src={activeSlide.event.coverImage} alt={activeSlide.event.name} className="absolute inset-0 h-full w-full object-cover" />
                            )}
                        </>
                    )}
                </div>

                <div className={`relative z-10 flex min-h-[520px] flex-col justify-center px-8 py-10 transition-all duration-300 md:min-h-[560px] md:px-12 md:py-12 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
                {activeSlide.type === "default" ? (
                    <div className="flex flex-col items-center gap-10 md:flex-row md:gap-12">
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="mb-5 text-3xl font-black leading-[1.15] text-[#001737] md:text-[3.25rem] font-primary">
                                Nhà thuốc thông minh - <br />
                                <span className="text-emerald-600">An tâm từng liều thuốc</span>
                            </h1>
                            <div className="mb-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[15px] font-bold text-gray-400 md:justify-start">
                                <span className="flex items-center gap-2"><FaCircleCheck className="text-emerald-500" /><span>Thuốc chính hãng</span></span>
                                <span className="hidden text-gray-100 md:inline">|</span>
                                <span className="flex items-center gap-2"><FaCircleCheck className="text-emerald-500" /><span>Dược sĩ tư vấn</span></span>
                                <span className="hidden text-gray-100 md:inline">|</span>
                                <span className="flex items-center gap-2"><FaCircleCheck className="text-emerald-500" /><span>Giao nhanh trong ngày</span></span>
                            </div>
                            <div className="flex flex-col items-center gap-4 sm:flex-row">
                                <Link
                                    to="/products"
                                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-8 py-4 text-base font-black text-white shadow-2xl shadow-emerald-500/20 transition-all active:scale-95 hover:bg-emerald-700 sm:w-auto"
                                >
                                    <FaMagnifyingGlass className="text-sm" /> Tìm thuốc ngay
                                </Link>
                                <button
                                    onClick={openWidget}
                                    className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-emerald-100/50 bg-emerald-50/20 px-8 py-4 text-base font-black text-emerald-700 transition-all hover:bg-emerald-50/50 sm:w-auto"
                                >
                                    <FaStethoscope className="text-sm" /> Tư vấn dược sĩ
                                </button>
                            </div>
                        </div>

                        <div className="relative flex flex-1 items-center justify-center scale-90 transition-all md:scale-100">
                            <div className="relative aspect-square w-full max-w-[340px] md:max-w-[380px]">
                                <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[40px] bg-gradient-to-br from-emerald-100/60 to-emerald-50/30 shadow-inner shadow-emerald-500/5 rotate-6 md:rounded-[70px]">
                                    <FaStethoscope className="text-[180px] text-emerald-600/10 -rotate-12 translate-x-12 translate-y-12" />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center rounded-[40px] border border-white/50 bg-white/40 shadow-2xl shadow-emerald-500/10 backdrop-blur-sm -rotate-3 transition-transform duration-700 hover:rotate-0 md:rounded-[70px]">
                                    <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-emerald-500/10 md:h-44 md:w-44">
                                        <FaStethoscope className="text-5xl text-emerald-600 md:text-7xl" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-amber-200">
                            Big Event Flash Sale
                        </div>
                        <h1 className="mt-5 text-4xl font-black leading-tight text-white md:text-5xl">
                            {activeSlide.event.name}
                        </h1>
                        <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-200 md:text-base">
                            {activeSlide.event.description || "Khung giờ săn sale nổi bật với số lượng giới hạn và ưu đãi theo campaign lớn."}
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3 text-xs font-black uppercase tracking-[0.16em] text-white/80">
                            <span className="rounded-full bg-white/10 px-3 py-2">{getCampaignMetaLabel(activeSlide.event)}</span>
                            <span className="rounded-full bg-white/10 px-3 py-2">{activeSlide.event.items.length} sản phẩm</span>
                        </div>
                        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                            <Link
                                to={`/flash-sales/events/${activeSlide.event.code}`}
                                className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-8 py-4 text-base font-black text-emerald-950 shadow-2xl shadow-amber-400/20"
                            >
                                Xem big event
                            </Link>
                        </div>
                    </div>
                )}

                {slides.length > 1 && (
                    <div className="mt-8 flex items-center gap-3">
                        <button
                            onClick={() => goToSlide((activeIndex - 1 + slides.length) % slides.length)}
                            className={`rounded-full p-3 backdrop-blur-sm ${activeSlide.type === "event" ? "bg-white/10 text-white" : "bg-emerald-50 text-emerald-700"}`}
                        >
                            <FaChevronLeft />
                        </button>
                        <button
                            onClick={() => goToSlide((activeIndex + 1) % slides.length)}
                            className={`rounded-full p-3 backdrop-blur-sm ${activeSlide.type === "event" ? "bg-white/10 text-white" : "bg-emerald-50 text-emerald-700"}`}
                        >
                            <FaChevronRight />
                        </button>
                        <div className="ml-2 flex items-center gap-2">
                            {slides.map((slide, index) => (
                                <button
                                    key={slide.type === "default" ? "default" : slide.event.id}
                                    onClick={() => goToSlide(index)}
                                    className={`h-2.5 rounded-full transition-all ${
                                        index === activeIndex
                                            ? `w-8 ${slide.type === "event" ? "bg-amber-300" : "bg-emerald-500"}`
                                            : `${activeSlide.type === "event" ? "bg-white/30" : "bg-emerald-200"} w-2.5`
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                )}
                </div>
            </div>
        </section>
    );
};
