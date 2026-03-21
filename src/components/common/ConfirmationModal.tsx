import React from 'react';

interface ConfirmationModalProps {
  show: boolean;
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  variant?: 'danger' | 'primary' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  show,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  showCancel = true,
  variant = 'danger',
  isLoading = false,
}) => {
  if (!show) return null;

  const getVariantClasses = () => {
    switch (variant) {
      case 'danger': return 'bg-red-600 hover:bg-red-700 text-white shadow-red-100';
      case 'warning': return 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-yellow-100';
      case 'success': return 'bg-green-600 hover:bg-green-700 text-white shadow-green-100';
      case 'info': return 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-100';
      default: return 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            {variant === 'danger' && (
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <span className="material-symbols-outlined">report</span>
              </div>
            )}
            <h3 className="text-xl font-bold text-gray-900 leading-tight">{title}</h3>
          </div>
          <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
            {message}
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-gray-100">
          {showCancel && (
            <button 
              onClick={onCancel} 
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}
          <button 
            onClick={onConfirm} 
            disabled={isLoading}
            className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-lg flex items-center justify-center min-w-[100px] ${getVariantClasses()}`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
