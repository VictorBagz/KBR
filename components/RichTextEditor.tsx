import React, { useRef, useState } from 'react';
import { Bold, Italic, Heading2, List, Image, Upload, X } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, onImageUpload }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const applyFormatting = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editorRef.current) return;

    setUploading(true);
    try {
      let imageUrl: string;
      
      if (onImageUpload) {
        imageUrl = await onImageUpload(file);
      } else {
        // Fallback: create a data URL for local preview
        imageUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.readAsDataURL(file);
        });
      }

      const imageHTML = `<div style="text-align: center; margin: 20px 0;"><img src="${imageUrl}" style="max-width: 100%; height: auto; border-radius: 8px;" /></div>`;
      
      // Insert at cursor position
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = imageHTML;
        range.insertNode(tempDiv.firstChild as Node);
      } else {
        // Fallback: append to end
        editorRef.current.innerHTML += imageHTML;
      }

      updateContent();
    } catch (error) {
      console.error('Failed to insert image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const updateContent = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    updateContent();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    updateContent();
  };

  React.useEffect(() => {
    if (editorRef.current && !initialized && value) {
      editorRef.current.innerHTML = value;
      setInitialized(true);
    }
  }, []);

  return (
    <div className="space-y-2">
      <div className="bg-rugby-950 border border-rugby-800 rounded-lg overflow-hidden">
        {/* Toolbar */}
        <div className="bg-rugby-900 border-b border-rugby-800 p-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyFormatting('bold')}
            title="Bold"
            className="p-2 hover:bg-rugby-800 rounded text-gray-400 hover:text-white transition-colors"
          >
            <Bold size={18} />
          </button>
          <button
            type="button"
            onClick={() => applyFormatting('italic')}
            title="Italic"
            className="p-2 hover:bg-rugby-800 rounded text-gray-400 hover:text-white transition-colors"
          >
            <Italic size={18} />
          </button>
          <button
            type="button"
            onClick={() => applyFormatting('createUnorderedList')}
            title="Bullet List"
            className="p-2 hover:bg-rugby-800 rounded text-gray-400 hover:text-white transition-colors"
          >
            <List size={18} />
          </button>
          <button
            type="button"
            onClick={() => applyFormatting('formatBlock', '<h3>')}
            title="Heading"
            className="p-2 hover:bg-rugby-800 rounded text-gray-400 hover:text-white transition-colors"
          >
            <Heading2 size={18} />
          </button>
          
          <div className="w-px bg-rugby-800"></div>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Insert Image (centered)"
            className="p-2 hover:bg-rugby-800 rounded text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            {uploading ? <Upload size={18} className="animate-spin" /> : <Image size={18} />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={insertImage}
            className="hidden"
          />
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onPaste={handlePaste}
          className="min-h-64 p-4 text-white bg-rugby-950 focus:outline-none max-w-none"
          style={{
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}
        />
      </div>

      {/* Helper Text */}
      <p className="text-xs text-gray-500">
        Use the toolbar to format your article. Images will be centered horizontally and responsive.
      </p>
    </div>
  );
};
