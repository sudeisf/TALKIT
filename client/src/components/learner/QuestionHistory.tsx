'use client';
import { QuestionCard } from './questionCards';
import { ScrollArea } from '../ui/scroll-area';
import { useMyQuestionsQuery, useVoteQuestionMutation, useToggleBookmarkMutation } from '@/query/questionMutation';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HistoryOfQuestions() {
  const { data: questions, isLoading } = useMyQuestionsQuery();
  const voteMutation = useVoteQuestionMutation();
  const bookmarkMutation = useToggleBookmarkMutation();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  const handleTitleClick = (id: string) => {
    router.push(`/chat/${id}`);
  };

  const handleContinueClick = (id: string) => {
    router.push(`/chat/${id}`);
  };

  const handleBookmarkToggle = (id: string) => {
    bookmarkMutation.mutate(Number(id));
  };

  const handleUpvote = (id: string) => {
    voteMutation.mutate({ questionId: Number(id), voteType: 'UP' });
  };

  const handleDownvote = (id: string) => {
    voteMutation.mutate({ questionId: Number(id), voteType: 'DOWN' });
  };

  return (
    <div className="space-y-4 w-full mb-5">
      <ScrollArea className="h-fit w-full p-2">
        <div className="space-y-4">
          {questions && questions.length > 0 ? (
            questions.map((q) => (
              <QuestionCard
                key={q.id}
                id={q.id.toString()}
                title={q.title}
                description={q.description}
                tags={q.tags}
                status={q.status}
                createdDate={new Date(q.created_at).toLocaleDateString()}
                lastActivity={new Date(q.updated_at).toLocaleDateString()}
                upvotes={q.upvotes}
                downvotes={q.downvotes}
                userVote={q.my_vote?.toLowerCase() as 'up' | 'down' | null}
                isBookmarked={q.is_bookmarked}
                continueHref={`/chat/${q.id}`}
                onTitleClick={handleTitleClick}
                onContinueClick={handleContinueClick}
                onBookmarkToggle={handleBookmarkToggle}
                onUpvote={handleUpvote}
                onDownvote={handleDownvote}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No questions found.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
