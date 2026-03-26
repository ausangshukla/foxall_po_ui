import React, { useState, useRef, useEffect } from 'react'

interface Option {
  value: string | number
  label: string
}

interface SearchableSelectProps {
  id: string
  name: string
  label: string
  value: string | number
  options: Option[]
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
}

export function SearchableSelect({
  id,
  name,
  label,
  value,
  options,
  onChange,
  placeholder = 'Select option...',
  error,
  required,
  disabled
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedOption = options.find(opt => String(opt.value) === String(value))

  const handleSelect = (option: Option) => {
    const event = {
      target: {
        name,
        value: option.value.toString()
      }
    } as React.ChangeEvent<HTMLSelectElement>
    onChange(event)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div className="space-y-1.5" ref={dropdownRef}>
      <label htmlFor={id} className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">
        {label} {required && <span className="text-error">*</span>}
      </label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full text-left bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface flex items-center justify-between ${
            error ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className={!selectedOption ? 'text-on-surface-variant' : ''}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
            {isOpen ? 'expand_less' : 'expand_more'}
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-2 border-b border-outline-variant/20">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">search</span>
                <input
                  autoFocus
                  type="text"
                  placeholder="Search..."
                  className="w-full bg-surface-container-low border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <ul className="max-h-60 overflow-y-auto py-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-primary-container/10 flex items-center justify-between ${
                        String(option.value) === String(value) ? 'bg-primary-container/20 text-primary font-bold' : 'text-on-surface'
                      }`}
                      onClick={() => handleSelect(option)}
                    >
                      {option.label}
                      {String(option.value) === String(value) && (
                        <span className="material-symbols-outlined text-[18px]">check</span>
                      )}
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-4 py-8 text-center text-sm text-on-surface-variant italic">
                  No matches found
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
      {error && <p className="text-[10px] font-bold text-error ml-1 mt-1">{error}</p>}
    </div>
  )
}
