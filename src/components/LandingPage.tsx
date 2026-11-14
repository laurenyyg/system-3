import { useEffect, useRef } from 'react';
import heroSailboatImg from '../../assets/Vintage Sailboat Amidst Rolling Waves.png';
import shorelineLightImg from '../../assets/system3-faithful-light.png';
import shorelineDarkImg from '../../assets/system3-faithful-dark.png';

interface ExampleScenario {
  id: string;
  title: string;
  description: string;
  imageLight: string;
  imageDark: string;
  prefillDescription: string;
  prefillDeadline: string;
}

const EXAMPLE_SCENARIOS: ExampleScenario[] = [
  {
    id: 'relocation',
    title: 'Should you build a life somewhere else?',
    description:
      "A new country. A promising opportunity. And a hundred questions you haven't asked.",
    imageLight: '/examples/relocation-light.png',
    imageDark: '/examples/relocation-dark.png',
    prefillDescription:
      "I have one week to decide whether to move to Singapore for work. It feels like a once-in-a-lifetime opportunity, but I'm stressed and worried about what I haven't considered.",
    prefillDeadline: '1 week',
  },
  {
    id: 'career',
    title: 'Is it time to change career direction?',
    description: 'The familiar path feels safe. But what might staying cost you?',
    imageLight: '/examples/career-light.png',
    imageDark: '/examples/career-dark.png',
    prefillDescription:
      "I've been offered a leadership role at an early-stage company, which would mean leaving a stable, well-compensated position where I'm respected. The upside is exciting, but I'm unsure how much of my hesitation is healthy caution versus fear of change.",
    prefillDeadline: '2 weeks',
  },
  {
    id: 'entrepreneurial',
    title: 'Is your startup idea worth the leap?',
    description: "What if it succeeds? What if it fails? What haven't you considered?",
    imageLight: '/examples/entrepreneurship-light.png',
    imageDark: '/examples/entrepreneurship-dark.png',
    prefillDescription:
      "I'm considering leaving my job to start a company with a former colleague. We have strong early conviction in the problem, but limited runway and unanswered questions about our partnership, customer demand, and personal financial tolerance.",
    prefillDeadline: 'End of next month',
  },
];

const JOURNEY_STEPS = [
  {
    number: '01',
    title: 'Share',
    description: "Start with the decision that's been on your mind.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Understand',
    description: "Discover what matters most to you — and what's holding you back.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Challenge',
    description: 'Uncover the blind spots hiding in plain sight.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    ),
  },
  {
    number: '04',
    title: 'Explore',
    description: 'Stress-test your choices. Run a pre-mortem. Explore what could unfold.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="18" r="2.5" />
        <circle cx="18" cy="6" r="2.5" />
        <circle cx="18" cy="18" r="2.5" />
        <path d="M8.5 18H15.5" />
        <path d="M8.5 16.8C11.5 15 12 9 15.5 6.8" />
      </svg>
    ),
  },
  {
    number: '05',
    title: 'Reflect',
    description: 'Capture your thinking today, for your future self to revisit.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="13" y2="17" />
      </svg>
    ),
  },
];

interface Props {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  hasInProgressDecision: boolean;
  onEnterWorkspace: () => void;
  onStartExample: (description: string, deadline: string) => void;
}

export function LandingPage({
  theme,
  onToggleTheme,
  hasInProgressDecision,
  onEnterWorkspace,
  onStartExample,
}: Props) {
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => {});
  }, []);

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-container landing-header-inner">
          <a href="#top" className="landing-brand-link" aria-label="System 3 home">
            <span className="wordmark" aria-label="System 3">
              <span aria-hidden="true">S</span>
              <span className="wordmark-y" aria-hidden="true">
                y
              </span>
              <span aria-hidden="true">stem</span>
              <span className="wordmark-three" aria-hidden="true">
                3
              </span>
            </span>
          </a>

          <nav aria-label="Landing sections" className="landing-nav">
            <a href="#how-it-works" className="landing-nav-link">
              How It Works
            </a>
            <a href="#principles" className="landing-nav-link">
              Principles
            </a>
            <a href="#examples" className="landing-nav-link">
              Examples
            </a>
          </nav>

          <div className="landing-header-actions">
            <button
              type="button"
              className="btn btn-sm landing-theme-btn"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              onClick={onToggleTheme}
            >
              <span className="theme-label-full">
                {theme === 'light' ? 'Dark mode' : 'Light mode'}
              </span>
              <span className="theme-label-short" aria-hidden="true">
                {theme === 'light' ? 'Dark' : 'Light'}
              </span>
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={onEnterWorkspace}>
              {hasInProgressDecision ? 'Continue Your Decision' : 'Start a Decision'}
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* Section 01 — Hero */}
        <section className="landing-hero" aria-labelledby="hero-heading">
          <div className="landing-hero-ocean" aria-hidden="true">
            <video
              ref={heroVideoRef}
              className="landing-hero-img landing-hero-video"
              autoPlay
              loop
              muted
              playsInline
              poster={heroSailboatImg}
            >
              <source src="/hero-ocean.webm" type="video/webm" />
              <source src="/hero-ocean.mp4" type="video/mp4" />
              <img className="landing-hero-img" src={heroSailboatImg} alt="" />
            </video>
            <div className="landing-hero-scrim" />
          </div>

          <div className="landing-container landing-hero-content">
            <p className="landing-eyebrow">A DECISION-THINKING COMPANION</p>
            <h1 id="hero-heading" className="landing-hero-headline">
              The decisions that shape your life deserve deeper thinking.
            </h1>
            <p className="landing-hero-body">
              A space to question assumptions, explore possibilities, and see what you might be
              missing.
            </p>

            <div className="landing-hero-cta-row">
              <button type="button" className="btn btn-primary landing-cta-btn" onClick={onEnterWorkspace}>
                {hasInProgressDecision ? 'Continue Your Decision →' : 'Start a Decision →'}
              </button>
            </div>

            <aside className="kahneman-note" aria-label="Intellectual inspiration">
              <p className="kahneman-title">
                Inspired by Daniel Kahneman&apos;s <em>Thinking, Fast and Slow</em>.
              </p>
              <p className="kahneman-subtitle">
                System 1 thinks fast. System 2 thinks slow. System 3 challenges how you think.
              </p>
            </aside>
          </div>
        </section>

        {/* Section 02 — How It Works */}
        <section id="how-it-works" className="landing-section">
          <div className="landing-container">
            <div className="landing-section-header">
              <p className="landing-section-index">02 — How It Works</p>
              <h2 className="landing-section-heading">A clearer way to think.</h2>
              <p className="landing-section-lead">
                One decision. Five steps to explore what you might be missing.
              </p>
            </div>

            <ol className="journey-grid">
              {JOURNEY_STEPS.map((step) => (
                <li key={step.number} className="journey-step">
                  <div className="journey-step-top">
                    <span className="journey-step-icon" aria-hidden="true">
                      {step.icon}
                    </span>
                    <span className="journey-step-num">{step.number}</span>
                  </div>
                  <h3 className="journey-step-title">{step.title}</h3>
                  <p className="journey-step-desc">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Section 03 — Principles */}
        <section id="principles" className="landing-section landing-section-alt">
          <div className="landing-container">
            <div className="landing-section-header">
              <p className="landing-section-index">03 — Principles</p>
              <h2 className="landing-section-heading">Better questions. Clearer thinking.</h2>
            </div>

            <div className="principles-list">
              <article className="principle-item">
                <h3 className="principle-title">Challenge your instincts.</h3>
                <p className="principle-desc">
                  <a
                    href="https://fs.blog/daniel-kahneman-the-two-systems/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="principle-link"
                  >
                    Daniel Kahneman
                  </a>{' '}
                  showed us how cognitive biases shape our judgment. System 3 helps you question the
                  assumptions that feel like facts.
                </p>
              </article>

              <article className="principle-item">
                <h3 className="principle-title">See the forces at play.</h3>
                <p className="principle-desc">
                  <a
                    href="https://fs.blog/great-talks/psychology-human-misjudgment/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="principle-link"
                  >
                    Charlie Munger
                  </a>
                  &apos;s mental models and Lollapalooza Effect reveal how multiple psychological
                  forces can compound. Learn to look beyond any single explanation.
                </p>
              </article>

              <article className="principle-item">
                <h3 className="principle-title">The questions you never thought to ask.</h3>
                <p className="principle-desc">
                  The most important blind spots are often unknown unknowns. Explore overlooked
                  perspectives, stress-test possible futures, and make the decision your own.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Editorial Testimonial */}
        <section className="landing-testimonial" aria-label="Early tester feedback">
          <div className="landing-container">
            <figure className="testimonial-figure">
              <blockquote className="testimonial-quote">
                <span className="testimonial-quote-mark" aria-hidden="true">
                  “
                </span>
                I loved how it separated facts from assumptions. It even picked up on things I
                hadn&apos;t mentioned, despite my having explored the same decision with AI before.
                <span className="testimonial-quote-mark" aria-hidden="true">
                  ”
                </span>
              </blockquote>
              <figcaption className="testimonial-attribution">
                — Early tester (New Zealand)
              </figcaption>
            </figure>
          </div>
        </section>

        {/* Section 04 — Examples */}
        <section id="examples" className="landing-section">
          <div className="landing-container">
            <div className="landing-section-header">
              <p className="landing-section-index">04 — Examples</p>
              <h2 className="landing-section-heading">For the decisions that matter.</h2>
            </div>

            <div className="examples-grid">
              {EXAMPLE_SCENARIOS.map((example) => (
                <article key={example.id} className="example-card">
                  <div>
                    <div className="example-card-media" aria-hidden="true">
                      <img
                        className="example-card-img"
                        src={theme === 'dark' ? example.imageDark : example.imageLight}
                        alt=""
                        width={560}
                        height={185}
                        loading="lazy"
                      />
                    </div>
                    <h3 className="example-card-title">{example.title}</h3>
                    <p className="example-card-desc">{example.description}</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-tertiary example-card-action"
                    onClick={() =>
                      onStartExample(example.prefillDescription, example.prefillDeadline)
                    }
                  >
                    Explore this scenario →
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Section 05 — Final CTA */}
        <section className="landing-final-cta" aria-labelledby="final-cta-heading">
          <div className="landing-final-cta-art" aria-hidden="true">
            <img
              className="landing-final-cta-img"
              src={theme === 'dark' ? shorelineDarkImg : shorelineLightImg}
              alt=""
            />
          </div>
          <div className="landing-container landing-final-cta-inner">
            <div className="landing-final-cta-copy">
              <h2 id="final-cta-heading" className="landing-final-heading">
                What lies beyond the obvious?
              </h2>
              <p className="landing-final-body">
                The most important questions are often the ones we haven&apos;t thought to ask.
              </p>
              <button
                type="button"
                className="btn btn-primary landing-cta-btn"
                onClick={onEnterWorkspace}
              >
                {hasInProgressDecision ? 'Continue Your Decision →' : 'Start a Decision →'}
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-main">
            <div className="landing-footer-brand">
              <span className="wordmark landing-footer-wordmark" aria-label="System 3">
                <span aria-hidden="true">S</span>
                <span className="wordmark-y" aria-hidden="true">
                  y
                </span>
                <span aria-hidden="true">stem</span>
                <span className="wordmark-three" aria-hidden="true">
                  3
                </span>
              </span>
              <p className="landing-footer-tagline">A companion for clearer thinking.</p>
            </div>

            <div className="landing-footer-founder">
              <p className="landing-footer-byline">
                Created by <strong>Lauren Yu</strong>
              </p>
              <ul className="landing-footer-links">
                <li>
                  <a href="mailto:laurenyu.317@gmail.com" className="landing-footer-link">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="1" y="2.5" width="12" height="9" rx="1.5" />
                      <path d="M1.5 3.5L7 7.5l5.5-4" />
                    </svg>
                    <span>Email</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://linkedin.com/in/laurenyyy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="landing-footer-link"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="1.25" y="1.25" width="11.5" height="11.5" rx="2.2" />
                      <path d="M4.4 6.4v3.4" />
                      <circle cx="4.4" cy="4.3" r="0.6" fill="currentColor" stroke="none" />
                      <path d="M6.9 9.8V6.4" />
                      <path d="M6.9 7.5c0-.8.6-1.3 1.4-1.3.8 0 1.3.5 1.3 1.4v2.2" />
                    </svg>
                    <span>LinkedIn</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://laureny.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="landing-footer-link"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="7" cy="7" r="5.75" />
                      <path d="M1.5 7h11" />
                      <path d="M7 1.25c1.5 1.55 2.3 3.55 2.3 5.75S8.5 11.2 7 12.75C5.5 11.2 4.7 9.2 4.7 7S5.5 2.8 7 1.25z" />
                    </svg>
                    <span>Personal Website</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="landing-footer-bottom">
            <p className="landing-footer-note">© 2026 System 3</p>
            <p className="landing-footer-note">
              No account required · Nothing stored in a database.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
