'use client';
import Link from 'next/link';
import Logo from '../../../public/svg/logo.svg';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Bell, LogOut, Moon, Search, Settings, Sun, User } from 'lucide-react';
import { Input } from '../ui/input';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getCurrentUser, logoutUser } from '@/lib/api/authApi';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { selectThemePreference, setTheme } from '@/redux/slice/appearanceSlice';
import { useNotifications } from '@/contexts/NotificationContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const helperSearchRoutes = [
  {
    label: 'Dashboard',
    description: 'Go to helper dashboard',
    route: '/dashboard',
    keywords: ['dashboard', 'home'],
  },
  {
    label: 'Questions',
    description: 'Browse learner questions',
    route: '/questions',
    keywords: ['questions', 'question', 'help'],
  },
  {
    label: 'Sessions',
    description: 'Open active sessions',
    route: '/sessions',
    keywords: ['sessions', 'session', 'chat', 'inbox'],
  },
  {
    label: 'Notifications',
    description: 'View helper notifications',
    route: '/helper-notfications',
    keywords: ['notifications', 'notification', 'alerts'],
  },
  {
    label: 'Settings',
    description: 'Manage helper settings',
    route: '/helper-settings',
    keywords: ['settings', 'setting', 'preferences'],
  },
  {
    label: 'Profile',
    description: 'Open helper profile',
    route: '/helper-profile',
    keywords: ['profile', 'account', 'me'],
  },
];

const Pages = [
  {
    name: 'dashboard',
    url: '/dashboard',
  },
  {
    name: 'questions',
    url: '/questions',
  },
  {
    name: 'sessions',
    url: '/sessions',
  },
  {
    name: 'settings',
    url: '/helper-settings',
  },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { unreadCount } = useNotifications();
  const themePreference = useAppSelector(selectThemePreference);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('U');
  const [searchValue, setSearchValue] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  const trimmedQuery = searchValue.trim();
  const filteredQuickActions = useMemo(() => {
    const query = trimmedQuery.toLowerCase();
    if (!query) return helperSearchRoutes;

    return helperSearchRoutes.filter((entry) => {
      const inKeywords = entry.keywords.some((keyword) => query.includes(keyword));
      const inLabel = entry.label.toLowerCase().includes(query);
      const inDescription = entry.description.toLowerCase().includes(query);
      const inRoute = entry.route.toLowerCase().includes(query);
      return inKeywords || inLabel || inDescription || inRoute;
    });
  }, [trimmedQuery]);

  const resolveSearchRoute = (query: string) => {
    const normalizedQuery = query.toLowerCase();
    const match = helperSearchRoutes.find((entry) =>
      entry.keywords.some((keyword) => normalizedQuery.includes(keyword))
    );
    return match?.route ?? null;
  };

  const navigateAndCloseSearch = (url: string) => {
    router.push(url);
    setIsSearchOpen(false);
  };

  const handleSearchSubmit = () => {
    const query = searchValue.trim();
    if (!query) return;

    if (query.startsWith('/')) {
      navigateAndCloseSearch(query);
      return;
    }

    const route = resolveSearchRoute(query);
    if (route) {
      navigateAndCloseSearch(route);
      return;
    }

    // Fall back to helper question search.
    navigateAndCloseSearch(`/questions?q=${encodeURIComponent(query)}`);
  };

  const isActivePage = (url: string) => {
    if (url === '/dashboard') return pathname === '/dashboard';
    return pathname === url || pathname.startsWith(`${url}/`);
  };

  const isDarkMode =
    themePreference === 'dark';

  const handleThemeToggle = () => {
    dispatch(setTheme(isDarkMode ? 'light' : 'dark'));
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.replace('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!searchContainerRef.current) return;
      if (searchContainerRef.current.contains(event.target as Node)) return;
      setIsSearchOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="flex  justify-between px-4 py-2 ">
      <div className="flex items-center gap-3 ">
        <div className="flex flex-col gap-1 items-center">
          <Image
            alt="Logo"
            src={Logo}
            className="w-7 h-7 dark:brightness-0 dark:invert"
          />
          {/* <p className="font-sans capitalize text-xs ">Talkit</p> */}
        </div>
        <div className="flex gap-4 px-2 font-sans capitalize text-[.92rem] items-center text-muted-foreground">
          {Pages.map((page, index) => (
            <Link
              key={`dash-${index}`}
              href={page.url}
              className={`rounded-md px-2 py-1 transition-colors hover:text-foreground ${
                isActivePage(page.url)
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {page.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <div ref={searchContainerRef} className="relative w-[20rem] md:w-[20rem] lg:w-[20rem]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search questions, tabs, or type /route"
            value={searchValue}
            onChange={(event) => {
              setSearchValue(event.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            onClick={() => setIsSearchOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSearchSubmit();
              }
              if (event.key === 'Escape') {
                setIsSearchOpen(false);
              }
            }}
            className="pl-10 shadow-none border border-border/80 rounded-lg bg-background focus-visible:ring-0 focus-visible:ring-ring"
          />

          {isSearchOpen && (
            <div className="absolute top-full mt-2 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-md z-50 overflow-hidden">
              {filteredQuickActions.slice(0, 5).map((action) => (
                <button
                  key={action.route}
                  type="button"
                  onClick={() => navigateAndCloseSearch(action.route)}
                  className="w-full px-3 py-2 text-left hover:bg-accent transition-colors"
                >
                  <p className="text-sm font-medium">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </button>
              ))}

              {trimmedQuery && (
                <button
                  type="button"
                  onClick={() =>
                    navigateAndCloseSearch(
                      `/questions?q=${encodeURIComponent(trimmedQuery)}`
                    )
                  }
                  className="w-full border-t border-border px-3 py-2 text-left hover:bg-accent transition-colors"
                >
                  <p className="text-sm font-medium">
                    Search questions for "{trimmedQuery}"
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Open helper question results
                  </p>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-4 items-center">
          <button
            type="button"
            onClick={handleThemeToggle}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border bg-background hover:bg-accent transition-colors"
            aria-label="Toggle theme"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Moon className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <Link href={'/helper-notfications'} className="relative">
            <Bell className="w-5 h-5 text-muted-foreground transition-colors hover:text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-primary-foreground text-[10px] rounded-full h-4 min-w-4 px-1 flex items-center justify-center leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="rounded-full">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild>
                <Link href="/helper-profile" className="cursor-pointer">
                  <User className="w-4 h-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/helper-settings" className="cursor-pointer">
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} variant="destructive">
                <LogOut className="w-4 h-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
