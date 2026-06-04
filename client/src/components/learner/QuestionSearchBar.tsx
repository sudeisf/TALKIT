'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

type QuestionSearchBarProps = {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
};

export default function QuestionSearchBar({
  value,
  onChange,
  onSubmit,
}: QuestionSearchBarProps) {
  const [internalValue, setInternalValue] = useState('');
  const effectiveValue = value ?? internalValue;

  const handleChange = (nextValue: string) => {
    if (typeof value === 'undefined') {
      setInternalValue(nextValue);
    }
    onChange?.(nextValue);
  };

  return (
    <div className="w-full max-w-md">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none pl-3">
          <Search className="h-4 w-4 text-gray-400 dark:text-primary-foreground/60" />
        </div>
        <input
          type="text"
          placeholder="Search or type a command"
          value={effectiveValue}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onSubmit?.(effectiveValue);
            }
          }}
          className="w-full h-10 pl-10 pr-4 text-sm bg-white border border-gray-300  rounded-sm shadow-none placeholder:text-gray-500 focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:placeholder:text-neutral-400 dark:focus:border-primary dark:focus:ring-primary/30"
        />
      </div>
    </div>
  );
}
