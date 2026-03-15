'use client';

import { Clock, MessageCircle, TrendingUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  allQuestions?: TimelineQuestion[];
}

export function RecentQuestionsTimeline({
  questions,
  allQuestions,
}: RecentQuestionsTimelineProps) {
  const modalQuestions = allQuestions ?? questions;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'answered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const renderActivityItem = (
    question: TimelineQuestion,
    index: number,
    isLast: boolean,
    isModal = false
  ) => (
    <div key={`${isModal ? 'modal' : 'timeline'}-${question.id}-${index}`} className="relative">
      {!isLast && (
        <div
          className={`absolute left-4 top-8 w-px ${isModal ? 'h-14 bg-border/50' : 'h-16 bg-border'}`}
        />
      )}

      <div className="absolute left-2 top-2 w-4 h-4 bg-[#03624C] rounded-full border-2 border-background" />

      <div className="ml-8 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(question.status)}`}
          >
            {question.status}
          </span>
          <div className={`flex items-center text-xs ${isModal ? 'text-muted-foreground' : 'text-white'}`}>
            <Clock className="w-3 h-3 mr-1" />
            {question.timeAgo}
          </div>
        </div>

        <h4
          className={`text-sm font-medium leading-tight mb-3 transition-colors ${
            isModal ? 'text-foreground hover:text-[#03624C]' : 'text-white hover:text-primary'
          }`}
        >
          {question.title}
        </h4>

        <div className={`flex items-center gap-4 text-xs ${isModal ? 'text-muted-foreground' : 'text-white'}`}>
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
  );

  return (
    <div className="w-full bg-[#03624C]/90  border-l rounded-md shadow-sm  border-border p-6">
      <div className="mb-6">
        <h3 className="text-lg text-white font-semibold mb-2">Recent Activity</h3>
        <p className="text-sm text-white">
          Latest questions and updates
        </p>
      </div>

      <div className="space-y-6">
        {questions.map((question, index) =>
          renderActivityItem(question, index, index === questions.length - 1)
        )}
      </div>

      {modalQuestions.length > questions.length && (
        <div className="mt-6 pt-4 border-t border-border">
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-sm text-white hover:underline">
                View all activity →
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>All Activities</DialogTitle>
                <DialogDescription>
                  Complete timeline of your recent question-related activities.
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="max-h-[65vh] pr-3">
                <div className="space-y-4">
                  {modalQuestions.length > 0 ? (
                    modalQuestions.map((question, index) =>
                      renderActivityItem(
                        question,
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
