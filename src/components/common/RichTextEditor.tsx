import React, { useRef, useEffect } from 'react';

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
    <div className="border rounded overflow-hidden">
      <div className="d-flex p-1 border-bottom bg-light gap-1">
        <button type="button" className="btn btn-sm btn-light" onClick={() => execCommand('bold')}><b>B</b></button>
        <button type="button" className="btn btn-sm btn-light" onClick={() => execCommand('italic')}><i>I</i></button>
        <button type="button" className="btn btn-sm btn-light" onClick={() => execCommand('underline')}><u>U</u></button>
        <button type="button" className="btn btn-sm btn-light" onClick={() => execCommand('insertOrderedList')}>1.</button>
        <button type="button" className="btn btn-sm btn-light" onClick={() => execCommand('insertUnorderedList')}>•</button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        style={{
          minHeight: '100px',
          padding: '0.375rem 0.75rem',
          backgroundColor: '#fff',
          outline: 'none',
        }}
      />
    </div>
  );
}
