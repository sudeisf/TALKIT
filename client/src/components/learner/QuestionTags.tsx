'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { X, Loader2 } from 'lucide-react';
import { useTagsQuery } from '@/query/questionMutation';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from '@/components/ui/select';

interface QuestionTagsProps {
  value?: string[];
  onChange?: (tags: string[]) => void;
}

export function QuestionTags({ value = [], onChange }: QuestionTagsProps) {
  const { data: tags, isLoading } = useTagsQuery();

  const handleAdd = (name: string) => {
    if (!value.includes(name)) {
      onChange?.([...value, name]);
    }
  };

  const handleRemove = (name: string) => {
    onChange?.(value.filter((tag) => tag !== name));
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading tags...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Select dropdown */}
      <Select onValueChange={handleAdd}>
        <SelectTrigger className="w-[200px]">
          <span>
            {value.length > 0 ? `Selected (${value.length})` : 'Select tags'}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Available Tags</SelectLabel>
            {tags
              ?.filter((tag: any) => !value.includes(tag.name))
              .map((tag: any) => (
                <SelectItem key={tag.id} value={tag.name}>
                  {tag.name}
                </SelectItem>
              ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <div className="flex flex-wrap gap-2">
        {value.map((tagLabel) => (
          <Badge
            key={tagLabel}
            variant="secondary"
            className="flex items-center gap-1 py-1 rounded-full shadow-2xs text-sm"
          >
            {tagLabel}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => handleRemove(tagLabel)}
            />
          </Badge>
        ))}
      </div>
    </div>
  );
}
