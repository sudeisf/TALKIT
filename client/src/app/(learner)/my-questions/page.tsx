'use client';

import { DateRangePicker } from '@/components/learner/date-range-picker';
import { QuestionCard } from '@/components/learner/questionCards';
import { QuestionCounterSorter } from '@/components/learner/questionCount';
import QuestionSearchBar from '@/components/learner/QuestionSearchBar';
import { RecentQuestionsTimeline } from '@/components/learner/RecentQuestionsTimeline';
import { SelectedTagsDisplay } from '@/components/learner/selected-tag-display';
import { Tag, TagsFilterSelect } from '@/components/learner/tags-filter-select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SkeletonListItem } from '@/components/ui/skeleton';
import { useMinimumLoading } from '@/hooks/use-minimum-loading';
import {
  useMyQuestionsQuery,
  useRecentActivityQuery,
  useTagsQuery,
  useToggleBookmarkMutation,
  useVoteQuestionMutation,
} from '@/query/questionMutation';

import { useEffect, useState, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function MyQuestionPage() {
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [searchValue, setSearchValue] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const { data: myQuestions = [], isLoading } = useMyQuestionsQuery();
  const { data: recentActivity, isLoading: isRecentLoading } = useRecentActivityQuery(10);
  const { data: allTags = [] } = useTagsQuery();
  
  const { mutateAsync: voteQuestion } = useVoteQuestionMutation();
  const { mutateAsync: toggleBookmark } = useToggleBookmarkMutation();
  const showSkeleton = useMinimumLoading(isLoading);

  const availableTags = useMemo(() => {
    return allTags.map((tag: any) => ({
      id: String(tag.id),
      label: tag.name,
    }));
  }, [allTags]);

  const queryFromUrl = (searchParams.get('q') || '').trim();

  useEffect(() => {
    setSearchValue(queryFromUrl);
  }, [queryFromUrl]);

  const updateSearchQuery = (nextValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const normalized = nextValue.trim();

    if (normalized) {
      params.set('q', normalized);
    } else {
      params.delete('q');
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const toRelative = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Just now';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const filteredQuestions = myQuestions.filter((question) => {
    const matchesTags =
      !selectedTags.length ||
      selectedTags.every((selectedTag) =>
        question.tags.some(
          (questionTag) =>
            questionTag.toLowerCase() === selectedTag.label.toLowerCase()
        )
      );

    if (!matchesTags) return false;

    if (!queryFromUrl) return true;

    const normalizedQuery = queryFromUrl.toLowerCase();
    const searchableText = [
      question.title,
      question.description,
      ...question.tags,
      question.status,
    ]
      .join(' ')
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  });

  const sortedQuestions = [...filteredQuestions].sort((a, b) => {
    if (sortBy === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const mappedQuestions = sortedQuestions.map((question) => ({
    id: String(question.id),
    title: question.title,
    description: question.description,
    tags: question.tags,
    status: question.status,
    createdDate: toRelative(question.created_at),
    lastActivity: toRelative(question.updated_at),
    answerCount: 0,
    upvotes: question.upvotes,
    downvotes: question.downvotes,
    userVote:
      question.my_vote === 'UP'
        ? ('up' as const)
        : question.my_vote === 'DOWN'
          ? ('down' as const)
          : null,
    isBookmarked: question.is_bookmarked ?? false,
    user: {
      name: 'you',
    },
  }));

  const handleTitleClick = (id: string) => {
    router.push(`/chat/${id}`);
  };

  const handleContinueClick = (id: string) => {
    router.push(`/chat/${id}`);
  };

  const handleBookmarkToggle = async (id: string) => {
    try {
      await toggleBookmark(Number(id));
    } catch (error: unknown) {
      const apiMessage = (error as { response?: { data?: { error?: string } } })
        ?.response?.data?.error;
      toast.error(apiMessage || 'Unable to update bookmark.');
    }
  };

  const handleUpvote = async (id: string) => {
    try {
      await voteQuestion({ questionId: Number(id), voteType: 'UP' });
    } catch (error: unknown) {
      const apiMessage = (error as { response?: { data?: { error?: string } } })
        ?.response?.data?.error;
      toast.error(apiMessage || 'Unable to apply upvote.');
    }
  };

  const handleDownvote = async (id: string) => {
    try {
      await voteQuestion({ questionId: Number(id), voteType: 'DOWN' });
    } catch (error: unknown) {
      const apiMessage = (error as { response?: { data?: { error?: string } } })
        ?.response?.data?.error;
      toast.error(apiMessage || 'Unable to apply downvote.');
    }
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
  };

  return (
    <div className=" h-full">
      <div className="p-4 max-w-[78rem] mx-auto space-y-4 ">
        <h1 className="font-sans font-semibold text-2xl text-gray-600">
          My Questions
        </h1>
        <div className="flex justify-evenly gap-4">
          <QuestionSearchBar
            value={searchValue}
            onChange={setSearchValue}
            onSubmit={updateSearchQuery}
          />
          <TagsFilterSelect
            tags={availableTags}
            selectedTags={selectedTags}
            onChange={setSelectedTags}
            placeholder="Choose your tech stack..."
            selectedTagsContainerId="questions-page"
          />
          <DateRangePicker />
        </div>
        <div>
          <SelectedTagsDisplay
            containerId="questions-page"
            selectedTags={selectedTags}
            onTagRemove={(tagId) =>
              setSelectedTags(selectedTags.filter((tag) => tag.id !== tagId))
            }
          />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="space-y-4 lg:col-span-3">
            <QuestionCounterSorter
              questionCount={mappedQuestions.length}
              onSortChange={handleSortChange}
            />
            <ScrollArea className="h-fit w-full p-2">
              <div className="space-y-4">
                {showSkeleton ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <SkeletonListItem key={index} />
                    ))}
                  </div>
                ) : mappedQuestions.length > 0 ? (
                  mappedQuestions.map((question) => (
                    <QuestionCard
                      key={question.id}
                      {...question}
                      continueHref={`/chat/${question.id}`}
                      onTitleClick={handleTitleClick}
                      onContinueClick={handleContinueClick}
                      onBookmarkToggle={handleBookmarkToggle}
                      onUpvote={handleUpvote}
                      onDownvote={handleDownvote}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No questions found. Ask your first question.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          <div className="lg:col-span-1">
            {isRecentLoading ? (
              <div className="text-sm text-gray-500">Loading activity...</div>
            ) : (
              <RecentQuestionsTimeline
                questions={(recentActivity?.items || []).slice(0, 5)}
                allQuestions={recentActivity?.items || []}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
