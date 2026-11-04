import { useEffect, type FC } from 'react';

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
  duration?: number;
}

export const Toast: FC<ToastProps> = ({ message, onDismiss, duration = 4000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 sm:max-w-sm p-3.5 rounded-lg text-sm border shadow-lg flex items-start space-x-2.5 bg-emerald-50 border-emerald-200 text-emerald-800"
    >
      <div className="shrink-0 mt-0.5">
        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className="flex-1 font-medium text-xs leading-relaxed">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar notificación"
        className="shrink-0 text-emerald-600 hover:text-emerald-800"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
