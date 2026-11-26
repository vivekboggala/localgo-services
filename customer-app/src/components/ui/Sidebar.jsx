import React from 'react';
import { NavLink } from 'react-router-dom';
import { Logo } from './Logo';

/**
 * Desktop/tablet high-contrast Sidebar for Admin & Console layouts.
 */
export const Sidebar = ({
  items = [], // [{ key, label, icon, to?, badge? }]
  activeKey = null,
  onSelect = null,
  subtitle = 'Admin Console',
  footer = null,
  className = '',
}) => (
  <aside
    aria-label="Sidebar navigation"
    className={`w-64 bg-brand-ink text-brand-white flex flex-col border-r border-gray-900 ${className}`}
  >
    <div className="px-5 py-5 border-b border-gray-900">
      <Logo variant="dark" size="md" subtitle={subtitle} />
    </div>

    <div className="flex-1 p-3 space-y-1 overflow-y-auto">
      {items.map((item) => {
        const Icon = item.icon;
        const inner = (isActive) => (
          <div
            className={`flex items-center justify-between gap-3 min-h-[48px] px-4 py-2.5 rounded-card text-ds-14 font-semibold transition-all duration-150 ${
              isActive
                ? 'bg-brand-yellow text-brand-ink shadow-card'
                : 'text-gray-400 hover:text-brand-white hover:bg-gray-900'
            }`}
          >
            <span className="flex items-center gap-3">
              {Icon && <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />}
              <span>{item.label}</span>
            </span>
            {item.badge > 0 && (
              <span
                className={`px-2 py-0.5 rounded-pill text-[11px] font-bold ${
                  isActive ? 'bg-brand-ink text-brand-yellow' : 'bg-status-warning text-brand-ink'
                }`}
              >
                {item.badge}
              </span>
            )}
          </div>
        );

        if (item.to && !onSelect) {
          return (
            <NavLink key={item.key || item.to} to={item.to}>
              {({ isActive }) => inner(isActive)}
            </NavLink>
          );
        }

        const isActive = activeKey ? item.key === activeKey : Boolean(item.active);
        return (
          <button
            key={item.key || item.label}
            type="button"
            onClick={() => onSelect?.(item.key)}
            className="w-full text-left"
          >
            {inner(isActive)}
          </button>
        );
      })}
    </div>

    {footer && <div className="p-4 border-t border-gray-900">{footer}</div>}
  </aside>
);

export default Sidebar;
