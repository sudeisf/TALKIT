'use client';

import {
  LayoutDashboard,
  Inbox,
  Bookmark,
  CircleQuestionMark,
  LogOut,
  Bell,
  Settings,
  Briefcase,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import logo from './../../public/svg/logo.svg';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { logoutUser } from '@/lib/api/authApi';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { action as authAction } from '@/redux/slice/authSlice';

export function AppSidebar() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const role = useAppSelector((state) => state.auth.user?.role);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const items = useMemo(() => {
    const isHelper = role === 'helper';
    return [
      {
        title: 'Dashboard',
        url: isHelper ? '/dashboard' : '/learner-dashboard',
        icon: LayoutDashboard,
      },
      {
        title: isHelper ? 'Browse Questions' : 'My Questions',
        url: isHelper ? '/questions' : '/my-questions',
        icon: isHelper ? Briefcase : CircleQuestionMark,
      },
      {
        title: 'Active Chats',
        url: '/chat',
        icon: Inbox,
      },
      {
        title: 'Notifications',
        url: '/notifications',
        icon: Bell,
      },
      {
        title: 'Bookmarks',
        url: '/bookmarks',
        icon: Bookmark,
      },
    ];
  }, [role]);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logoutUser();
      dispatch(authAction.clearAuth());
      dispatch(authAction.clearEmail());
      router.replace('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-sidebar text-sidebar-foreground flex h-full flex-col justify-between">
        <SidebarGroup>
          <div className="flex p-3 gap-2 pl-6 group-data-[collapsible=icon]:p-3 group-data-[collapsible=icon]:pl-3 group-data-[collapsible=icon]:justify-center">
            <Image
              src={logo}
              alt=""
              width={32}
              height={32}
              className="dark:brightness-0 dark:invert group-data-[collapsible=icon]:w-[2.15rem] group-data-[collapsible=icon]:h-[2.15rem]"
            />
            <h1 className="text-lg font-sans text-sidebar-foreground rounded-full group-data-[collapsible=icon]:hidden">
              Talkit
            </h1>
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="p-4 space-y-2 mt-4 group-data-[collapsible=icon]:px-2.5 group-data-[collapsible=icon]:py-3 group-data-[collapsible=icon]:space-y-3">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    className="font-sans space-x-2 group-data-[collapsible=icon]:h-[2.65rem] group-data-[collapsible=icon]:w-[2.65rem] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:p-0 [&>svg]:group-data-[collapsible=icon]:h-[1.35rem] [&>svg]:group-data-[collapsible=icon]:w-[1.35rem]"
                    tooltip={item.title}
                    asChild
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span className="font-normal group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarFooter className="p-6 ml-2 group-data-[collapsible=icon]:p-3 group-data-[collapsible=icon]:ml-0 group-data-[collapsible=icon]:space-y-3">
          <Link
            className="flex items-center gap-2 group-data-[collapsible=icon]:h-[2.65rem] group-data-[collapsible=icon]:w-[2.65rem] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:p-0 hover:bg-sidebar-accent"
            href={role === 'helper' ? '/helper-settings' : '/settings'}
          >
            <Settings className="w-4 h-4 group-data-[collapsible=icon]:w-[1.3rem] group-data-[collapsible=icon]:h-[1.3rem]" />
            <span className="group-data-[collapsible=icon]:hidden">Settings</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center font-sans font-medium gap-2 disabled:opacity-60 disabled:cursor-not-allowed group-data-[collapsible=icon]:h-[2.65rem] group-data-[collapsible=icon]:w-[2.65rem] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:p-0 hover:bg-sidebar-accent"
          >
            <LogOut className="w-4 h-4 group-data-[collapsible=icon]:w-[1.3rem] group-data-[collapsible=icon]:h-[1.3rem]" />
            <span className="group-data-[collapsible=icon]:hidden">
              {isLoggingOut ? 'logging out...' : 'logout'}
            </span>
          </button>
        </SidebarFooter>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
