'use client';

import { Archive, BookOpen, Star, User } from 'lucide-react';
import { Button } from '../ui/button';

export type ChatTabKey = 'active' | 'all' | 'favorites' | 'archived';

type ChatTabsProps = {
  activeTab: ChatTabKey;
  counts: Record<ChatTabKey, number>;
  onTabChange: (tab: ChatTabKey) => void;
};

const tabs: Array<{ key: ChatTabKey; title: string; icon: typeof BookOpen }> = [
  { key: 'active', title: 'Active', icon: BookOpen },
  { key: 'all', title: 'All', icon: User },
  { key: 'favorites', title: 'Favorites', icon: Star },
  { key: 'archived', title: 'Archived', icon: Archive },
];

export default function ChatTabs({ activeTab, counts, onTabChange }: ChatTabsProps) {
  return (
    <div
      className="flex min-w-0 shrink-0 overflow-x-auto overflow-y-hidden border-b px-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab, index) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        const count = counts[tab.key] ?? 0;

        return (
          <Button
            key={`tab-${index}`}
            variant="ghost"
            onClick={() => onTabChange(tab.key)}
            className={`relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-none border-b-2 px-4 py-3 text-sm font-medium transition-colors
              ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
          >
            <Icon className="w-5 h-5" />
            {tab.title}
            {count > 0 && (
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {count}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
