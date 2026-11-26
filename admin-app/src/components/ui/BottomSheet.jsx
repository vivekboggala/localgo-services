import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

/**
 * Responsive sheet: draggable bottom sheet below lg (<1024px),
 * centered modal or right-side drawer on desktop (lg and up).
 */
export const BottomSheet = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer = null,
  maxHeightClass = 'max-h-[85vh]',
  desktopPresentation = 'modal', // 'modal' | 'drawer'
}) => {
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setDragY(0);
      return undefined;
    }
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const isDrawer = desktopPresentation === 'drawer';

  const handlePointerDown = (e) => {
    if (window.innerWidth >= 1024) return;
    startYRef.current = e.clientY;
  };

  const handlePointerMove = (e) => {
    if (startYRef.current === null) return;
    const delta = e.clientY - startYRef.current;
    if (delta > 0) {
      setDragY(delta);
    }
  };

  const handlePointerUp = () => {
    if (dragY > 96) {
      setDragY(0);
      startYRef.current = null;
      onClose?.();
      return;
    }
    setDragY(0);
    startYRef.current = null;
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-brand-ink/60 backdrop-blur-[2px] ${
        isDrawer ? 'lg:items-stretch lg:justify-end' : 'sm:items-center'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Dialog'}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        style={{ transform: dragY > 0 ? `translateY(${dragY}px)` : undefined }}
        className={`w-full bg-brand-white shadow-sheet border-t border-gray-200 flex flex-col overflow-hidden animate-sheet-up transition-transform duration-150 ${
          /* Admin drawer uses 480px (vs 440px in customer/provider) to fit multi-field record details and metadata cleanly */
          isDrawer
            ? `rounded-t-sheet sm:max-w-lg sm:rounded-sheet lg:max-w-[480px] lg:h-full lg:max-h-screen lg:rounded-none lg:rounded-l-sheet lg:border-l lg:border-t-0 ${maxHeightClass}`
            : `rounded-t-sheet sm:max-w-lg lg:max-w-xl sm:rounded-sheet sm:border ${maxHeightClass}`
        }`}
      >
        <div
          className="pt-3 pb-3 px-5 cursor-grab lg:cursor-default active:cursor-grabbing select-none touch-none lg:touch-auto border-b border-gray-100"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="w-10 h-1.5 bg-gray-200 rounded-pill mx-auto mb-3 lg:hidden" aria-hidden="true" />
          <div className="flex items-start justify-between gap-3">
            <div>
              {title && <h3 className="font-display font-bold text-ds-20 text-brand-ink">{title}</h3>}
              {subtitle && <p className="text-ds-12 text-gray-600 mt-0.5">{subtitle}</p>}
            </div>
            {onClose && (
              <IconButton
                icon={<X className="w-5 h-5" strokeWidth={2} />}
                label="Close dialog"
                variant="ghost"
                rounded="pill"
                onClick={onClose}
              />
            )}
          </div>
        </div>

        <div className="p-5 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="p-4 sm:px-5 bg-gray-50 border-t border-gray-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default BottomSheet;
