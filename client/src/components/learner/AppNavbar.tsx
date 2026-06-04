// components/app-navbar.tsx
'use client';

import { Menu, Bell, Settings, PlusCircle, Moon, Sun } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { SearchBar } from './searchBar';
import { useNotifications } from '@/contexts/NotificationContext';
import Link from 'next/link';
import AskQuestion from './AskQuestionDialog';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/api/authApi';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  selectThemePreference,
  setTheme,
  type ThemePreference,
} from '@/redux/slice/appearanceSlice';

export function AppNavbar() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectThemePreference);
  const { unreadCount } = useNotifications();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('U');
  const isDarkMode = theme === 'dark';

  const toggleTheme = () => {
    const nextTheme: ThemePreference = isDarkMode ? 'light' : 'dark';
    dispatch(setTheme(nextTheme));
  };

  useEffect(() => {
    getCurrentUser()
      .then((data) => {
        setAvatarUrl(data?.profile_image_url || null);
        const name =
          `${data?.first_name || ''} ${data?.last_name || ''}`.trim() ||
          data?.username ||
          'U';
        setDisplayName(name);
      })
      .catch(() => {
        setAvatarUrl(null);
      });

    const onProfileImageUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ url?: string }>;
      if (customEvent?.detail?.url) {
        setAvatarUrl(customEvent.detail.url);
      }
    };

    window.addEventListener('profile-image-updated', onProfileImageUpdated);
    return () => {
      window.removeEventListener('profile-image-updated', onProfileImageUpdated);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 border-b border-border items-center justify-between bg-background px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger>
          <Button variant="ghost" size="icon">
            <Menu className="h-8 w-8" />
          </Button>
        </SidebarTrigger>
        <SearchBar />
      </div>

      <div className="flex items-center gap-2 max-w-4xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? (
            <Sun className="h-6 w-6 stroke-2" />
          ) : (
            <Moon className="h-6 w-6 stroke-2" />
          )}
        </Button>
        <Button variant="ghost" asChild className="relative">
          <Link href="/notifications">
            <Bell className="h-10 w-10 stroke-2 " />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/settings">
            <Settings className="h-6 w-6 stroke-2" />
          </Link>
        </Button>
        <div className="flex items-center gap-4 px-2">
          <Link href="/profile">
            <Avatar>
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
            </Avatar>
          </Link>

          <div className="w-24">
            {/* <Button variant={"outline"} className="rounded-sm shadow-sm flex border-1   w-full border-orange-600 text-warning"><PlusCircle className="w-10 h-10"/>Ask</Button> */}
            <AskQuestion
              btnChild={
                <Button
                  variant="outline"
                  className="rounded-sm shadow-xs text-md w-24 py-2 flex items-center gap-2 border border-primary text-primary font-medium hover:bg-accent transition"
                >
                  <PlusCircle className="w-5 h-5" />
                  Ask
                </Button>
              }
            />
          </div>
        </div>
      </div>
    </header>
  );
}
