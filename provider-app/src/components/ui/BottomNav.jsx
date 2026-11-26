import React from 'react';
import { NavLink } from 'react-router-dom';

/**
 * Mobile-first bottom navigation bar (>= 52px touch targets, dark-theme ready).
 */
export const BottomNav = ({
  items = [],
  activeKey = null,
  onSelect = null,
  fixed = true,
  className = '',
}) => (
  <nav
    aria-label="Mobile bottom navigation"
    className={`${
      fixed ? 'fixed bottom-0 left-0 right-0 z-40' : 'w-full rounded-sheet'
    } bg-brand-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-600/30 shadow-sheet px-1.5 py-1.5 flex items-center justify-around ${className}`}
  >
    {items.map((item) => {
      const Icon = item.icon;
      const content = (isActive) => (
        <div className="relative flex flex-col items-center justify-center min-w-[58px] min-h-[52px] px-2 py-1 rounded-card transition-all duration-150">
          <div
            className={`px-3 py-1 rounded-pill transition-colors duration-150 ${
              isActive
                ? 'bg-brand-yellow text-brand-ink'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {Icon && <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 2} />}
          </div>
          <span
            className={`text-[11px] mt-0.5 tracking-tight ${
              isActive
                ? 'font-bold text-brand-ink dark:text-brand-yellow'
                : 'font-medium text-gray-600 dark:text-gray-400'
            }`}
          >
            {item.label}
          </span>
          {item.badge > 0 && (
            <span className="absolute top-0.5 right-1.5 min-w-[20px] h-[20px] px-1 rounded-pill bg-status-danger text-brand-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-brand-white dark:ring-gray-900">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
        </div>
      );

      if (item.to && !onSelect) {
        return (
          <NavLink key={item.key || item.to} to={item.to} className="focus-visible:outline-none">
            {({ isActive }) => content(isActive)}
          </NavLink>
        );
      }

      const isActive = activeKey ? item.key === activeKey : Boolean(item.active);
      return (
        <button
          key={item.key || item.label}
          type="button"
          onClick={() => onSelect?.(item.key)}
          className="cursor-pointer active:scale-95 transition-transform duration-150"
        >
          {content(isActive)}
        </button>
      );
    })}
  </nav>
);

export default BottomNav;
