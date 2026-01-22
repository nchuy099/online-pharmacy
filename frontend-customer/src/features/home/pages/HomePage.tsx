import { Hero } from '../components/Hero';
import { ServiceCommitments } from '../components/ServiceCommitments';
import { FeaturedProductsSection } from '../components/FeaturedProducts';
import { PersonalizedProductsSection } from '../components/PersonalizedProductsSection';
import { Categories } from '../components/Categories';

export const HomePage = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* ========== HERO SECTION ========== */}
            <Hero />

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
