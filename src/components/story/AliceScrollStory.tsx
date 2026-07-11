import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './alice-scroll.css';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function AliceScrollStory() {
  useEffect(() => {
    const heroReveal = gsap.utils.toArray<HTMLElement>('.hero-reveal');
    heroReveal.forEach((element) => {
      const heroBox = element.querySelector('.hero-reveal__header') as HTMLElement;
      const heroHeadings = element.querySelectorAll('.hero-reveal_split_item');
      const contentEl = element.querySelector('.hero-reveal__content') as HTMLElement;

      if (!heroBox || !contentEl) return;

      const heroBoxHeight = heroBox.offsetHeight;
      const contentHeight = contentEl.offsetHeight;
      const scrollDistance = heroBoxHeight > contentHeight ? heroBoxHeight : contentHeight;

      gsap
        .timeline({
          scrollTrigger: {
            trigger: element,
            start: 'top top',
            end: `+=${scrollDistance}`,
            scrub: true,
          },
        })
        .fromTo(contentEl, { y: '50%' }, { y: '0%', ease: 'none' }, 0.2);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: element,
          start: 'top top',
          end: `+=${scrollDistance}`,
          scrub: true,
          pin: true,
        },
      });

      tl.fromTo(
        heroBox,
        {
          clipPath:
            'polygon(0 0, 100% 0, 100% 50%, 0 50%, 0 50%, 100% 50%, 100% 100%, 0 100%)',
        },
        {
          clipPath:
            'polygon(0 0, 100% 0, 100% 0%, 0 0%, 0 100%, 100% 100%, 100% 100%, 0 100%)',
          duration: 0.4,
          ease: 'power4.inOut',
        }
      );

      if (heroHeadings.length >= 2) {
        tl.fromTo(heroHeadings[0], { y: '0%' }, { y: '-30%', ease: 'power3.inOut' }, 0);
        tl.fromTo(heroHeadings[1], { y: '0%' }, { y: '30%', ease: 'power3.inOut' }, 0);
      }
    });

    function parallaxScrollBySpeed(selector: string, speed = 1, trigger = '.hero-reveal') {
      const el = document.querySelector(selector);
      const contentEl = document.querySelector('.hero-reveal__content');
      const contentHeight = contentEl?.getBoundingClientRect().height || 0;
      if (!el) return;

      gsap.to(el, {
        yPercent: (speed - 1) * 100,
        ease: 'none',
        scrollTrigger: {
          trigger,
          start: 'top top',
          end: `+=${contentHeight * 3}`,
          scrub: true,
        },
      });
    }

    parallaxScrollBySpeed('.hero-reveal__parallax-book', 15);
    parallaxScrollBySpeed('.hero-reveal__parallax-clock', 13);
    parallaxScrollBySpeed('.hero-reveal__parallax-alice', 6);
    parallaxScrollBySpeed('.hero-reveal__parallax-kattle', 23);
    parallaxScrollBySpeed('.hero-reveal__parallax-card', 5);

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <main className="main alice-scroll-story">
      <section className="intro">
        <h1 className="intro__heading">
          Into the
          <br />
          Valley
        </h1>
      </section>

      <section className="content">
        <article className="article">
          <h2>Chapter 1 — Arrival</h2>
          <p>
            Every freshman arrives at GIK with a mix of excitement and nerves. The winding road up to campus,
            the first glimpse of the academic blocks against the mountains — it&apos;s a moment you never forget.
            You&apos;ve heard the stories, seen the photos, but nothing prepares you for the real thing.
          </p>
          <p>
            The Valley has its own rhythm. Morning lectures, afternoon labs, evening society meetings, and
            late-night mess runs become your new normal. Within weeks, strangers become roommates, roommates
            become family, and the campus transforms from an intimidating maze into home.
          </p>
        </article>
      </section>

      <section className="hero-reveal">
        <article>
          <header className="hero-reveal__header">
            <div className="hero-reveal_split">
              <div className="hero-reveal_split_item">
                <p className="c-wide-text -split">THE VALLEY</p>
              </div>
              <div className="hero-reveal_split_item" aria-hidden="true">
                <p className="c-wide-text -split" aria-hidden="true">
                  THE VALLEY
                </p>
              </div>
            </div>
          </header>

          <div className="hero-reveal__content">
            <div className="hero-reveal__content-inner">
              <div className="hero-reveal__parallax">
                <img
                  src="https://assets.codepen.io/204808/alice-falling-1.png"
                  alt="Student journey"
                  className="hero-reveal__parallax-alice"
                />
                <img
                  width={150}
                  src="https://assets.codepen.io/204808/alice-falling-clock.png"
                  alt="Clock"
                  className="hero-reveal__parallax-clock"
                />
                <img
                  width={100}
                  src="https://assets.codepen.io/204808/alice-falling-book.png"
                  alt="Books"
                  className="hero-reveal__parallax-book"
                />
                <img
                  width={50}
                  src="https://assets.codepen.io/204808/alice-falling-kattle.png"
                  alt="Kettle"
                  className="hero-reveal__parallax-kattle"
                />
                <img
                  width={330}
                  src="https://assets.codepen.io/204808/alice-falling-card.png"
                  alt="Card"
                  className="hero-reveal__parallax-card"
                />
              </div>

              <div className="hero-reveal__content-p">
                <p>
                  Down the rabbit hole of engineering — that&apos;s what they call it. The first semester hits
                  different. New subjects, new professors, new expectations. You learn to navigate the
                  academic blocks, find your favorite study spots, and discover which mess hall serves the
                  best biryani on Fridays.
                </p>
                <p>
                  But it&apos;s not just academics. Societies beckon with their colorful events. Sports
                  complexes fill with energy every evening. Hostel corridors echo with laughter, debates,
                  and the occasional 3 AM study session fueled by chai and determination.
                </p>
                <p>
                  GIKI Chronicles exists to capture all of this — the raw, unfiltered experience of life in
                  the Valley. Every post, every photo, every guide section is a piece of our collective
                  story. Because when you&apos;re falling through the wonderland of campus life, you want
                  someone to share the journey with.
                </p>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="content content--after-hero">
        <article className="article">
          <p>
            And then, somehow, it clicks. The campus that once felt overwhelming becomes familiar. You know
            which shortcuts to take between blocks. You have your study group, your society, your favorite
            bench with the best view of the mountains.
          </p>
          <p>
            That&apos;s the magic of GIKI — it transforms you. You arrive as a wide-eyed freshman and leave
            as an engineer, a leader, a storyteller. And GIKI Chronicles is here to document every step of
            that incredible journey.
          </p>
        </article>
      </section>
    </main>
  );
}
