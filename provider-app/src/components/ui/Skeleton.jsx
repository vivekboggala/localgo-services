import React from 'react';

export const Skeleton = ({ className = 'h-4 w-full', rounded = 'rounded-card' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-600/30 ${rounded} ${className}`} aria-hidden="true" />
);

export const SkeletonCard = () => (
  <div className="bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/25 rounded-card p-5 shadow-card space-y-4">
    <div className="flex items-center gap-3">
      <Skeleton className="w-12 h-12 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
    <Skeleton className="h-12 w-full" />
    <div className="flex gap-3 pt-1">
      <Skeleton className="h-12 flex-1" />
      <Skeleton className="h-12 w-28" />
    </div>
  </div>
);

export const SkeletonList = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }, (_, idx) => (
      <SkeletonCard key={idx} />
    ))}
  </div>
);

export const SkeletonTableRow = ({ cols = 5 }) => (
  <tr className="border-b border-gray-100 dark:border-gray-600/20">
    {Array.from({ length: cols }, (_, idx) => (
      <td key={idx} className="p-4">
        <Skeleton className="h-4 w-full max-w-[140px]" />
      </td>
    ))}
  </tr>
);

export default Skeleton;
