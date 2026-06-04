'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Palette, Sun, Moon, Text } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  setFontSize,
  setTheme,
  ThemePreference,
  FontSizePreference,
  selectThemePreference,
  selectFontSizePreference,
} from '@/redux/slice/appearanceSlice';

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

const fontSizeOptions = [
  { value: 'small', label: 'Small', icon: Text },
  { value: 'medium', label: 'Medium', icon: Text },
  { value: 'large', label: 'Large', icon: Text },
];

export default function AppearanceSettings() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectThemePreference);
  const fontSize = useAppSelector(selectFontSizePreference);

  return (
    <Card className="shadow-none border-b border-x-0 border-t-0 rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-info" />
          Appearance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Selection */}
        <div className="space-y-3">
          <Label>Theme</Label>
          <div className="grid grid-cols-2 gap-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() =>
                    dispatch(setTheme(option.value as ThemePreference))
                  }
                  className={cn(
                    'flex flex-col items-center justify-center p-4 border rounded-lg transition hover:shadow-md',
                    theme === option.value
                      ? 'border-primary bg-accent text-accent-foreground'
                      : 'border-border bg-card text-card-foreground'
                  )}
                >
                  <Icon className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Size Selection */}
        <div className="space-y-3">
          <Label>Font Size</Label>
          <div className="grid grid-cols-3 gap-3">
            {fontSizeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() =>
                    dispatch(setFontSize(option.value as FontSizePreference))
                  }
                  className={cn(
                    'flex flex-col items-center justify-center p-4 border rounded-lg transition hover:shadow-md',
                    fontSize === option.value
                      ? 'border-primary bg-accent text-accent-foreground'
                      : 'border-border bg-card text-card-foreground'
                  )}
                >
                  <Icon className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
