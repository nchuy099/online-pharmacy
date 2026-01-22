import { FaCircleCheck, FaMagnifyingGlass, FaStethoscope } from "react-icons/fa6"
import { Link } from "react-router-dom"
import { useChatContext } from "@/features/chat/context/ChatContext"

export const Hero = () => {
    const { openWidget } = useChatContext();
    return (
        <section className="relative bg-white min-h-[calc(100vh-140px)] flex items-center overflow-hidden">
            {/* Soft decorative background circles */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50/50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 -z-10"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-50/30 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 -z-10"></div>

            <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center gap-16 relative z-10 w-full">
                {/* Left Content */}
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-3xl md:text-5xl font-black text-[#001737] mb-6 leading-[1.2] font-primary">
                        Nhà thuốc thông minh – <br />
                        <span className="text-emerald-600">An tâm từng liều thuốc</span>
                    </h1>
                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-y-3 gap-x-6 mb-10 text-gray-400 font-bold text-[15px]">
                        <span className="flex items-center gap-2">
                            <FaCircleCheck className="text-emerald-500" />
                            <span>Thuốc chính hãng</span>
                        </span>
                        <span className="hidden md:inline text-gray-100">|</span>
                        <span className="flex items-center gap-2">
                            <FaCircleCheck className="text-emerald-500" />
                            <span>Dược sĩ tư vấn</span>
                        </span>
                        <span className="hidden md:inline text-gray-100">|</span>
                        <span className="flex items-center gap-2">
                            <FaCircleCheck className="text-emerald-500" />
                            <span>Giao nhanh trong ngày</span>
                        </span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <Link to="/products" className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/20 text-base">
                            <FaMagnifyingGlass className="text-sm" /> Tìm thuốc ngay
                        </Link>
                        <button
                            onClick={openWidget}
                            className="w-full sm:w-auto px-8 py-4 border-2 border-emerald-100/50 text-emerald-700 hover:bg-emerald-50/50 font-black rounded-2xl transition-all flex items-center justify-center gap-3 text-base bg-emerald-50/20"
                        >
                            <FaStethoscope className="text-sm" /> Tư vấn dược sĩ
                        </button>
                    </div>
                </div>

                {/* Right Illustration */}
                <div className="flex-1 flex items-center justify-center relative scale-90 md:scale-100 transition-all">
                    <div className="relative w-full aspect-square max-w-[420px]">
                        {/* Main shape */}
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/60 to-emerald-50/30 rounded-[40px] md:rounded-[70px] flex items-center justify-center overflow-hidden rotate-6 shadow-emerald-500/5 shadow-inner">
                            <FaStethoscope className="text-emerald-600/10 text-[180px] -rotate-12 translate-x-12 translate-y-12" />
                        </div>
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-[40px] md:rounded-[70px] border border-white/50 shadow-2xl flex items-center justify-center -rotate-3 transition-transform hover:rotate-0 duration-700 shadow-emerald-500/10">
                            <div className="w-28 h-28 md:w-44 md:h-44 bg-emerald-500/10 rounded-full flex items-center justify-center relative">
                                <FaStethoscope className="text-emerald-600 text-5xl md:text-7xl" />
                                <div className="absolute -top-3 -right-3 w-10 h-10 md:w-14 md:h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center text-emerald-500 text-lg font-bold animate-bounce" style={{ animationDuration: '3s' }}>
                                    +
                                </div>
                            </div>
                        </div>

                        {/* Decorative items */}
                        <div className="absolute -top-6 -left-6 w-20 h-20 bg-white/60 rounded-full blur-xl animate-pulse"></div>
                        <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-emerald-200/20 rounded-full blur-2xl"></div>
                    </div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-20 animate-bounce">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#001737]">Khám phá</span>
                <div className="w-[1px] h-8 bg-[#001737]"></div>
            </div>
        </section>
    )
}
