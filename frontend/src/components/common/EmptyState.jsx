import React from 'react';
import { Search } from 'lucide-react';

export const EmptyState = ({ title = 'No results found', message = 'Try adjusting your location or filter settings.', icon: Icon = Search, actionText, onAction }) => {
  return (
    <div className="text-center py-16 px-4 bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
        {typeof Icon === 'string' ? <Search className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">{message}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-sm transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
