import { useEffect, useId, useRef, type FC, type ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  icon?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

export const Modal: FC<ModalProps> = ({ isOpen, title, description, icon, onClose, children }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  // Enfocar el primer campo al abrir y devolver el foco al cerrar
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const firstField = panelRef.current?.querySelector<HTMLElement>('input, select, textarea');
    firstField?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4 py-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="w-full max-w-md max-h-full overflow-y-auto bg-white p-6 sm:p-7 rounded-3xl shadow-2xl ring-1 ring-slate-900/5 space-y-5"
      >
        <div className="flex items-start gap-3.5">
          {icon && (
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h3 id={titleId} className="font-display text-lg font-bold text-slate-900">
              {title}
            </h3>
            {description && (
              <p id={descriptionId} className="text-sm text-slate-500 mt-0.5 leading-snug">
                {description}
              </p>
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};
