'use client';

import { useAppSelector } from '@/redux/hooks';
import { Plus, X } from 'lucide-react';
import { useState, useRef, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface SkillsInputProps {
  value: string[];
  onChange: (skills: string[]) => void;
}

export const SkillsInput: React.FC<SkillsInputProps> = ({ value, onChange }) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /** Normalize helper */
  const normalize = (v: string) => v.trim().toLowerCase();

  /** Get existing tags from redux (memoized) */
  const existingTags = useAppSelector((state) => {
    const set = new Set<string>();
    Object.values(state.proTags).forEach((container: any) => {
      if (!Array.isArray(container)) return;
      container.forEach((tag: any) => {
        const label = typeof tag?.label === 'string' ? tag.label.trim() : '';
        if (label) set.add(label);
      });
    });
    return Array.from(set);
  });

  /** Suggestions (memoized) */
  const suggestions = useMemo(() => {
    if (!inputValue.trim()) return [];

    const selectedNormalized = new Set(value.map(normalize));

    return existingTags
      .filter(
        (tag) =>
          normalize(tag).includes(normalize(inputValue)) &&
          !selectedNormalized.has(normalize(tag))
      )
      .slice(0, 5);
  }, [existingTags, inputValue, value]);

  /** Add skill (deduplicated + trimmed) */
  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    const normalizedSet = new Set(value.map(normalize));
    if (normalizedSet.has(normalize(trimmed))) return;
    onChange([...value, trimmed]);
    setInputValue('');
  };

  /** Remove skill */
  const removeSkill = (skillToRemove: string) => {
    onChange(value.filter((skill) => skill !== skillToRemove));
  };

  /** Handle keyboard events */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill(inputValue);
    }
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeSkill(value[value.length - 1]);
    }
  };

  /** Handle clicks outside for blur */
  const handleClickOutside = (e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setIsFocused(false);
      if (inputValue.trim()) addSkill(inputValue);
    }
  };

  // Attach / detach click outside listener
  useState(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  });

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Selected skills */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((skill) => (
            <div
              key={skill}
              className="flex items-center gap-1 bg-info/10 text-info px-3 py-1 rounded-full text-sm font-medium"
            >
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="text-primary hover:text-info transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input + Add */}
      <div className="relative">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={
              value.length === 0
                ? 'Add skills (React, TypeScript, etc.)'
                : 'Add another skill...'
            }
            className="shadow-none rounded-sm border focus-visible:ring-0"
          />

          <Button
            type="button"
            onClick={() => addSkill(inputValue)}
            disabled={!inputValue.trim()}
            className="bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 disabled:bg-gray-400"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Suggestions */}
        {isFocused && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur
                  addSkill(suggestion);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b last:border-b-0"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick suggestions */}
      {inputValue.trim() === '' && (
        <div className="flex flex-wrap gap-2">
          {['React', 'JavaScript', 'TypeScript', 'Node.js', 'Python'].map(
            (skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => addSkill(skill)}
                disabled={value.includes(skill)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  value.includes(skill)
                    ? 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {skill} +
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};