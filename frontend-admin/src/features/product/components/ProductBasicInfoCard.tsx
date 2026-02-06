import React, { useEffect, useMemo, useState } from 'react';
import RichTextEditor from '../../../shared/components/ui/RichTextEditor';
import { notificationBus } from '../../notification';
import productService from '../services';
import { ProductDetail } from '../types/domain';
import { ProductIngredientDto, UpdateProductRequestDto } from '../types/dto';

type DetailSection = 'basic' | 'images' | 'content' | 'ingredients';

interface ProductBasicInfoCardProps {
    product: ProductDetail;
    onSaveSection?: (section: DetailSection, payload: Partial<UpdateProductRequestDto>) => Promise<void>;
    onOpenCategoryEditor?: () => void;
}

const ProductBasicInfoCard: React.FC<ProductBasicInfoCardProps> = ({
    product,
    onSaveSection,
    onOpenCategoryEditor,
}) => {
    const [editingSection, setEditingSection] = useState<DetailSection | null>(null);
    const [isSavingSection, setIsSavingSection] = useState(false);
    const [activeTab, setActiveTab] = useState<'description' | 'careful' | 'adverseEffect' | 'preservation' | 'usage' | 'dosage'>('description');
    const [uploadingPrimary, setUploadingPrimary] = useState(false);
    const [uploadingSecondary, setUploadingSecondary] = useState(false);

    const [basicDraft, setBasicDraft] = useState({
        name: product.name || '',
        webName: product.webName || '',
        brand: product.brand || '',
        brandOrigin: product.brandOrigin || '',
        producer: product.producer || '',
    });
    const [imagesDraft, setImagesDraft] = useState({
        primaryImage: product.primaryImage || '',
        secondaryImages: (product.secondaryImages || []).map((img: any) => img?.url || img),
    });
    const [imageOrder, setImageOrder] = useState<string[]>([
        ...(product.primaryImage ? [product.primaryImage] : []),
        ...(product.secondaryImages || []).map((img: any) => img?.url || img),
    ]);
    const [contentDraft, setContentDraft] = useState({
        description: product.description || '',
        careful: product.careful || '',
        adverseEffect: product.adverseEffect || '',
        preservation: product.preservation || '',
        usage: product.usage || '',
        dosage: product.dosage || '',
    });
    const [ingredientDraft, setIngredientDraft] = useState<ProductIngredientDto[]>(
        (product.ingredient || []).map((item) => ({
            id: item.id,
            ingredientId: item.ingredientId,
            name: item.name || '',
            shortDescription: item.shortDescription || '',
        })),
    );

    const syncDraftFromProduct = () => {
        const order = [
            ...(product.primaryImage ? [product.primaryImage] : []),
            ...(product.secondaryImages || []).map((img: any) => img?.url || img),
        ];
        setBasicDraft({
            name: product.name || '',
            webName: product.webName || '',
            brand: product.brand || '',
            brandOrigin: product.brandOrigin || '',
            producer: product.producer || '',
        });
        setImagesDraft({
            primaryImage: product.primaryImage || '',
            secondaryImages: (product.secondaryImages || []).map((img: any) => img?.url || img),
        });
        setImageOrder(order);
        setContentDraft({
            description: product.description || '',
            careful: product.careful || '',
            adverseEffect: product.adverseEffect || '',
            preservation: product.preservation || '',
            usage: product.usage || '',
            dosage: product.dosage || '',
        });
        setIngredientDraft(
            (product.ingredient || []).map((item) => ({
                id: item.id,
                ingredientId: item.ingredientId,
                name: item.name || '',
                shortDescription: item.shortDescription || '',
            })),
        );
    };

    const openEdit = (section: DetailSection) => {
        syncDraftFromProduct();
        setEditingSection(section);
    };

    useEffect(() => {
        if (!editingSection) {
            syncDraftFromProduct();
        }
    }, [product, editingSection]);

    const cancelEdit = () => {
        syncDraftFromProduct();
        setEditingSection(null);
    };

    const saveSection = async (section: DetailSection, payload: Partial<UpdateProductRequestDto>) => {
        if (!onSaveSection) return;
        setIsSavingSection(true);
        try {
            await onSaveSection(section, payload);
            setEditingSection(null);
        } finally {
            setIsSavingSection(false);
        }
    };

    const uploadPrimaryImage = async (file: File | null) => {
        if (!file) return;
        setUploadingPrimary(true);
        try {
            const url = await productService.uploadProductImage(file);
            setImageOrder((prev) => (prev.includes(url) ? prev : [...prev, url]));
            setImagesDraft((prev) => {
                const nextPrimary = prev.primaryImage || url;
                const merged = Array.from(new Set([...(imageOrder || []), ...(prev.primaryImage ? [prev.primaryImage] : []), ...prev.secondaryImages, url]));
                return {
                    primaryImage: nextPrimary,
                    secondaryImages: merged.filter((item) => item !== nextPrimary),
                };
            });
            notificationBus.success('Tải ảnh thành công');
        } catch (error: any) {
            notificationBus.error(error?.message || 'Tải ảnh thất bại');
        } finally {
            setUploadingPrimary(false);
        }
    };

    const uploadSecondaryImages = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploadingSecondary(true);
        try {
            const urls: string[] = [];
            for (const file of Array.from(files)) {
                const url = await productService.uploadProductImage(file);
                urls.push(url);
            }
            setImageOrder((prev) => {
                const next = [...prev];
                for (const item of urls) {
                    if (!next.includes(item)) next.push(item);
                }
                return next;
            });
            setImagesDraft((prev) => {
                const merged = Array.from(new Set([...(imageOrder || []), ...(prev.primaryImage ? [prev.primaryImage] : []), ...prev.secondaryImages, ...urls]));
                const nextPrimary = prev.primaryImage || merged[0] || '';
                return {
                    primaryImage: nextPrimary,
                    secondaryImages: merged.filter((item) => item !== nextPrimary),
                };
            });
            notificationBus.success('Tải ảnh thành công');
        } catch (error: any) {
            notificationBus.error(error?.message || 'Tải ảnh thất bại');
        } finally {
            setUploadingSecondary(false);
        }
    };

    const setPrimaryFromList = (imageUrl: string) => {
        setImagesDraft((prev) => {
            if (!imageUrl) return prev;
            const nextOrder = imageOrder.includes(imageUrl) ? imageOrder : [...imageOrder, imageUrl];
            return {
                primaryImage: imageUrl,
                secondaryImages: nextOrder.filter((item) => item !== imageUrl),
            };
        });
    };

    const removeImageFromList = (imageUrl: string) => {
        const nextOrder = imageOrder.filter((item) => item !== imageUrl);
        setImageOrder(nextOrder);
        setImagesDraft((prev) => {
            if (nextOrder.length === 0) {
                return { primaryImage: '', secondaryImages: [] };
            }
            const nextPrimary = prev.primaryImage === imageUrl ? nextOrder[0] : prev.primaryImage;
            return {
                primaryImage: nextPrimary,
                secondaryImages: nextOrder.filter((item) => item !== nextPrimary),
            };
        });
    };

    const contentLabelMap = useMemo(() => ([
        { key: 'description', label: 'Mô tả sản phẩm' },
        { key: 'careful', label: 'Lưu ý' },
        { key: 'adverseEffect', label: 'Tác dụng phụ' },
        { key: 'preservation', label: 'Bảo quản' },
        { key: 'usage', label: 'Công dụng' },
        { key: 'dosage', label: 'Liều dùng & Cách dùng' },
    ] as const), []);

    return (
        <div className="space-y-4">
            <section className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 transition-all hover:shadow-md">
                <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900">Thông tin cơ bản</h3>
                    </div>
                    {editingSection === 'basic' ? (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                disabled={isSavingSection}
                                onClick={() => void saveSection('basic', basicDraft)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white disabled:opacity-50"
                            >
                                Lưu
                            </button>
                        </div>
                    ) : (
                        <button type="button" onClick={() => openEdit('basic')} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700">Sửa</button>
                    )}
                </div>
                <div className="p-5">

                    {editingSection === 'basic' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600">Tên hệ thống</label>
                                <input value={basicDraft.name} onChange={(e) => setBasicDraft((p) => ({ ...p, name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" placeholder="Nhập tên hệ thống" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600">Tên hiển thị</label>
                                <input value={basicDraft.webName} onChange={(e) => setBasicDraft((p) => ({ ...p, webName: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" placeholder="Nhập tên hiển thị" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600">Thương hiệu</label>
                                <input value={basicDraft.brand} onChange={(e) => setBasicDraft((p) => ({ ...p, brand: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" placeholder="Nhập thương hiệu" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600">Xuất xứ thương hiệu</label>
                                <input value={basicDraft.brandOrigin} onChange={(e) => setBasicDraft((p) => ({ ...p, brandOrigin: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" placeholder="Nhập xuất xứ" />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-xs font-semibold text-gray-600">Nhà sản xuất</label>
                                <input value={basicDraft.producer} onChange={(e) => setBasicDraft((p) => ({ ...p, producer: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" placeholder="Nhập nhà sản xuất" />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
                            <p><span className="text-gray-500">Tên hiển thị:</span> {product.webName || '-'}</p>
                            <p>
                                <span className="text-gray-500">Mã sản phẩm:</span>{' '}
                                <span className="font-mono text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{product.code}</span>
                            </p>
                            <p><span className="text-gray-500">Thương hiệu:</span> {product.brand || '-'}</p>
                            <p><span className="text-gray-500">Nhà sản xuất:</span> {product.producer || '-'}</p>
                            <p>
                                <span className="text-gray-500">Trạng thái:</span>{' '}
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${product.isActive ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                    {product.isActive ? 'Hoạt động' : 'Tạm ẩn'}
                                </span>
                            </p>
                        </div>
                    )}
                </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 transition-all hover:shadow-md">
                <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Danh mục</h3>
                    </div>
                    <button type="button" onClick={onOpenCategoryEditor} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700">Sửa</button>
                </div>
                <div className="p-5">
                    <div className="flex flex-wrap gap-1">
                        {product.categories?.map((cat: any) => (
                            <span key={cat.id} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100/50">
                                {cat.name || cat.slug}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 transition-all hover:shadow-md">
                <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Hình ảnh</h3>
                    </div>
                    {editingSection === 'images' ? (
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={cancelEdit} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700">Hủy</button>
                            <button
                                type="button"
                                disabled={isSavingSection || uploadingPrimary || uploadingSecondary}
                                onClick={() => void saveSection('images', imagesDraft)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white disabled:opacity-50"
                            >
                                Lưu
                            </button>
                        </div>
                    ) : (
                        <button type="button" onClick={() => openEdit('images')} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700">Sửa</button>
                    )}
                </div>
                <div className="p-5">

                    <div className="space-y-4">
                        {editingSection === 'images' && (
                            <div className="flex items-center gap-3">
                                <label className="text-xs text-emerald-700 cursor-pointer font-semibold">
                                    {(uploadingPrimary || uploadingSecondary) ? 'Đang tải ảnh...' : 'Tải ảnh'}
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        multiple
                                        disabled={uploadingPrimary || uploadingSecondary}
                                        onChange={(e) => {
                                            if ((e.target.files?.length || 0) > 1) {
                                                void uploadSecondaryImages(e.target.files);
                                            } else {
                                                void uploadPrimaryImage(e.target.files?.[0] || null);
                                            }
                                            e.currentTarget.value = '';
                                        }}
                                    />
                                </label>
                            </div>
                        )}

                        {(() => {
                            const primaryImage = editingSection === 'images' ? imagesDraft.primaryImage : product.primaryImage;
                            const displayOrder = editingSection === 'images'
                                ? imageOrder
                                : [
                                    ...(product.primaryImage ? [product.primaryImage] : []),
                                    ...(product.secondaryImages || []).map((img: any) => img?.url || img),
                                ];
                            const imageList = displayOrder.map((url: string) => ({ url, isPrimary: url === primaryImage }));

                            if (imageList.length === 0) {
                                return <div className="text-sm text-gray-400">Không có ảnh</div>;
                            }

                            return (
                                <div className="flex flex-wrap gap-3">
                                    {imageList.map((image, idx) => (
                                        <button
                                            key={`${image.url}-${idx}`}
                                            type="button"
                                            className={`w-20 h-20 rounded-lg border overflow-hidden bg-gray-50 relative text-left ${
                                                image.isPrimary ? 'border-emerald-400 ring-1 ring-emerald-300' : 'border-gray-100'
                                            }`}
                                            onClick={() => {
                                                if (editingSection === 'images' && !image.isPrimary) {
                                                    setPrimaryFromList(image.url);
                                                }
                                            }}
                                        >
                                            <img src={image.url} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                                            {image.isPrimary && (
                                                <span className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-600 text-white">Chính</span>
                                            )}
                                            {editingSection === 'images' && (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="absolute top-1 right-1 bg-white text-red-600 text-[10px] px-1.5 py-0.5 rounded"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            removeImageFromList(image.url);
                                                        }}
                                                    >
                                                        Xóa
                                                    </button>
                                                </>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 transition-all hover:shadow-md">
                <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                        {contentLabelMap.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                    activeTab === tab.key
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    {editingSection === 'content' ? (
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={cancelEdit} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700">Hủy</button>
                            <button type="button" disabled={isSavingSection} onClick={() => void saveSection('content', contentDraft)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white disabled:opacity-50">Lưu</button>
                        </div>
                    ) : (
                        <button type="button" onClick={() => openEdit('content')} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700">Sửa</button>
                    )}
                </div>
                <div className="p-5">

                    {editingSection === 'content' ? (
                        <RichTextEditor
                            value={contentDraft[activeTab] || ''}
                            onChange={(val: string) => setContentDraft((prev) => ({ ...prev, [activeTab]: val }))}
                        />
                    ) : (
                        <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white">
                            <div className="p-4">
                                <div
                                    className={`text-sm ${activeTab === 'careful' ? 'text-red-600' : 'text-gray-700'} ${activeTab === 'dosage' ? 'bg-emerald-50/20' : 'bg-gray-50/40'} p-4 rounded-xl prose prose-sm max-w-none`}
                                    dangerouslySetInnerHTML={{
                                        __html: ({
                                            description: product.description,
                                            careful: product.careful,
                                            adverseEffect: product.adverseEffect,
                                            preservation: product.preservation,
                                            usage: product.usage,
                                            dosage: product.dosage,
                                        }[activeTab] || '<p>-</p>') as string,
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 transition-all hover:shadow-md">
                <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Thành phần</h3>
                    </div>
                    {editingSection === 'ingredients' ? (
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setIngredientDraft((prev) => [...prev, { name: '', shortDescription: '' }])} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">Thêm</button>
                            <button type="button" onClick={cancelEdit} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700">Hủy</button>
                            <button
                                type="button"
                                disabled={isSavingSection}
                                onClick={() => void saveSection('ingredients', {
                                    ingredient: ingredientDraft.map((item) => ({
                                        ingredientId: item.ingredientId,
                                        name: String(item.name || '').trim(),
                                        shortDescription: String(item.shortDescription || '').trim(),
                                    })).filter((item) => item.name),
                                })}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white disabled:opacity-50"
                            >
                                Lưu
                            </button>
                        </div>
                    ) : (
                        <button type="button" onClick={() => openEdit('ingredients')} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700">Sửa</button>
                    )}
                </div>
                <div className="p-5">

                    {editingSection === 'ingredients' ? (
                        <div className="space-y-3">
                            {ingredientDraft.map((item, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600">Tên thành phần</label>
                                        <input value={String(item.name || '')} onChange={(e) => setIngredientDraft((prev) => prev.map((current, currentIndex) => currentIndex === index ? { ...current, name: e.target.value } : current))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" placeholder="Ví dụ: Paracetamol" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-600">Hàm lượng</label>
                                        <input value={String(item.shortDescription || '')} onChange={(e) => setIngredientDraft((prev) => prev.map((current, currentIndex) => currentIndex === index ? { ...current, shortDescription: e.target.value } : current))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" placeholder="Ví dụ: 500mg" />
                                    </div>
                                    <div className="flex items-end">
                                        <button type="button" className="px-3 py-2 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-100" onClick={() => setIngredientDraft((prev) => prev.filter((_, currentIndex) => currentIndex !== index))}>Xóa</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {(product.ingredient || []).length === 0 && <p className="text-sm text-gray-500">-</p>}
                            {(product.ingredient || []).map((ing: any, idx: number) => (
                                <div key={idx} className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                                    <span className="font-bold text-gray-700">{ing.name}</span>: <span className="text-gray-500">{ing.shortDescription}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default ProductBasicInfoCard;
