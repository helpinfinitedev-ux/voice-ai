import { TextareaProps } from '@/types';
import React, { ChangeEvent } from 'react';

const Textarea = ({
  text,
  handleChange,
  maxChars,
  placeholder,
  showLimit,
  ...rest
}: TextareaProps) => {
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text/plain');
    const newText = text + pastedText;
    if (newText.length > 4000) {
      e.preventDefault();
      const truncatedText = newText.substring(0, 4000);
      handleChange({
        target: {
          value: truncatedText,
        },
      } as unknown as ChangeEvent<HTMLTextAreaElement>);
    }
  };
  console.log('text', text);
  return (
    <div className="relative z-[51]">
      <textarea
        value={text?.length > 4000 ? text?.substring(0, 4000) : text}
        onPaste={handlePaste}
        onChange={handleChange}
        className="w-full rounded-lg border p-4 bg-white text-sm placeholder-gray-500"
        placeholder={placeholder}
        rows={3}
        {...rest}
      />
      {showLimit !== false && (
        <div className="absolute right-[4px] bottom-[-16px] flex text-[13px] items-center gap-2 text-gray-800">
          {text?.length >= 4000 && (
            <p className="text-red-500 text-[12px]">Characters limit reached</p>
          )}
          <span>
            {text?.length}/{maxChars || '4000'}
          </span>
        </div>
      )}
    </div>
  );
};

export default Textarea;
