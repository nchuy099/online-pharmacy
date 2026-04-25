import { Hero } from '../components/Hero';
import { ServiceCommitments } from '../components/ServiceCommitments';
import { FlashSaleSection } from '../components/FlashSaleSection';
import { FeaturedProductsSection } from '../components/FeaturedProducts';
import { PersonalizedProductsSection } from '../components/PersonalizedProductsSection';
import { Categories } from '../components/Categories';

export const HomePage = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* ========== HERO SECTION ========== */}
            <Hero />

            {/* ========== FLASH SALE ========== */}
            <FlashSaleSection />

            {/* ========== FEATURED PRODUCTS ========== */}
            <FeaturedProductsSection />

            {/* ========== PERSONALIZED PRODUCTS ========== */}
            <PersonalizedProductsSection />

            {/* ========== CATEGORIES ========== */}
            <Categories />

            {/* ========== SERVICE COMMITMENTS ========== */}
            <ServiceCommitments />
        </div>
    );
};
