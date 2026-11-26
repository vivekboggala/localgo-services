import React from 'react';

export const Tabs = ({
  tabs = [],
  activeTab,
  onChange,
  variant = 'pill',
  className = '',
}) => {
  if (variant === 'underline') {
    return (
      <div className={`flex items-center gap-1 border-b border-gray-200 dark:border-gray-600/30 overflow-x-auto ${className}`} role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange?.(tab.key)}
              className={`min-h-[48px] px-4 text-ds-14 font-bold whitespace-nowrap border-b-2 transition-colors duration-150 flex items-center gap-2 ${
                isActive
                  ? 'border-brand-ink dark:border-brand-yellow text-brand-ink dark:text-brand-yellow'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-brand-ink dark:hover:text-brand-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count !== null && (
                <span className={`px-2 py-0.5 rounded-pill text-[11px] font-bold ${
                  isActive ? 'bg-brand-yellow text-brand-ink' : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-900 p-1.5 rounded-pill border border-gray-200 dark:border-gray-600/30 overflow-x-auto max-w-full ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange?.(tab.key)}
            className={`min-h-[44px] px-4 py-2 rounded-pill text-ds-12 font-bold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
              isActive
                ? 'bg-brand-ink text-brand-white dark:bg-brand-yellow dark:text-brand-ink shadow-card'
                : 'text-gray-600 dark:text-gray-400 hover:text-brand-ink dark:hover:text-brand-white'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count !== null && (
              <span className={`px-2 py-0.5 rounded-pill text-[10px] font-extrabold ${
                isActive ? 'bg-brand-yellow text-brand-ink dark:bg-brand-ink dark:text-brand-yellow' : 'bg-brand-white dark:bg-brand-ink text-gray-600 dark:text-gray-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
