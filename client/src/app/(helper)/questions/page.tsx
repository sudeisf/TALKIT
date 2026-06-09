'use client';

import { DateRangePicker } from '@/components/learner/date-range-picker';
import { QuestionCard } from '@/components/learner/questionCards';
import { QuestionCounterSorter } from '@/components/learner/questionCount';
import { RecentQuestionsTimeline } from '@/components/learner/RecentQuestionsTimeline';
import { SelectedTagsDisplay } from '@/components/learner/selected-tag-display';
import { Tag, TagsFilterSelect } from '@/components/learner/tags-filter-select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useJoinQuestionMutation,
  useQuestionFeedQuery,
  useRecentActivityQuery,
  useTagsQuery,
  useToggleBookmarkMutation,
  useVoteQuestionMutation,
} from '@/query/questionMutation';
import { Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function QuestionsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState('');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [sortBy, setSortBy] = useState<string>('newest');
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

  const {
    data: feed = [],
    isLoading: isFeedLoading,
    isError: isFeedError,
  } = useQuestionFeedQuery();
  const { data: recentActivity, isLoading: isRecentLoading } =
    useRecentActivityQuery(100);
  const { data: allTags = [] } = useTagsQuery();
  
  const { mutateAsync: joinQuestion } = useJoinQuestionMutation();
  const { mutateAsync: voteQuestion } = useVoteQuestionMutation();
  const { mutateAsync: toggleBookmark } = useToggleBookmarkMutation();

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

  const normalizedQuestions = useMemo(() => {
    return feed.map((question) => {
      const tags = (question.tags || [])
        .map((tag) => {
          if (typeof tag === 'string') return tag;
          if (typeof tag === 'number') return `tag-${tag}`;
          return tag?.name || (tag?.id ? `tag-${tag.id}` : '');
        })
        .filter(Boolean);

      return {
        id: String(question.id),
        title: question.title,
        description: question.description,
        tags,
        status: question.status,
        createdAt: question.created_at,
        createdDate: toRelative(question.created_at),
        lastActivity: toRelative(question.created_at),
        answerCount: question.participant_count || 0,
        upvotes: question.upvotes || 0,
        downvotes: question.downvotes || 0,
        userVote:
          question.my_vote === 'UP'
            ? ('up' as const)
            : question.my_vote === 'DOWN'
              ? ('down' as const)
              : null,
        isBookmarked: question.is_bookmarked ?? false,
        contributors: (question.participants_preview || []).map((participant) => ({
          name: participant.name,
          avatar: participant.avatar || undefined,
        })),
        additionalContributors: question.participants_extra_count || 0,
        user: {
          name: question.asked_by_name || question.asked_by_username || 'Learner',
          avatar: question.asked_by_profile_image_url || undefined,
        },
      } as const;
    });
  }, [feed]);

  const availableTags = useMemo<Tag[]>(() => {
    return allTags.map((tag: any) => ({
      id: String(tag.id),
      label: tag.name,
    }));
  }, [allTags]);

  const filteredQuestions = useMemo(() => {
    const searched = normalizedQuestions.filter((question) => {
      if (!searchValue.trim()) return true;
      const search = searchValue.toLowerCase();
      return (
        question.title.toLowerCase().includes(search) ||
        question.description.toLowerCase().includes(search)
      );
    });

    if (!selectedTags.length) return searched;

    return searched.filter((question) =>
      selectedTags.every((selectedTag) =>
        question.tags.some((questionTag) =>
          questionTag.toLowerCase().includes(selectedTag.label.toLowerCase())
        )
      )
    );
  }, [normalizedQuestions, searchValue, selectedTags]);

  const sortedQuestions = useMemo(() => {
    const questions = [...filteredQuestions];
    switch (sortBy) {
      case 'oldest':
        return questions.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case 'most-upvoted':
        return questions.sort((a, b) => b.upvotes - a.upvotes);
      case 'most-answered':
      case 'most-active':
        return questions.sort((a, b) => b.answerCount - a.answerCount);
      case 'unanswered':
        return questions.filter((item) => item.answerCount === 0);
      case 'newest':
      default:
        return questions.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  }, [filteredQuestions, sortBy]);

  const timelineQuestions = useMemo(
    () => (recentActivity?.items || []).slice(0, 5),
    [recentActivity]
  );

  const handleTitleClick = (id: string) => {
    void handleContinueClick(id);
  };

  const handleContinueClick = async (id: string) => {
    try {
      const payload = await joinQuestion(Number(id));
      toast.success('Session joined successfully');
      router.push(`/sessions/${payload.session_id}`);
    } catch (error: any) {
      const apiMessage = error?.response?.data?.error;
      toast.error(apiMessage || 'Unable to join this question right now.');
    }
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
    } catch (error: any) {
      const apiMessage = error?.response?.data?.error;
      toast.error(apiMessage || 'Unable to apply upvote right now.');
    }
  };

  const handleDownvote = async (id: string) => {
    try {
      await voteQuestion({ questionId: Number(id), voteType: 'DOWN' });
    } catch (error: any) {
      const apiMessage = error?.response?.data?.error;
      toast.error(apiMessage || 'Unable to apply downvote right now.');
    }
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
  };

  return (
    <div className=" h-full">
      <div className="p-4 max-w-7xl mx-auto space-y-4 ">
        <h1 className="font-sans font-medium text-2xl text-gray-600">
          Questions
        </h1>
        <div className="flex justify-evenly gap-4">
          <div className="w-full max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  updateSearchQuery(searchValue);
                }
              }}
              placeholder="Search questions..."
              className="pl-10"
            />
          </div>
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
        <div className="flex gap-4">
          <div className="space-y-4 w-3/4">
            <QuestionCounterSorter
              questionCount={sortedQuestions.length}
              onSortChange={handleSortChange}
            />
            <ScrollArea className="h-fit w-full p-2">
              <div className="space-y-4">
                {isFeedLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    Loading questions...
                  </div>
                ) : isFeedError ? (
                  <div className="text-center py-8 text-red-500">
                    Could not load question feed. Please refresh or restart backend.
                  </div>
                ) : sortedQuestions.length > 0 ? (
                  sortedQuestions.map((question) => (
                    <QuestionCard
                      key={question.id}
                      {...question}
                      onTitleClick={handleTitleClick}
                      onContinueClick={handleContinueClick}
                      onBookmarkToggle={handleBookmarkToggle}
                      onUpvote={handleUpvote}
                      onDownvote={handleDownvote}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No questions found. Try adjusting your filters or search.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          <div>
            {isRecentLoading ? (
              <div className="text-sm text-gray-500">Loading activity...</div>
            ) : (
              <RecentQuestionsTimeline
                questions={timelineQuestions}
                allQuestions={recentActivity?.items || []}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
