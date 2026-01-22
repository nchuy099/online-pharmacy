import React from "react";
import {
    FaFlask,
    FaListUl,
    FaCapsules,
    FaExclamationTriangle,
    FaRegSnowflake,
    FaNotesMedical,
    FaInfoCircle,
} from "react-icons/fa";

interface Ingredient {
    name: string;
    shortDescription?: string;
}

interface Props {
    description?: string | null;
    ingredients?: Ingredient[];
    usage?: string | null;
    dosage?: string | null;
    adverseEffect?: string | null;
    careful?: string | null;
    preservation?: string | null;
}

const hasContent = (value?: string | null): boolean => {
    if (!value) return false;
    const plain = value.replace(/<[^>]*>/g, "").trim();
    return plain.length > 0;
};

type Tone = "default" | "red" | "amber" | "sky";

type TabItem = {
    id: string;
    title: string;
    icon: React.ReactNode;
    tone?: Tone;
    renderContent: () => React.ReactNode;
};

export const ProductDetailedInfo: React.FC<Props> = ({
    description,
    ingredients,
    usage,
    dosage,
    adverseEffect,
    careful,
    preservation,
}) => {
    const tabs = React.useMemo<TabItem[]>(() => {
        const items: TabItem[] = [];

        if (hasContent(description)) {
            items.push({
                id: "description",
                title: "Mô tả sản phẩm",
                icon: <FaInfoCircle className="text-emerald-600" />,
                renderContent: () => (
                    <InfoSection
                        icon={<FaInfoCircle className="text-emerald-600" />}
                        title="Mô tả sản phẩm"
                        content={description}
                    />
                ),
            });
        }

        if (ingredients && ingredients.length > 0) {
            items.push({
                id: "ingredients",
                title: "Thành phần",
                icon: <FaFlask className="text-emerald-600" />,
                renderContent: () => (
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold flex items-center gap-3 text-gray-900">
                            <FaFlask className="text-emerald-600" /> Thành phần
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {ingredients.map((ing, idx) => (
                                <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="font-bold text-gray-900 text-sm">{ing.name}</p>
                                    {ing.shortDescription && (
                                        <p className="text-xs text-gray-500 mt-1">{ing.shortDescription}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ),
            });
        }

        if (hasContent(usage)) {
            items.push({
                id: "usage",
                title: "Công dụng",
                icon: <FaListUl className="text-emerald-600" />,
                renderContent: () => (
                    <InfoSection
                        icon={<FaListUl className="text-emerald-600" />}
                        title="Công dụng"
                        content={usage}
                    />
                ),
            });
        }

        if (hasContent(dosage)) {
            items.push({
                id: "dosage",
                title: "Liều dùng",
                icon: <FaCapsules className="text-emerald-600" />,
                renderContent: () => (
                    <InfoSection
                        icon={<FaCapsules className="text-emerald-600" />}
                        title="Liều dùng"
                        content={dosage}
                    />
                ),
            });
        }

        if (hasContent(adverseEffect)) {
            items.push({
                id: "adverseEffect",
                title: "Tác dụng phụ",
                icon: <FaNotesMedical className="text-amber-600" />,
                tone: "amber",
                renderContent: () => (
                    <InfoSection
                        icon={<FaNotesMedical className="text-amber-600" />}
                        title="Tác dụng phụ"
                        content={adverseEffect}
                        tone="amber"
                    />
                ),
            });
        }

        if (hasContent(careful)) {
            items.push({
                id: "careful",
                title: "Lưu ý",
                icon: <FaExclamationTriangle className="text-red-500" />,
                tone: "red",
                renderContent: () => (
                    <InfoSection
                        icon={<FaExclamationTriangle className="text-red-500" />}
                        title="Lưu ý"
                        content={careful}
                        tone="red"
                    />
                ),
            });
        }

        if (hasContent(preservation)) {
            items.push({
                id: "preservation",
                title: "Bảo quản",
                icon: <FaRegSnowflake className="text-sky-600" />,
                tone: "sky",
                renderContent: () => (
                    <InfoSection
                        icon={<FaRegSnowflake className="text-sky-600" />}
                        title="Bảo quản"
                        content={preservation}
                        tone="sky"
                    />
                ),
            });
        }

        return items;
    }, [description, ingredients, usage, dosage, adverseEffect, careful, preservation]);

    const [activeTabId, setActiveTabId] = React.useState<string>(tabs[0]?.id ?? "");

    React.useEffect(() => {
        if (!tabs.length) {
            setActiveTabId("");
            return;
        }

        setActiveTabId((prev) => (tabs.some((tab) => tab.id === prev) ? prev : tabs[0].id));
    }, [tabs]);

    const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];

    if (!tabs.length) {
        return null;
    }

    return (
        <section className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] min-w-0">
                <aside className="bg-gray-50/70 border-b border-gray-200 lg:border-b-0 lg:border-r lg:border-gray-200">
                    <div className="flex lg:flex-col gap-1 p-2 overflow-x-auto lg:overflow-visible">
                        {tabs.map((tab) => {
                            const isActive = tab.id === activeTabId;
                            const activeToneClass =
                                tab.tone === "red"
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : tab.tone === "amber"
                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                        : tab.tone === "sky"
                                            ? "bg-sky-50 text-sky-700 border-sky-200"
                                            : "bg-white text-emerald-700 border-emerald-200";

                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTabId(tab.id)}
                                    className={`group flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-base font-semibold transition-all whitespace-nowrap lg:whitespace-normal lg:text-left ${
                                        isActive
                                            ? `${activeToneClass} shadow-sm`
                                            : "border-transparent text-gray-600 hover:bg-white hover:text-gray-900"
                                    }`}
                                >
                                    <span className="text-lg">{tab.icon}</span>
                                    <span>{tab.title}</span>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                <div className="p-5 sm:p-6 lg:p-8 min-w-0">{activeTab?.renderContent()}</div>
            </div>
        </section>
    );
};

const InfoSection = ({
    icon,
    title,
    content,
    tone = "default",
}: {
    icon: React.ReactNode;
    title: string;
    content: string | null | undefined;
    tone?: Tone;
}) => {
    const titleClass =
        tone === "red"
            ? "text-red-700"
            : tone === "amber"
                ? "text-amber-700"
                : tone === "sky"
                    ? "text-sky-700"
                    : "text-gray-900";

    return (
        <div className="min-w-0">
            <h3 className={`text-2xl font-bold mb-5 flex items-center gap-3 ${titleClass}`}>
                {icon} {title}
            </h3>
            <div
                className="prose max-w-none break-words overflow-hidden text-sm sm:text-base leading-relaxed text-gray-700 [&_p]:whitespace-pre-wrap [&_img]:max-w-full"
                dangerouslySetInnerHTML={{ __html: content || "<p>Dữ liệu đang được cập nhật...</p>" }}
            />
        </div>
    );
};
