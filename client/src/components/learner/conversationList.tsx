'use client';

import { Dot, MessageCircle, Star } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import ChatTabs from './chatTabs';
import SearchSessions from './sessionSearch';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useChatSessionsQuery } from '@/query/questionMutation';
import { type ChatTabKey } from './chatTabs';

export default function ChatList() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState<ChatTabKey>('active');
  const [favoriteSessionIds, setFavoriteSessionIds] = useState<number[]>([]);
  const { data: sessions = [], isLoading, isError } = useChatSessionsQuery(debouncedSearch);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchValue.trim());
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [searchValue]);

  useEffect(() => {
    const persisted = localStorage.getItem('learner-favorite-sessions');
    if (!persisted) return;

    try {
      const parsed = JSON.parse(persisted);
      if (Array.isArray(parsed)) {
        setFavoriteSessionIds(parsed.filter((value) => Number.isFinite(value)));
      }
    } catch {
      setFavoriteSessionIds([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('learner-favorite-sessions', JSON.stringify(favoriteSessionIds));
  }, [favoriteSessionIds]);

  const activeSessionId = useMemo(() => {
    const match = pathname.match(/^\/chat\/(\d+)/);
    return match ? Number(match[1]) : null;
  }, [pathname]);

  const toRelative = (value: string | null) => {
    if (!value) return 'now';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'now';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
  };

  const isArchivedSession = (session: (typeof sessions)[number]) => {
    return !session.is_active || ['answered', 'closed'].includes(session.status);
  };

  const tabCounts = useMemo(() => {
    const archivedCount = sessions.filter(isArchivedSession).length;
    const allCount = sessions.length;
    const activeCount = allCount - archivedCount;
    const favoritesCount = sessions.filter((session) =>
      favoriteSessionIds.includes(session.session_id)
    ).length;

    return {
      active: activeCount,
      all: allCount,
      favorites: favoritesCount,
      archived: archivedCount,
    } as Record<ChatTabKey, number>;
  }, [sessions, favoriteSessionIds]);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const aTime = new Date(a.last_message_at || a.updated_at || 0).getTime();
      const bTime = new Date(b.last_message_at || b.updated_at || 0).getTime();
      return bTime - aTime;
    });
  }, [sessions]);

  const visibleSessions = useMemo(() => {
    if (activeTab === 'all') return sortedSessions;
    if (activeTab === 'active') return sortedSessions.filter((session) => !isArchivedSession(session));
    if (activeTab === 'archived') return sortedSessions.filter(isArchivedSession);
    return sortedSessions.filter((session) => favoriteSessionIds.includes(session.session_id));
  }, [activeTab, sortedSessions, favoriteSessionIds]);

  const searchedSessions = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase();
    if (!normalized) return visibleSessions;

    return visibleSessions.filter((session) => {
      const haystack = [
        session.title,
        session.description,
        session.last_message || '',
        ...session.tags,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [searchValue, visibleSessions]);

  const toggleFavorite = (sessionId: number) => {
    setFavoriteSessionIds((previous) => {
      if (previous.includes(sessionId)) {
        return previous.filter((id) => id !== sessionId);
      }
      return [...previous, sessionId];
    });
  };

  const getEmptyStateText = () => {
    if (searchValue.trim()) {
      return {
        title: 'No matching sessions',
        description: 'Try another keyword or clear your search.',
      };
    }
    if (activeTab === 'favorites') {
      return {
        title: 'No favorites yet',
        description: 'Tap the star icon on a session to keep it here.',
      };
    }
    if (activeTab === 'archived') {
      return {
        title: 'No archived sessions',
        description: 'Archived conversations will appear here once sessions are closed.',
      };
    }
    return {
      title: 'No chats yet',
      description: 'Ask a question to start your first learning session.',
    };
  };

  const emptyState = getEmptyStateText();

  return (
    <div className="flex h-full w-[30%] min-w-[260px] max-w-[360px] shrink-0 flex-col overflow-hidden border-r border-border bg-background text-foreground">
      <div className="px-4 py-2 border-b">
        <h1 className="text-lg font-medium mb-4 text-primary">Learning Sessions</h1>
        <SearchSessions value={searchValue} onChange={setSearchValue} />
      </div>
      <ChatTabs activeTab={activeTab} counts={tabCounts} onTabChange={setActiveTab} />
      <ScrollArea className="flex-1 min-h-0 [&_[data-slot=scroll-area-scrollbar]]:hidden">
        {isLoading && (
          <div className="p-4 text-sm text-muted-foreground">Loading sessions...</div>
        )}

        {isError && (
          <div className="p-4 text-sm text-red-500">Could not load sessions.</div>
        )}

        {!isLoading && !isError && searchedSessions.length === 0 && (
          <div className="flex min-h-[250px] items-center justify-center p-6">
            <div className="text-center space-y-2 max-w-[260px]">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageCircle className="h-5 w-5" />
              </div>
              <p className="text-foreground font-medium">{emptyState.title}</p>
              <p className="text-sm text-muted-foreground">{emptyState.description}</p>
            </div>
          </div>
        )}

        {searchedSessions.map((session) => {
          const isActive = activeSessionId === session.session_id;
          const isFavorite = favoriteSessionIds.includes(session.session_id);

          return (
            <div
              onClick={() => router.push(`/chat/${session.session_id}`)}
              key={`convo-${session.session_id}`}
              className={`p-4 flex cursor-pointer flex-col gap-2 border-b border-border transition-colors min-w-0 ${
                isActive
                  ? 'bg-card dark:bg-neutral-900/90 border-l-2 border-l-primary'
                  : 'bg-background hover:bg-muted/40'
              }`}
            >
              <div className="flex justify-between">
                <div className="flex gap-2">
                  {session.tags.slice(0, 2).map((tag, index) => (
                    <span
                      key={`tag-${index}`}
                      className="bg-primary/10 text-primary text-sm px-2 rounded-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {toRelative(session.last_message_at || session.updated_at)}
                  </p>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleFavorite(session.session_id);
                    }}
                    className="inline-flex items-center justify-center"
                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        isFavorite
                          ? 'fill-primary text-primary'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                </div>
              </div>
              <h1 className="text-md text-foreground line-clamp-2 break-words">{session.title}</h1>
              <div className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
                <p className="min-w-0 flex-1 truncate">
                  {session.last_message || session.description || 'No messages yet'}
                </p>
                <Dot className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            </div>
          );
        })}
      </ScrollArea>
    </div>
  );
}
