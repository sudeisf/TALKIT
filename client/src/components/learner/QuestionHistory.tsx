'use client';
import { QuestionCard } from './questionCards';
import { Tag, TagsFilterSelect } from '@/components/learner/tags-filter-select';
import { QuestionCounterSorter } from './questionCount';
import { ScrollArea } from '../ui/scroll-area';
import { useState } from 'react';
import { PaginationDemo } from './QuestionsPaginations';

const sampleTags: Tag[] = [
  { id: '1', label: 'React' },
  { id: '2', label: 'TypeScript' },
  { id: '3', label: 'Next.js' },
  { id: '4', label: 'Tailwind CSS' },
  { id: '5', label: 'JavaScript' },
  { id: '6', label: 'Node.js' },
  { id: '7', label: 'Python' },
  { id: '8', label: 'Design' },
  { id: '9', label: 'UI/UX' },
  { id: '10', label: 'Frontend' },
  { id: '11', label: 'Backend' },
  { id: '12', label: 'Database' },
];

const sampleQuestions = [
  {
    id: '1',
    title:
      'How to implement server-side rendering with Next.js 14 and TypeScript?',
    description:
      "I'm trying to set up SSR in my Next.js 14 project with TypeScript but running into hydration issues. The components render differently on server and client, causing mismatches and console warnings.",
    contributors: [
      { name: 'Mike Johnson', avatar: '/generic-user-avatar.png' },
      { name: 'Lisa Wang', avatar: '/database-expert.png' },
      { name: 'Tom Brown' },
    ],
    additionalContributors: 24,
    tags: ['Next.js', 'TypeScript', 'SSR'],
    status: 'ongoing' as const,
    createdDate: '2 days ago',
    lastActivity: '1 hour ago',
    answerCount: 3,
    upvotes: 15,
    downvotes: 2,
    userVote: 'up' as const,
    isBookmarked: true,
    user: {
      name: 'Sarah Chen',
      avatar: '/generic-user-avatar.png',
      reputation: 2847,
    },
  },
  {
    id: '2',
    title: 'Best practices for state management in React applications',
    description:
      'Looking for guidance on choosing between Redux, Zustand, and Context API for a medium-sized React app. Need to understand performance implications and when to use each approach.',
    contributors: [
      { name: 'David Lee', avatar: '/database-expert.png' },
      { name: 'Emma Davis' },
      { name: 'Chris Wilson', avatar: '/generic-user-avatar.png' },
    ],
    additionalContributors: 18,
    tags: ['React', 'State Management', 'Redux'],
    status: 'answered' as const,
    createdDate: '1 week ago',
    lastActivity: '3 days ago',
    answerCount: 7,
    upvotes: 28,
    downvotes: 1,
    userVote: null,
    isBookmarked: false,
    user: {
      name: 'Alex Rodriguez',
      avatar: '/database-expert.png',
      reputation: 5432,
    },
  },
  {
    id: '3',
    title: 'Database design patterns for scalable web applications',
    description:
      'Working on a high-traffic web application and need advice on database architecture patterns. Considering microservices with separate databases vs monolithic approach with proper indexing strategies.',
    contributors: [
      { name: 'Rachel Green' },
      { name: 'Kevin Park', avatar: '/generic-user-avatar.png' },
    ],
    additionalContributors: 31,
    tags: ['Database', 'Architecture', 'Performance'],
    status: 'closed' as const,
    createdDate: '2 weeks ago',
    lastActivity: '1 week ago',
    answerCount: 12,
    upvotes: 42,
    downvotes: 5,
    userVote: 'down' as const,
    isBookmarked: true,
    user: {
      name: 'Jordan Kim',
      reputation: 1205,
    },
  },
];

export default function HistoryOfQuestions() {
  const [sortBy, setSortBy] = useState<string>('newest');
  const handleTitleClick = (id: string) => {
    console.log('Navigate to question:', id);
  };

  const handleContinueClick = (id: string) => {
    console.log('Continue question:', id);
  };

  const handleBookmarkToggle = (id: string, bookmarked: boolean) => {
    console.log('Bookmark toggled:', id, bookmarked);
  };

  const handleUpvote = (id: string) => {
    console.log('Upvote question:', id);
  };

  const handleDownvote = (id: string) => {
    console.log('Downvote question:', id);
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    console.log('Sort changed to:', newSortBy);
    // Here you would implement the actual sorting logic
  };

  return (
    <div className="space-y-4 w-full mb-5">
      {/* <QuestionCounterSorter questionCount={sampleQuestions.length} onSortChange={handleSortChange} /> */}
      <ScrollArea className="h-fit w-full p-2">
        <div className="space-y-4">
          {sampleQuestions.length > 0 ? (
            sampleQuestions.map((question) => (
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
              No questions found. Try adjusting your filters.
            </div>
          )}
        </div>
      </ScrollArea>
      <PaginationDemo />
    </div>
  );
}
