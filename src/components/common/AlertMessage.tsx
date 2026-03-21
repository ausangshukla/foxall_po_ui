interface AlertMessageProps {
  variant?: 'success' | 'danger' | 'warning' | 'info'
  message: string
  onClose?: () => void
}

export function AlertMessage({
  variant = 'info',
  message,
  onClose,
}: AlertMessageProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-50 text-green-800 border-green-100'
      case 'danger':
        return 'bg-red-50 text-red-800 border-red-100'
      case 'warning':
        return 'bg-yellow-50 text-yellow-800 border-yellow-100'
      case 'info':
      default:
        return 'bg-blue-50 text-blue-800 border-blue-100'
    }
  }

  const getIcon = () => {
    switch (variant) {
      case 'success': return 'check_circle'
      case 'danger': return 'error'
      case 'warning': return 'warning'
      case 'info':
      default: return 'info'
    }
  }

  return (
    <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm animate-in slide-in-from-top-2 duration-300 ${getVariantStyles()}`}>
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-[20px]">{getIcon()}</span>
        <span className="text-sm font-semibold tracking-tight">{message}</span>
      </div>
      {onClose && (
        <button 
          onClick={onClose} 
          className="p-1 rounded-full hover:bg-black/5 transition-colors text-inherit opacity-70 hover:opacity-100"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      )}
    </div>
  )
}
