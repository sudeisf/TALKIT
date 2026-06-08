'use client';

import { Clock, MessageCircle, TrendingUp, Bookmark, UserPlus, HelpCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RecentActivityItem } from '@/types/question';

interface RecentQuestionsTimelineProps {
  questions: RecentActivityItem[];
  allQuestions?: RecentActivityItem[];
}

export function RecentQuestionsTimeline({
  questions,
  allQuestions,
}: RecentQuestionsTimelineProps) {
  const modalQuestions = allQuestions ?? questions;

  const getActivityIcon = (type: string) => {
    if (!type) return <Clock className="w-3 h-3" />;
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

  const renderActivityItem = (
    item: RecentActivityItem,
    index: number,
    isLast: boolean,
    isModal = false
  ) => (
    <div key={`${isModal ? 'modal' : 'timeline'}-${item.id}-${index}`} className="relative">
      {!isLast && (
        <div
          className={`absolute left-4 top-8 w-px ${isModal ? 'h-14 bg-border/50' : 'h-16 bg-border'}`}
        />
      )}

      <div className="absolute left-2 top-2 w-4 h-4 bg-primary rounded-full border-2 border-background" />

      <div className="ml-8 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`px-2 py-1 text-[10px] font-medium rounded-full flex items-center gap-1 bg-white/20 text-white`}
          >
            {getActivityIcon(item.type)}
            {getActivityLabel(item.type)}
          </span>
          <div className={`flex items-center text-xs ${isModal ? 'text-muted-foreground' : 'text-primary-foreground'}`}>
            <Clock className="w-3 h-3 mr-1" />
            {item.timeAgo}
          </div>
        </div>

        <h4
          className={`text-sm font-medium leading-tight mb-1 transition-colors ${
            isModal ? 'text-foreground' : 'text-primary-foreground'
          }`}
        >
          {item.description || item.title}
        </h4>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-primary/90  border-l rounded-md shadow-sm  border-border p-6">
      <div className="mb-6">
        <h3 className="text-lg text-primary-foreground font-semibold mb-2">Recent Activity</h3>
        <p className="text-sm text-primary-foreground">
          Latest updates from your journey
        </p>
      </div>

      <div className="space-y-6">
        {questions.map((item, index) =>
          renderActivityItem(item, index, index === questions.length - 1)
        )}
      </div>

      {modalQuestions.length > questions.length && (
        <div className="mt-6 pt-4 border-t border-border">
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-sm text-primary-foreground hover:underline">
                View all activity →
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>All Activities</DialogTitle>
                <DialogDescription>
                  Complete timeline of your recent activities.
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="max-h-[65vh] pr-3">
                <div className="space-y-4">
                  {modalQuestions.length > 0 ? (
                    modalQuestions.map((item, index) =>
                      renderActivityItem(
                        item,
                        index,
                        index === modalQuestions.length - 1,
                        true
                      )
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">
                      No activity found yet.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
