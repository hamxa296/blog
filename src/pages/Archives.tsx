import React from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import HandwritingText from "@/components/ui/HandwritingText";
import StackingCards, { StackingCardItem } from "@/components/ui/StackingCards";
import { MobileFooter } from "@/components/nav/MobileFooter";
import { Footer } from "@/components/nav/Footer";
import { useIsMobile } from "@/hooks/useMediaQuery";
import galleryBg from "@/assets/homepc.webp";


import img11 from "@/assets/14.webp";
import img13 from "@/assets/11.webp";

type ArchiveEntry = {
  id: string;
  title: string;
  era: string;
  description: string;
  href: string;
  image: string;
  accent: string;
};

const ARCHIVES: ArchiveEntry[] = [
  {
    id: "founding-act",
    title: "The 1994 GIK Act",
    era: "Foundation",
    description:
      "The legislative charter that incorporated Ghulam Ishaq Khan Institute at Topi — the legal bedrock of everything that followed.",
    href: "https://kpcode.kp.gov.pk/uploads/1994_03_THE_GHULAM_ISHAQ_KHAN_GIK_INSTITUTE_OF_ENGINEERING_SCIENCES_AND_TECHNOLOGY_ACT_1994.pdf",
    image: img11,
    accent: "from-amber-500/25 via-transparent to-transparent",
  },
  {
    id: "The Yearbook",
    title: "Batch 32 yearbook",
    era: "document",
    description:
      "A timeless collection capturing the memories, milestones, and unforgettable moments of Batch 32.",
    href: "https://drive.google.com/drive/folders/1Ea0a8vxuTjdbj99ZW_D34oktOUbhW6dc?fbclid=PAdGRzdgUDsURwZG9mAmV4dG4DYWVtAzEwMABzcnRjBmFwcF9pZA81NjcwNjczNDMzNTI0MjcAAaeAZQMjKtLIdtMM06QufmNsXj-Fz_VFvLT7wAjXVFOI3OLIQq-GuuKxH-fiyA_aem_gGdS48oMaZnBJptWQ1fMNw",
    image: img13,
    accent: "from-orange-500/25 via-transparent to-transparent",
  },
];

export const Archives: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <main className="relative z-10 min-h-screen">
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${galleryBg})`,
        }}
      />

      <div className="max-w-6xl mx-auto px-4 pt-10 sm:pt-14 pb-6">
        <div className="flex flex-col items-center text-center gap-4 mb-4 sm:mb-8">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-muted-foreground font-medium">
            GIKI · Not to be forgotten
          </p>
          <div className="w-full flex justify-center overflow-x-auto text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            <HandwritingText
              words={["Archives.", "Records.", "Chronicles.", "Lores."]}
              className="text-[#ff2273]"
              height="1.15em"
            />
          </div>
          <p className="max-w-xl text-sm sm:text-base text-muted-foreground font-light leading-relaxed">
            A gold mine of GIKI history, charters and rare finds 
            stacked so the good stuff stays findable.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-8">
        <StackingCards
          totalCards={ARCHIVES.length}
          className="relative w-full"
          style={{ height: `${ARCHIVES.length * 70}vh` }}
        >
          {ARCHIVES.map((entry, index) => (
            <StackingCardItem
              key={entry.id}
              index={index}
              className="h-[70vh] flex items-start justify-center pt-[8vh]"
            >
              <article
                className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={entry.image}
                    alt={entry.title}
                    className="h-full w-full object-cover"
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${entry.accent}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                  <span className="absolute top-4 left-4 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[10px] uppercase tracking-widest text-white/90 backdrop-blur-sm">
                    {entry.era}
                  </span>
                </div>

                <div className="relative px-5 sm:px-6 pb-5 sm:pb-6 pt-1 space-y-3">
                  <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                    {entry.title}
                  </h2>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    {entry.description}
                  </p>
                  <a
                    href={entry.href}
                    target={entry.href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      entry.href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-primary px-5 py-2.5 text-xs uppercase tracking-widest font-medium text-primary-foreground transition hover:opacity-90"
                  >
                    Open archive
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </article>
            </StackingCardItem>
          ))}
        </StackingCards>
      </div>

      {!isMobile && (
        <div className="relative z-20">
          <Footer />
        </div>
      )}

      {isMobile && <MobileFooter />}
    </main>
  );
};

export default Archives;
