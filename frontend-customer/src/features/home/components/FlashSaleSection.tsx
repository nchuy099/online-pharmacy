import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaFireFlameCurved } from "react-icons/fa6";
import { flashSaleApi } from "@/features/flash-sale/api/flashSale.api";
import type { FlashSaleCampaignDTO } from "@/features/flash-sale/types";
import { FlashSaleCampaignNav } from "@/features/flash-sale/components/FlashSaleCampaignNav";
import { FlashSaleProductCard } from "@/features/flash-sale/components/FlashSaleProductCard";
import { getCampaignMetaLabel, getCampaignStatusLabel, sortCampaignsForCustomer } from "@/features/flash-sale/utils";

export const FlashSaleSection = () => {
    const [campaigns, setCampaigns] = useState<FlashSaleCampaignDTO[]>([]);
    const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            setLoading(true);
            try {
                const data = sortCampaignsForCustomer(await flashSaleApi.getCampaigns());
                if (mounted) {
                    setCampaigns(data);
                    setActiveCampaignId(data[0]?.id ?? null);
                }
            } catch {
                if (mounted) {
                    setCampaigns([]);
                    setActiveCampaignId(null);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        void load();

        return () => {
            mounted = false;
        };
    }, []);

    const activeCampaign = campaigns.find((campaign) => campaign.id === activeCampaignId) ?? campaigns[0] ?? null;

    if (!loading && campaigns.length === 0) {
        return null;
    }

    return (
        <section className="mx-auto mt-10 mb-12 max-w-7xl rounded-[40px] border border-gray-50 bg-white px-6 py-12 shadow-sm md:mt-14 md:py-16">
            <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div>
                    <h2 className="mb-2 text-2xl font-black uppercase tracking-tight text-[#001737] md:text-3xl">Flash sale</h2>
                    <p className="text-sm font-bold text-gray-400">Chọn campaign để xem sản phẩm theo từng khung giờ flash sale.</p>
                </div>
                <Link
                    to="/flash-sales"
                    className="inline-flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-rose-600 shadow-xl shadow-rose-500/10"
                >
                    <FaFireFlameCurved className="text-[12px]" /> Xem tất cả
                </Link>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-[280px] rounded-[28px] bg-gray-50 animate-pulse" />
                    ))}
                </div>
            ) : (
                <>
                    <FlashSaleCampaignNav
                        campaigns={campaigns}
                        activeCampaignId={activeCampaign?.id ?? null}
                        onSelect={setActiveCampaignId}
                    />

                    {activeCampaign && (
                        <div className="mt-8">
                            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                                <div>
                                    {activeCampaign.type === "BIG_EVENT" && (
                                        <h3 className="text-2xl font-black text-slate-900">{activeCampaign.name}</h3>
                                    )}
                                    <p className={`font-bold text-slate-500 ${activeCampaign.type === "BIG_EVENT" ? "mt-2 text-sm" : "text-lg text-slate-900"}`}>
                                        {getCampaignMetaLabel(activeCampaign)}
                                    </p>
                                </div>
                                <div className={`inline-flex w-fit items-center rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] ${getCampaignStatusLabel(activeCampaign).tone}`}>
                                    {getCampaignStatusLabel(activeCampaign).label}
                                </div>
                            </div>

                            {activeCampaign.items.length === 0 ? (
                                <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm font-medium text-slate-500">
                                    Campaign này hiện chưa có sản phẩm flash sale.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
                                    {activeCampaign.items.slice(0, 8).map((item) => (
                                        <FlashSaleProductCard key={item.id} item={item} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </section>
    );
};
