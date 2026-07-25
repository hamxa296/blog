import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';


const impactCards = [
  {
    id: 0,
    metric: '500+',
    title: 'Student stories shared',
    description:
      'From late-night lab sessions to society events — GIKI Chronicles captures the authentic voice of campus life through student-written posts.',
    image: '/about.jpg',
    isFeature: true,
  },
  {
    id: 1,
    metric: '100%',
    title: 'Freshman ready guide',
    description:
      'Comprehensive packing lists, hostel tours, and campus navigation help every new student hit the ground running in the Valley.',
    image: '/fman.jpg',
  },
  {
    id: 2,
    metric: '24/7',
    title: 'Campus photo gallery',
    description:
      'Students submit and share snapshots of academic blocks, hostels, sports, and events — a living visual archive of GIKI life.',
    image: '/camera.jpeg',
  },
  {
    id: 3,
    metric: '∞',
    title: 'Community driven',
    description:
      'Built by students, for students. Every post, photo, and guide section grows with contributions from the GIKI community.',
    image: '/2.png',
  },
];

export default function ImpactSection() {
  const [openCard, setOpenCard] = useState(0);

  const navigateCard = (direction: 'prev' | 'next') => {
    setOpenCard((prev) => {
      if (direction === 'prev') return prev === 0 ? impactCards.length - 1 : prev - 1;
      return prev === impactCards.length - 1 ? 0 : prev + 1;
    });
  };

  return (
    <section className="w-full bg-background py-12 sm:py-16 md:py-20">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-start justify-between gap-6 mb-8 sm:mb-10">
          <div className="max-w-[620px]">
            <p className="text-[10px] tracking-[0.2em] uppercase font-bold text-muted-foreground mb-4">
              About GIKI Chronicles
            </p>
            <h2 className="text-[28px] sm:text-[32px] md:text-[40px] leading-[1.05] font-semibold tracking-tight text-foreground">
              Where campus life comes alive
            </h2>
            <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed max-w-[560px] font-light">
              GIKI Chronicles is a living diary of our struggles, laughs, and milestones — told by students, for
              students. Every story matters, every voice deserves to be heard.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigateCard('prev')}
              className="w-9 h-9 rounded-full border border-border bg-background text-foreground flex items-center justify-center hover:bg-muted transition"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => navigateCard('next')}
              className="w-9 h-9 rounded-full border border-border bg-background text-foreground flex items-center justify-center hover:bg-muted transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-0">
          {impactCards.map((card, idx) => {
            const isOpen = openCard === idx;
            const closedHeights = [280, 330, 390, 430];
            const targetHeight = isOpen ? 460 : closedHeights[idx];

            return (
              <motion.div
                key={card.id}
                onMouseEnter={() => setOpenCard(idx)}
                onFocus={() => setOpenCard(idx)}
                onClick={() => setOpenCard(idx)}
                tabIndex={0}
                animate={{ flex: isOpen ? 4.8 : 1.5 }}
                transition={{ type: 'spring', stiffness: 220, damping: 28 }}
                className="relative overflow-hidden border border-border/50 bg-muted h-[360px] md:h-auto cursor-pointer text-foreground"
              >
                <motion.div
                  animate={{ height: targetHeight }}
                  transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                  className="h-full"
                >
                  {isOpen ? (
                    <div className="h-full p-6 sm:p-8 md:p-10 flex flex-col bg-background">
                      {card.isFeature ? (
                        <div className="max-w-[280px]">
                          <h3 className="text-[28px] sm:text-[32px] md:text-[36px] leading-[1.05] font-semibold tracking-tight mb-4">
                            GIKI
                            <br />
                            <span className="italic font-light text-muted-foreground">Chronicles</span>
                          </h3>
                          <a
                            href="https://www.instagram.com/giki.chronicles"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-medium text-muted-foreground hover:text-foreground transition"
                          >
                            Follow on Instagram <ArrowRight size={14} />
                          </a>
                        </div>
                      ) : (
                        <div className="max-w-[300px]">
                          <p className="text-[10px] tracking-[0.2em] uppercase font-medium text-muted-foreground">
                            Campus impact
                          </p>
                          <h3 className="mt-2 text-[22px] sm:text-[26px] md:text-[30px] leading-[1.08] font-semibold tracking-tight">
                            {card.title}
                          </h3>
                          <p className="mt-3 text-sm leading-relaxed text-muted-foreground font-light">
                            {card.description}
                          </p>
                        </div>
                      )}

                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-[1.05fr_1fr] gap-4 flex-1 items-start">
                        <div className="self-start sm:self-end">
                          <p className="text-[56px] sm:text-[62px] md:text-[72px] font-semibold leading-none tracking-tighter">
                            {card.metric}
                          </p>
                          <p className="mt-2 text-[10px] tracking-[0.2em] uppercase font-medium text-muted-foreground">
                            {card.title}
                          </p>
                        </div>

                        <div
                          className={`relative w-full rounded-sm overflow-hidden border border-border/50 ${
                            card.isFeature
                              ? 'h-[220px] sm:h-[250px] md:h-[270px]'
                              : 'h-[160px] sm:h-[180px] md:h-[200px]'
                          }`}
                        >
                          <img
                            src={card.image}
                            alt={card.title}
                            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full p-5 sm:p-6 md:p-7 flex flex-col justify-between bg-background/80">
                      <div />
                      <div>
                        <p className="text-[28px] sm:text-[32px] md:text-[36px] font-semibold leading-none tracking-tighter">
                          {card.metric}
                        </p>
                        <p className="mt-2 text-[10px] tracking-[0.15em] uppercase font-medium text-muted-foreground max-w-[120px]">
                          {card.title}
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 bg-primary text-primary-foreground rounded-full px-5 sm:px-8 py-4 flex items-center justify-center text-center">
          <p className="text-sm leading-relaxed font-light">
            Ready for the Valley?{' '}
            <Link to="/guide" className="underline underline-offset-4 hover:opacity-80 transition">
              Start with our Freshman Guide
            </Link>{' '}
            and explore everything GIKI has to offer.
          </p>
        </div>
      </div>
    </section>
  );
}
