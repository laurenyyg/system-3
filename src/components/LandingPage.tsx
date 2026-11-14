interface ExampleScenario {
  id: string;
  title: string;
  description: string;
  prefillDescription: string;
  prefillDeadline: string;
}

const EXAMPLE_SCENARIOS: ExampleScenario[] = [
  {
    id: 'relocation',
    title: 'A move across the world',
    description:
      'An opportunity to relocate for work, with unexpected career, healthcare, immigration, and personal considerations.',
    prefillDescription:
      "I have one week to decide whether to move to Singapore for work. It feels like a once-in-a-lifetime opportunity, but I'm stressed and worried about what I haven't considered.",
    prefillDeadline: '1 week',
  },
  {
    id: 'career',
    title: 'A new career direction',
    description:
      'A difficult choice between staying in a familiar role and pursuing an uncertain opportunity.',
    prefillDescription:
      "I've been offered a leadership role at an early-stage company, which would mean leaving a stable, well-compensated position where I'm respected. The upside is exciting, but I'm unsure how much of my hesitation is healthy caution versus fear of change.",
    prefillDeadline: '2 weeks',
  },
  {
    id: 'entrepreneurial',
    title: 'An entrepreneurial leap',
    description:
      'A decision about whether to start a company, with potential risks, motivations, and blind spots.',
    prefillDescription:
      "I'm considering leaving my job to start a company with a former colleague. We have strong early conviction in the problem, but limited runway and unanswered questions about our partnership, customer demand, and personal financial tolerance.",
    prefillDeadline: 'End of next month',
  },
];

const JOURNEY_STEPS = [
  {
    number: '01',
    title: 'Share',
    description: "Describe the decision you're facing.",
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
    description: 'Clarify your goals, concerns, and priorities.',
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
    description: 'Examine assumptions and potential cognitive blind spots.',
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
    description: 'Consider different perspectives and rehearse possible futures.',
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
    description: 'Preserve your reasoning in a Decision Record.',
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
              className="btn btn-sm"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              onClick={onToggleTheme}
            >
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={onEnterWorkspace}>
              Start Thinking
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* Section 01 — Hero */}
        <section className="landing-hero" aria-labelledby="hero-heading">
          <div className="landing-hero-ocean" aria-hidden="true">
            <img className="landing-hero-img" src="/hero-sailboat.png" alt="" />
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
                <h3 className="principle-title">Challenge, don&apos;t decide.</h3>
                <p className="principle-desc">
                  System 3 helps you examine your reasoning. The decision remains yours.
                </p>
              </article>

              <article className="principle-item">
                <h3 className="principle-title">Questions before answers.</h3>
                <p className="principle-desc">
                  Discover the important questions you may not have considered.
                </p>
              </article>

              <article className="principle-item">
                <h3 className="principle-title">Possibilities, not predictions.</h3>
                <p className="principle-desc">
                  Explore plausible futures without pretending to know what will happen.
                </p>
              </article>
            </div>
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
        <section className="landing-final-cta">
          <div className="landing-container landing-final-cta-inner">
            <h2 className="landing-final-heading">What might you be missing?</h2>
            <p className="landing-final-body">
              Your next important decision deserves a closer look.
            </p>
            <button type="button" className="btn btn-primary landing-cta-btn" onClick={onEnterWorkspace}>
              {hasInProgressDecision ? 'Continue Your Decision →' : 'Start a Decision →'}
            </button>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
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
          <p className="landing-footer-note">
            No account required · Nothing stored in a database.
          </p>
        </div>
      </footer>
    </div>
  );
}
