import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaFireFlameCurved } from "react-icons/fa6";
import { flashSaleApi } from "@/features/flash-sale/api/flashSale.api";
import type { FlashSaleCampaignDTO } from "@/features/flash-sale/types";
import { FlashSaleCampaignNav } from "@/features/flash-sale/components/FlashSaleCampaignNav";
import { FlashSaleProductCard } from "@/features/flash-sale/components/FlashSaleProductCard";
import { getCampaignMetaLabel, getCampaignStatusLabel, sortCampaignsForCustomer } from "@/features/flash-sale/utils";

export const FlashSalePage: React.FC = () => {
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
    const itemCount = campaigns.reduce((total, campaign) => total + campaign.items.length, 0);

    return (
        <div className="min-h-screen bg-[#F1F5F9]">
            <section className="border-b border-slate-200/80 bg-white">
                <div className="mx-auto max-w-7xl px-6 py-10">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-rose-600">
                                <FaFireFlameCurved className="text-[12px]" /> Flash sale
                            </div>
                            <h1 className="mt-4 text-3xl font-black tracking-tight text-[#001737] md:text-4xl">
                                Campaign flash sale theo khung giờ
                            </h1>
                            <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-slate-500">
                                Theo dõi các đợt flash sale đang diễn ra hoặc sắp mở, ưu tiên big event trước rồi tới các campaign thường theo ngày và khung giờ.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Campaign</p>
                                <p className="mt-2 text-2xl font-black text-slate-900">{campaigns.length}</p>
                            </div>
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-500">Sản phẩm</p>
                                <p className="mt-2 text-2xl font-black text-emerald-700">{itemCount}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <main className="mx-auto max-w-7xl px-6 py-8">
                {loading ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <div key={n} className="h-[320px] rounded-[20px] border border-slate-100 bg-white animate-pulse" />
                        ))}
                    </div>
                ) : campaigns.length === 0 ? (
                    <div className="rounded-[28px] border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
                        <p className="text-lg font-black text-slate-900">Chưa có campaign flash sale</p>
                        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
                            Hệ thống sẽ hiển thị campaign tại đây khi có flash sale được publish.
                        </p>
                        <Link
                            to="/"
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
                        >
                            Về trang chủ <FaArrowRight className="text-xs" />
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <FlashSaleCampaignNav
                            campaigns={campaigns}
                            activeCampaignId={activeCampaign?.id ?? null}
                            onSelect={setActiveCampaignId}
                        />

                        {activeCampaign && (
                            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                                    <div>
                                        {activeCampaign.type === "BIG_EVENT" && (
                                            <h2 className="text-3xl font-black text-slate-900">{activeCampaign.name}</h2>
                                        )}
                                        <p className={`font-bold ${activeCampaign.type === "BIG_EVENT" ? "mt-2 text-sm text-slate-500" : "text-xl text-slate-900"}`}>
                                            {getCampaignMetaLabel(activeCampaign)}
                                        </p>
                                    </div>
                                    <div className={`inline-flex w-fit items-center rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] ${getCampaignStatusLabel(activeCampaign).tone}`}>
                                        {getCampaignStatusLabel(activeCampaign).label}
                                    </div>
                                </div>

                                {activeCampaign.items.length === 0 ? (
                                    <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center text-sm font-medium text-slate-500">
                                        Campaign này hiện chưa có sản phẩm flash sale.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                                        {activeCampaign.items.map((item) => (
                                            <FlashSaleProductCard key={item.id} item={item} />
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default FlashSalePage;
