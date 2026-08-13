import IntroAnimation from '../components/hero/IntroAnimation';
import MobileHome from '../components/hero/MobileHome';
import { useIsMobile } from '../hooks/useMediaQuery';
import { FeatureSection } from '../components/feature/FeatureSection';
import { FeaturedPosts } from '../components/blog/FeaturedPosts';

import backgroundImage from '../assets/homepc.webp';

export const Home = () => {
  const isMobile = useIsMobile();

  return (
    <main
      className="relative z-10 w-full min-h-screen bg-cover bg-center bg-fixed text-white"
      style={{
        backgroundImage: `url(${backgroundImage})`,
      }}
    >
      

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
      </div>
    </main>
  );
};
