'use client';

import { Clock, Bookmark, UserPlus, HelpCircle, TrendingUp } from 'lucide-react';
import { RecentActivityItem } from '@/types/question';

interface RecentQuestionsTimelineProps {
  questions: RecentActivityItem[];
}

export function RecentQuestionsTimelineProfile({
  questions,
}: RecentQuestionsTimelineProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'question_asked':
        return <HelpCircle className="w-3 h-3" />;
      case 'helper_joined':
        return <UserPlus className="w-3 h-3" />;
      case 'bookmark_added':
        return <Bookmark className="w-3 h-3" />;
      case 'upvote_given':
        return <TrendingUp className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getActivityLabel = (type: string) => {
    if (!type) return 'Activity';
    return type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'searching':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'ongoing':
        return 'bg-info/10 text-info border-info/20';
      case 'answered':
        return 'bg-success/10 text-success dark:bg-success/15 dark:text-success';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="w-full lg:w-2/4 bg-background border-border p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold mb-2">Recent Activity</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Latest updates from your journey
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {questions.map((item, index) => (
          <div key={item.id || index} className="relative">
            {/* Timeline line */}
            {index < questions.length - 1 && (
              <div className="absolute left-3 sm:left-4 top-6 sm:top-8 w-px h-12 sm:h-16 bg-border" />
            )}

            {/* Timeline dot */}
            <div className="absolute left-1 sm:left-2 top-1 sm:top-2 w-3 h-3 sm:w-4 sm:h-4 bg-primary rounded-full border-2 border-background" />

            {/* Content */}
            <div className="ml-6 sm:ml-8 pb-3 sm:pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                <span
                  className={`px-2 py-0.5 text-[10px] font-medium rounded-full flex items-center gap-1 ${
                    item.status ? getStatusColor(item.status) : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {getActivityIcon(item.type)}
                  {getActivityLabel(item.type)}
                </span>
                <div className="flex items-center text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3 mr-1" />
                  {item.timeAgo}
                </div>
              </div>

              <h4 className="text-sm font-medium leading-tight mb-1 hover:text-primary cursor-pointer transition-colors line-clamp-2">
                {item.description || item.title}
              </h4>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border">
        <button className="text-xs sm:text-sm text-primary hover:underline">
          View all activity →
        </button>
      </div>
    </div>
  );
}
