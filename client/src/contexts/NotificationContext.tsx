'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  clearReadNotifications,
  deleteNotificationById,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationApiItem,
} from '@/lib/api/notificationsApi';
import { joinQuestion } from '@/lib/api/questionApi';

const getRoleFromCookie = (): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )role=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
};

const navigateAfterJoin = (
  router: ReturnType<typeof useRouter>,
  questionId: number,
  sessionId: number | null | undefined
) => {
  const role = getRoleFromCookie();
  if (role === 'learner') {
    router.push(`/chat/${questionId}`);
    return;
  }
  if (sessionId != null) {
    router.push(`/sessions/${sessionId}`);
  }
};

export interface Notification {
  id: string;
  type: 'message' | 'reminder' | 'achievement' | 'system' | 'study';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  questionId?: number | null;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (
    notification: Omit<Notification, 'id' | 'timestamp'>
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllRead: () => void;
  handleAcceptInvite: (questionId: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

const mapNotificationType = (notificationType: string): Notification['type'] => {
  if (
    notificationType === 'message_replied' ||
    notificationType === 'message_announcement'
  ) {
    return 'message';
  }

  if (notificationType === 'streak_announcement') {
    return 'achievement';
  }

  if (notificationType === 'question_announcement' || notificationType === 'question_answered') {
    return 'study';
  }

  if (
    notificationType === 'helper_joined' ||
    notificationType === 'helper_left' ||
    notificationType === 'helper_removed' ||
    notificationType === 'helper_announcement'
  ) {
    return 'reminder';
  }

  return 'system';
};

const mapPriority = (notificationType: string): Notification['priority'] => {
  if (notificationType === 'helper_removed' || notificationType === 'message_replied') {
    return 'high';
  }
  if (notificationType === 'helper_joined' || notificationType === 'question_answered') {
    return 'medium';
  }
  return 'low';
};

const toRelativeTime = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Just now';

  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 60) return 'Just now';
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const mapApiNotification = (item: NotificationApiItem): Notification => ({
  id: String(item.id),
  type: mapNotificationType(item.notification_type),
  title: item.title,
  message: item.message,
  timestamp: toRelativeTime(item.created_at),
  isRead: item.is_read,
  priority: mapPriority(item.notification_type),
  questionId: item.question_id ?? null,
});

const mapSocketNotification = (raw: {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  question_id?: string | number | null;
}): Notification => ({
  id: String(raw.id),
  type: mapNotificationType(raw.notification_type),
  title: raw.title,
  message: raw.message,
  timestamp: toRelativeTime(raw.created_at),
  isRead: raw.is_read,
  priority: mapPriority(raw.notification_type),
  questionId: raw.question_id != null ? Number(raw.question_id) : null,
});

const getNotificationWebSocketUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  try {
    const parsed = new URL(apiUrl);
    const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${parsed.host}/ws/notifications/`;
  } catch {
    return 'ws://localhost:8000/ws/notifications/';
  }
};

const isInviteNotification = (type: string, questionId?: number | null) =>
  type === 'question_announcement' && questionId != null;

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationIdCounter, setNotificationIdCounter] = useState(1000);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasShownLoadErrorRef = useRef(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const loadNotifications = useCallback(() => {
    getNotifications()
      .then((items) => {
        setNotifications(items.map(mapApiNotification));
        hasShownLoadErrorRef.current = false;
      })
      .catch((error: any) => {
        console.error('Failed to load notifications:', error);

        if (hasShownLoadErrorRef.current) {
          return;
        }

        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          toast.error('Could not load notifications. Your session may have expired.');
        } else {
          toast.error('Could not load notifications right now.');
        }
        hasShownLoadErrorRef.current = true;
      });
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let websocket: WebSocket | null = null;
    let disposed = false;

    const connect = () => {
      if (disposed) return;

      websocket = new WebSocket(getNotificationWebSocketUrl());

      websocket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const socketData = payload?.data;

          if (socketData?.id && socketData?.notification_type) {
            const incoming = mapSocketNotification(socketData);
            setNotifications((prev) => {
              const deduped = prev.filter((item) => item.id !== incoming.id);
              return [incoming, ...deduped];
            });
            const isInvite = isInviteNotification(
              socketData.notification_type,
              incoming.questionId
            );
            toast.success(incoming.title, {
              description: incoming.message,
              action: isInvite
                ? {
                    label: 'Accept',
                    onClick: () => {
                      if (incoming.questionId == null) return;
                      joinQuestion(incoming.questionId)
                        .then((res) => {
                          const sessionId = (res as { session_id?: number }).session_id;
                          navigateAfterJoin(router, incoming.questionId!, sessionId);
                        })
                        .catch(() => {
                          toast.error('Could not join the session.');
                        });
                    },
                  }
                : undefined,
            });
            return;
          }
        } catch {
          // Fall back to API refresh when payload is not in expected format.
        }

        loadNotifications();
      };

      websocket.onclose = () => {
        if (disposed) return;
        reconnectTimeoutRef.current = setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      websocket?.close();
    };
  }, [loadNotifications, router]);

  const addNotification = (
    notification: Omit<Notification, 'id' | 'timestamp'>
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${notificationIdCounter}`,
      timestamp: 'Just now',
    };
    setNotificationIdCounter(prev => prev + 1);
    setNotifications((prev) => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    const numericId = Number(id);
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );

    if (!Number.isNaN(numericId)) {
      markNotificationRead(numericId).catch((error) => {
        console.error('Failed to mark notification as read:', error);
      });
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true }))
    );
    markAllNotificationsRead().catch((error) => {
      console.error('Failed to mark all notifications as read:', error);
    });
  };

  const deleteNotification = (id: string) => {
    const numericId = Number(id);
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );

    if (!Number.isNaN(numericId)) {
      deleteNotificationById(numericId).catch((error) => {
        console.error('Failed to delete notification:', error);
      });
    }
  };

  const clearAllRead = () => {
    setNotifications((prev) =>
      prev.filter((notification) => !notification.isRead)
    );
    clearReadNotifications().catch((error) => {
      console.error('Failed to clear read notifications:', error);
    });
  };

  const handleAcceptInvite = useCallback(
    async (questionId: number) => {
      const res = await joinQuestion(questionId);
      const sessionId = (res as { session_id?: number }).session_id;
      navigateAfterJoin(router, questionId, sessionId);
    },
    [router]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllRead,
        handleAcceptInvite,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }
  return context;
}
