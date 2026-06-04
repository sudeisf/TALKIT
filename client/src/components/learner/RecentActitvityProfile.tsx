'use client';

import { Clock, MessageCircle, TrendingUp } from 'lucide-react';

interface TimelineQuestion {
  id: string;
  title: string;
  status: 'ongoing' | 'answered' | 'closed';
  timeAgo: string;
  answerCount: number;
  upvotes: number;
}

interface RecentQuestionsTimelineProps {
  questions: TimelineQuestion[];
}

export function RecentQuestionsTimelineProfile({
  questions,
}: RecentQuestionsTimelineProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'bg-info/10 text-info border-info/20';
      case 'answered':
        return 'bg-success/10 text-success dark:bg-success/15 dark:text-success';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="w-full lg:w-2/4 bg-background border-border p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold mb-2">Recent Activity</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Latest questions and updates
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="relative">
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
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(question.status)}`}
                >
                  {question.status}
                </span>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 mr-1" />
                  {question.timeAgo}
                </div>
              </div>

              <h4 className="text-sm font-medium leading-tight mb-2 sm:mb-3 hover:text-primary cursor-pointer transition-colors line-clamp-2">
                {question.title}
              </h4>

              <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <MessageCircle className="w-3 h-3 mr-1" />
                  {question.answerCount} answers
                </div>
                <div className="flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {question.upvotes} upvotes
                </div>
              </div>
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
