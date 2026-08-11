import IntroAnimation from '../components/hero/IntroAnimation';
import MobileHome from '../components/hero/MobileHome';
import { useIsMobile } from '../hooks/useMediaQuery';
import { FeatureSection } from '../components/feature/FeatureSection';
import { Footer } from '../components/nav/Footer';
import { FeaturedPosts } from '../components/blog/FeaturedPosts';

import backgroundImage from '../assets/homepc.webp';

export const Home = () => {
  const isMobile = useIsMobile();

  return (
    <main className="relative z-10 w-full min-h-screen text-white overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat md:bg-fixed"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      />

      {/* Page content */}
      <div className="relative z-10">
        {/* Hero / Animations */}
        <div className="relative h-[100dvh] w-full">
          {isMobile ? <MobileHome /> : <IntroAnimation />}
        </div>

        {/* Full-Width Feature Sections */}
        <div className="relative z-20">
          <FeatureSection />
        </div>

        {/* Featured Posts */}
        <div className="relative z-20 mt-8">
          <FeaturedPosts />
        </div>

        {/* Footer */}
        {!isMobile && (
          <div className="relative z-20">
            <Footer />
          </div>
        )}
      </div>
    </main>
  );
};