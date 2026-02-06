import React from 'react';
import { DataTable, Column, Action } from '../../../shared/components/ui';
import { Product } from '../types/domain';
import { Category } from '../../category/types/domain';

interface Props {
    products: Product[];
    categories?: Category[];
    onView: (product: Product) => void;
    isLoading?: boolean;
}

const ProductTable = React.memo(({ products, onView, categories = [], isLoading = false }: Props) => {

    const getCategoryPath = (catId: string) => {
        const path: string[] = [];
        let currentId: string | undefined = catId;

        while (currentId) {
            const currentObj: Category | undefined = categories.find(c => c.id === currentId);
            if (!currentObj) break;
            if (currentObj.name) path.unshift(currentObj.name);
            currentId = currentObj.parentId || undefined;
        }
        return path;
    };

    const columns: Column<Product>[] = [
        {
            key: 'name',
            header: 'Tên sản phẩm',
            width: '240px',
            render: (_value, product) => (
                <div className="flex flex-col gap-0.5 w-[240px]">
                    <span
                        className="font-medium text-gray-900 leading-tight truncate"
                        title={product.webName || product.name}
                    >
                        {product.webName || product.name}
                    </span>
                    <div className="flex items-center gap-2 group">
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 italic transition-colors group-hover:text-slate-600 group-hover:bg-white truncate max-w-[120px]" title={product.code}>
                            {product.code}
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(product.code);
                            }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-emerald-600 transition-colors opacity-0 group-hover:opacity-100"
                            title="Copy mã sản phẩm"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </button>
                    </div>
                </div>
            )
        },
        {
            key: 'isActive',
            header: 'Trạng thái',
            render: (isActive) => (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isActive ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                    {isActive ? 'Hoạt động' : 'Tạm ẩn'}
                </span>
            )
        },
        {
            key: 'variants',
            header: 'Biến thể',
            render: (_val, product) => {
                const variants = product.variants || [];
                if (variants.length === 0) return <span>-</span>;
                return (
                    <div className="flex flex-wrap gap-1.5">
                        {variants.map((v, i) => (
                            <span
                                key={i}
                                className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200"
                            >
                                {v.unitType || '-'}
                            </span>
                        ))}
                    </div>
                );
            }
        },
        { key: 'quantityAvailable', header: 'Tồn kho' },
        {
            key: 'categories', header: 'Danh mục', render: (prodCategories) => (
                <div className="flex flex-wrap gap-1.5 min-w-[120px]">
                    {Array.isArray(prodCategories) && prodCategories.flatMap((c) => {
                        const path = getCategoryPath(c.id);
                        const resolvedPath = path.length > 0 ? path : [c.name || c.slug];
                        return resolvedPath.map((name, levelIdx) => ({ name, levelIdx }));
                    }).map((item, idx) => {
                        const getLevelStyle = (levelIdx: number) => {
                            switch (levelIdx) {
                                case 0: return 'text-indigo-700 bg-indigo-50 border-indigo-200';
                                case 1: return 'text-sky-700 bg-sky-50 border-sky-200';
                                case 2: return 'text-emerald-700 bg-emerald-50 border-emerald-200 font-bold shadow-sm';
                                default: return 'text-slate-600 bg-slate-50 border-slate-200';
                            }
                        };
                        return (
                        <span
                            key={`${item.name}-${idx}`}
                            className={`text-[10px] px-2 py-0.5 rounded-md border whitespace-nowrap ${getLevelStyle(item.levelIdx)}`}
                        >
                            {item.name}
                        </span>
                    )})}
                </div>
            )
        },
    ];

    const actions: Action<Product>[] = [
        { label: 'Chi tiết', onClick: (p) => onView(p), className: 'px-3 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100' },
    ];

    return (
        <DataTable<Product>
            data={products}
            columns={columns}
            actions={actions}
            emptyMessage="Chưa có sản phẩm nào."
            isLoading={isLoading}
        />

    );
});

export default ProductTable;
