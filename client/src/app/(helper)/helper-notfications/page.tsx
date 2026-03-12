'use client';

import { useState } from 'react';
import {
  Bell,
  Check,
  X,
  Clock,
  Info,
  MessageSquare,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  useNotifications,
  type Notification,
} from '@/contexts/NotificationContext';

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'message':
      return <MessageSquare className="h-5 w-5 text-[#03624c]" />;
    case 'achievement':
      return <Check className="h-5 w-5 text-[#03624c]" />;
    case 'reminder':
      return <Clock className="h-5 w-5 text-[#03624c]" />;
    case 'system':
      return <Info className="h-5 w-5 text-[#03624c]" />;
    case 'study':
      return <BookOpen className="h-5 w-5 text-[#03624c]" />;
    default:
      return <Bell className="h-5 w-5 text-[#03624c]" />;
  }
};

const getPriorityColor = (priority: Notification['priority']) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/30';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllRead,
    handleAcceptInvite,
  } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2  rounded-md">
            <Bell className="h-6 w-6 text-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your learning progress
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-sm bg-[#03624c]">
              {unreadCount} unread
            </Badge>
          )}
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={filter === 'all' ? 'default' : 'outline'}
            className={filter === 'all' ? 'bg-[#03624c] text-white hover:bg-[#03624c] shadow-none transition-none' : ' transition-none '}
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            className={filter === 'unread' ? 'bg-[#03624c] text-white hover:bg-[#03624c] shadow-none' : ''}
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </Button>
          <Button
            variant={filter === 'read' ? 'default' : 'outline'}
            size="sm"
            className={filter === 'read' ? 'bg-[#03624c] text-white hover:bg-[#03624c] shadow-none' : ''}
            onClick={() => setFilter('read')}
          >
            Read ({notifications.length - unreadCount})
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
          {notifications.filter((n) => n.isRead).length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAllRead}>
              Clear read
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No notifications
              </h3>
              <p className="text-muted-foreground text-center">
                {filter === 'all'
                  ? "You're all caught up! No notifications at the moment."
                  : filter === 'unread'
                    ? 'No unread notifications.'
                    : 'No read notifications.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-border"></div>

            {filteredNotifications.map((notification, index) => (
              <Card
                key={notification.id}
                className={`transition-all shadow-none duration-200 hover:shadow-xs rounded-sm bg-transparent border-0`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Timeline dot */}
                    <div className="relative z-10 flex-shrink-0">
                      <div className="size-7 flex justify-center items-center">
                        <div
                          className={`size-2 rounded-full ${
                            !notification.isRead ? 'bg-blue-500' : 'bg-muted-foreground/70'
                          }`}
                        ></div>
                      </div>
                    </div>

                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3
                              className={`font-medium ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}
                            >
                              {notification.title}
                            </h3>
                          </div>
                          <p className="text-muted-foreground text-sm mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {notification.timestamp}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-xs ${getPriorityColor(notification.priority)}`}
                            >
                              {notification.priority}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 ml-4">
                          {notification.type === 'study' &&
                            notification.questionId != null && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  handleAcceptInvite(notification.questionId!);
                                }}
                                className="bg-[#03624c] text-white hover:bg-[#024a3a]"
                              >
                                Accept
                              </Button>
                            )}
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Notification Types Legend */}
      <Card className="mt-8 border border-border rounded-sm shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Notification Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">Messages & Updates</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500" />
              <span className="text-sm text-muted-foreground">
                Achievements & Milestones
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-orange-500" />
              <span className="text-sm text-muted-foreground">Reminders & Alerts</span>
            </div>
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-muted-foreground">
                System Notifications
              </span>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-indigo-500" />
              <span className="text-sm text-muted-foreground">Study Progress</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
