interface GenerationLoaderProps {
  title: string;
  subtitle: string;
  variant?: 'cards' | 'rows';
}

/**
 * Shared accessible loading indicator and skeleton placeholder for Gemini generation states.
 */
export function GenerationLoader({
  title,
  subtitle,
  variant = 'rows',
}: GenerationLoaderProps) {
  return (
    <div className="generation-loader" role="status" aria-live="polite">
      <div className="generation-loader-status">
        <span className="generation-spinner" aria-hidden="true" />
        <div className="generation-loader-copy">
          <p className="generation-loader-title">{title}</p>
          <p className="generation-loader-sub">{subtitle}</p>
        </div>
      </div>

      {variant === 'cards' ? (
        <div className="generation-skeleton-grid" aria-hidden="true">
          <div className="generation-skeleton-card">
            <div className="generation-skeleton-bar generation-skeleton-bar--md" />
            <div className="generation-skeleton-bar generation-skeleton-bar--full" />
            <div className="generation-skeleton-bar generation-skeleton-bar--lg" />
          </div>
          <div className="generation-skeleton-card">
            <div className="generation-skeleton-bar generation-skeleton-bar--sm" />
            <div className="generation-skeleton-bar generation-skeleton-bar--full" />
            <div className="generation-skeleton-bar generation-skeleton-bar--md" />
          </div>
          <div className="generation-skeleton-card">
            <div className="generation-skeleton-bar generation-skeleton-bar--lg" />
            <div className="generation-skeleton-bar generation-skeleton-bar--full" />
            <div className="generation-skeleton-bar generation-skeleton-bar--sm" />
          </div>
        </div>
      ) : (
        <div className="generation-skeleton-rows" aria-hidden="true">
          <div className="generation-skeleton-card">
            <div className="generation-skeleton-bar generation-skeleton-bar--sm" />
            <div className="generation-skeleton-bar generation-skeleton-bar--full" />
            <div className="generation-skeleton-bar generation-skeleton-bar--lg" />
          </div>
          <div className="generation-skeleton-card">
            <div className="generation-skeleton-bar generation-skeleton-bar--md" />
            <div className="generation-skeleton-bar generation-skeleton-bar--lg" />
            <div className="generation-skeleton-bar generation-skeleton-bar--md" />
          </div>
        </div>
      )}
    </div>
  );
}
