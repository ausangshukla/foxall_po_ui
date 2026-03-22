import { useRef, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || '')) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-500/50">
      <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-100 flex-wrap">
        <button 
          type="button" 
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-slate-700 transition-all active:scale-95" 
          onClick={() => execCommand('bold')}
          title="Bold"
        >
          <span className="material-symbols-outlined text-[20px] font-black">format_bold</span>
        </button>
        <button 
          type="button" 
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-slate-700 transition-all active:scale-95" 
          onClick={() => execCommand('italic')}
          title="Italic"
        >
          <span className="material-symbols-outlined text-[20px]">format_italic</span>
        </button>
        <button 
          type="button" 
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-slate-700 transition-all active:scale-95" 
          onClick={() => execCommand('underline')}
          title="Underline"
        >
          <span className="material-symbols-outlined text-[20px]">format_underlined</span>
        </button>
        <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>
        <button 
          type="button" 
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-slate-700 transition-all active:scale-95" 
          onClick={() => execCommand('insertOrderedList')}
          title="Numbered List"
        >
          <span className="material-symbols-outlined text-[20px]">format_list_numbered</span>
        </button>
        <button 
          type="button" 
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-slate-700 transition-all active:scale-95" 
          onClick={() => execCommand('insertUnorderedList')}
          title="Bullet List"
        >
          <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        className="min-h-[150px] p-4 bg-white text-slate-800 outline-none prose prose-sm prose-slate max-w-none font-medium placeholder:text-slate-400"
        aria-placeholder={placeholder}
      />
    </div>
  );
}
