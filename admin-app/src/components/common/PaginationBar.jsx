import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui';

export const PaginationBar = ({ pageIndex, hasPrev, hasNext, itemCount, totalElements, loading, onPrev, onNext }) => {
  if (!hasPrev && !hasNext && itemCount === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-brand-white border border-gray-200 rounded-card text-ds-12 text-gray-600 shadow-card">
      <div>
        Page <strong className="text-brand-ink">{pageIndex + 1}</strong> &bull; Showing{' '}
        <strong className="text-brand-ink">{itemCount}</strong>
        {typeof totalElements === 'number' && totalElements > itemCount ? ` of ${totalElements}` : ''} items
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          disabled={!hasPrev || loading}
          onClick={onPrev}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
          className="min-h-[40px] py-1.5 px-3 text-ds-12"
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          disabled={!hasNext || loading}
          onClick={onNext}
          rightIcon={<ChevronRight className="w-4 h-4" />}
          className="min-h-[40px] py-1.5 px-3 text-ds-12"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default PaginationBar;
