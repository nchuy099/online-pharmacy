import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import ProductsPage from './ProductsPage';
import ProductDetailsPage from './ProductDetailsPage';
import { NotFoundPage } from '@/features/shared/pages/NotFoundPage';
import { useCategories } from '../hooks/useCategories';
import type { Category } from '../types/domain';

const SlugDispatchPage: React.FC = () => {
    const { "*": rawSlug } = useParams<{ "*": string }>();
    const { data: categories, isLoading } = useCategories();

    const isCategory = useMemo(() => {
        if (!rawSlug || !categories) return false;
        
        // The root products path or search results
        if (rawSlug === 'products') return true;

        // Flatten all category slugs to check against rawSlug
        const allCategorySlugs = new Set<string>();
        const flatten = (cats: Category[]) => {
            cats.forEach(c => {
                allCategorySlugs.add(c.slug);
                if (c.children) flatten(c.children);
            });
        };
        flatten(categories);

        return allCategorySlugs.has(rawSlug);
    }, [categories, rawSlug]);

    if (!rawSlug) {
        return <NotFoundPage />;
    }

    // While categories are loading, show a neutral loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f0f3f8] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // If the slug matches a known category, render the category's product list
    if (isCategory) {
        return <ProductsPage />;
    }

    // Otherwise, assume it's a product slug and attempt to show details
    return <ProductDetailsPage />;
};

export default SlugDispatchPage;
