"use client";

type AppLoadingStateProps = {
  title?: string;
  subtitle?: string;
  className?: string;
  compact?: boolean;
};

export default function AppLoadingState({
  title = "Ma'lumotlar yuklanmoqda",
  subtitle = "Iltimos, biroz kuting...",
  className = "",
  compact = false,
}: AppLoadingStateProps) {
  return (
    <div className={`app-loading-state ${compact ? "app-loading-state--compact" : ""} ${className}`.trim()}>
      <span className="app-loading-state__sr">
        {title}. {subtitle}
      </span>

      <div className="app-loading-state__skeleton-wrap" aria-hidden>
        <div className="app-loading-state__row">
          <div className="app-loading-state__block app-loading-state__block--avatar" />
          <div className="app-loading-state__stack">
            <div className="app-loading-state__block app-loading-state__block--title" />
            <div className="app-loading-state__block app-loading-state__block--subtitle" />
          </div>
        </div>

        {!compact && (
          <>
            <div className="app-loading-state__cards">
              <div className="app-loading-state__card">
                <div className="app-loading-state__block app-loading-state__block--card-top" />
                <div className="app-loading-state__block app-loading-state__block--line-lg" />
                <div className="app-loading-state__block app-loading-state__block--line-md" />
              </div>
              <div className="app-loading-state__card">
                <div className="app-loading-state__block app-loading-state__block--card-top" />
                <div className="app-loading-state__block app-loading-state__block--line-lg" />
                <div className="app-loading-state__block app-loading-state__block--line-sm" />
              </div>
              <div className="app-loading-state__card">
                <div className="app-loading-state__block app-loading-state__block--card-top" />
                <div className="app-loading-state__block app-loading-state__block--line-lg" />
                <div className="app-loading-state__block app-loading-state__block--line-md" />
              </div>
            </div>
            <div className="app-loading-state__stack">
              <div className="app-loading-state__block app-loading-state__block--line-lg" />
              <div className="app-loading-state__block app-loading-state__block--line-md" />
              <div className="app-loading-state__block app-loading-state__block--line-sm" />
            </div>
          </>
        )}

        {compact && (
          <div className="app-loading-state__stack">
            <div className="app-loading-state__block app-loading-state__block--line-lg" />
            <div className="app-loading-state__block app-loading-state__block--line-md" />
          </div>
        )}
      </div>
    </div>
  );
}
