'use client';

import { Archive, BookOpen, Star, User } from 'lucide-react';
import { Button } from '../ui/button';

export type SessionTabKey = 'active' | 'all' | 'favorites' | 'archived';

type SessionTabsProps = {
  activeTab: SessionTabKey;
  counts: Record<SessionTabKey, number>;
  onTabChange: (tab: SessionTabKey) => void;
};

const tabs: Array<{
  key: SessionTabKey;
  title: string;
  icon: typeof BookOpen;
}> = [
  { key: 'active', title: 'Active', icon: BookOpen },
  { key: 'all', title: 'All', icon: User },
  { key: 'favorites', title: 'Favorites', icon: Star },
  { key: 'archived', title: 'Archived', icon: Archive },
];

export default function SessionTabs({
  activeTab,
  counts,
  onTabChange,
}: SessionTabsProps) {
  return (
    <div
      className="flex border border-border rounded-lg mt-4 overflow-x-auto items-center gap-4 px-2 bg-background"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {tabs.map((tab, index) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        const count = counts[tab.key] ?? 0;

        return (
          <Button
            key={`tab-${index}`}
            variant="ghost"
            onClick={() => onTabChange(tab.key)}
            className={`relative flex items-center gap-2 rounded-none border-b-2 px-4 py-3 text-sm font-medium transition-colors
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
