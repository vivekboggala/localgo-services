import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const PaginationBar = ({ pageIndex, hasPrev, hasNext, itemCount, totalElements, loading, onPrev, onNext }) => {
  if (!hasPrev && !hasNext && itemCount === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600">
      <div>
        Page <strong className="text-slate-900">{pageIndex + 1}</strong> • Showing{' '}
        <strong className="text-slate-900">{itemCount}</strong>
        {typeof totalElements === 'number' && totalElements > itemCount ? ` of ${totalElements}` : ''} items
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrev || loading}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext || loading}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default PaginationBar;
