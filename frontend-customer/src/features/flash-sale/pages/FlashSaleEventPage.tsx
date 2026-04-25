import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa6";
import { flashSaleApi } from "@/features/flash-sale/api/flashSale.api";
import type { FlashSaleCampaignDTO } from "@/features/flash-sale/types";
import { FlashSaleProductCard } from "@/features/flash-sale/components/FlashSaleProductCard";
import { getCampaignMetaLabel, getCampaignStatusLabel } from "@/features/flash-sale/utils";

const FlashSaleEventPage = () => {
    const { campaignCode } = useParams();
    const [campaign, setCampaign] = useState<FlashSaleCampaignDTO | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            if (!campaignCode) return;
            setLoading(true);
            try {
                const data = await flashSaleApi.getBigEvent(campaignCode);
                if (mounted) setCampaign(data);
            } catch {
                if (mounted) setCampaign(null);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        void load();
        return () => {
            mounted = false;
        };
    }, [campaignCode]);

    if (loading) {
        return <div className="min-h-screen bg-[#F1F5F9] px-6 py-16 text-sm text-slate-500">Đang tải campaign...</div>;
    }

    if (!campaign) {
        return <div className="min-h-screen bg-[#F1F5F9] px-6 py-16 text-sm text-slate-500">Không tìm thấy campaign big event.</div>;
    }

    const state = getCampaignStatusLabel(campaign);

    return (
        <div className="min-h-screen bg-[#F1F5F9]">
            <section className="relative overflow-hidden bg-emerald-700">
                {campaign.coverImage && <img src={campaign.coverImage} alt={campaign.name} className="absolute inset-0 h-full w-full object-cover" />}
                <div className="relative mx-auto max-w-7xl px-6 py-12 md:py-14">
                    <Link to="/flash-sales" className="inline-flex items-center gap-2 text-sm font-bold text-white/90">
                        <FaArrowLeft className="text-xs" /> Về trang flash sale
                    </Link>
                    <div className="mt-6 max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-amber-200">
                            Big Event Flash Sale
                        </div>
                        <h1 className="mt-5 text-4xl font-black leading-tight text-white md:text-5xl">{campaign.name}</h1>
                        <p className="mt-4 text-sm leading-7 text-slate-200 md:text-base">{campaign.description || "Big event flash sale đang mở bán theo khung giờ."}</p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <span className={`rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.16em] ${state.tone}`}>{state.label}</span>
                            <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/85">{getCampaignMetaLabel(campaign)}</span>
                            <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/85">{campaign.items.length} sản phẩm</span>
                        </div>
                    </div>
                </div>
            </section>

            <main className="mx-auto max-w-7xl px-6 py-10">
                <div className="mb-6">
                    <h2 className="text-2xl font-black text-slate-900">Sản phẩm trong campaign</h2>
                    <p className="mt-1 text-sm text-slate-500">{campaign.items.length} sản phẩm flash sale thuộc big event này.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                    {campaign.items.map((item) => (
                        <FlashSaleProductCard key={item.id} item={item} />
                    ))}
                </div>
            </main>
        </div>
    );
};

export default FlashSaleEventPage;
