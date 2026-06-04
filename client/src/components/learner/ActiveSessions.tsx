'use client';

import { ArrowRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useMyQuestionsQuery } from '@/query/questionMutation';
import { useRouter } from 'next/navigation';
import { SkeletonListItem } from '@/components/ui/skeleton';
import { useMinimumLoading } from '@/hooks/use-minimum-loading';

interface AskedTopic {
  id: number;
  title: string;
  time: string;
  dateKey: string;
  dateLabel: string;
  tags: string[];
}

const DEFAULT_VISIBLE_ITEMS = 3;

export default function AskedTopicsTimeline() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: myQuestions = [], isLoading } = useMyQuestionsQuery();
  const showSkeleton = useMinimumLoading(isLoading);
  const router = useRouter();

  const toDateKey = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'unknown';
    return date.toISOString().slice(0, 10);
  };

  const toDateLabel = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown date';
    return date
      .toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
      .toUpperCase();
  };

  const toTimeLabel = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const mappedTopics = useMemo<AskedTopic[]>(() => {
    return [...myQuestions]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .map((question) => ({
        id: question.id,
        title: question.title,
        time: toTimeLabel(question.created_at),
        dateKey: toDateKey(question.created_at),
        dateLabel: toDateLabel(question.created_at),
        tags: question.tags || [],
      }));
  }, [myQuestions]);

  const visibleTopics = isOpen
    ? mappedTopics
    : mappedTopics.slice(0, DEFAULT_VISIBLE_ITEMS);

  const groupedTopics = useMemo(() => {
    const byDate = new Map<string, { date: string; topics: AskedTopic[] }>();

    visibleTopics.forEach((topic) => {
      if (!byDate.has(topic.dateKey)) {
        byDate.set(topic.dateKey, { date: topic.dateLabel, topics: [] });
      }
      byDate.get(topic.dateKey)?.topics.push(topic);
    });

    return Array.from(byDate.values());
  }, [visibleTopics]);

  const hasOlder = mappedTopics.length > DEFAULT_VISIBLE_ITEMS;

  return (
    <div className="w-full p-4">
      {showSkeleton && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonListItem key={index} />
          ))}
        </div>
      )}

      {!showSkeleton && groupedTopics.length === 0 && (
        <p className="text-sm text-muted-foreground">
          You have not created a question yet.
        </p>
      )}

      {!showSkeleton && groupedTopics.map((section, i) => (
        <div key={i}>
          <div className="ps-2 my-2">
            <h3 className="text-xs font-medium uppercase text-muted-foreground">
              {section.date}
            </h3>
          </div>

          {section.topics.map((topic, index) => {
            const isLastInSection = index === section.topics.length - 1;
            return (
            <div key={topic.id} className="flex gap-x-3">
              <div className="relative after:absolute after:top-7 after:bottom-0 after:start-3.5 after:w-px after:-translate-x-[0.5px] after:bg-border">
                <div className="z-10 size-7 flex justify-center items-center">
                  <div className="size-2 rounded-full bg-warning"></div>
                </div>
                {isLastInSection && <div className="absolute bottom-0 start-3.5 w-px h-0" />}
              </div>

              <div className="grow pb-8">
                <h3 className="text-md font-sans font-medium text-foreground">
                  {topic.title}
                </h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {topic.time}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {topic.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="bg-muted text-muted-foreground text-sm font-medium px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/chat/${topic.id}`)}
                  className="flex items-center gap-1 mt-2 text-sm text-primary font-medium decoration-2 hover:underline focus:outline-none focus:underline font-sans"
                >
                  Continue Sessions
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )})}
        </div>
      ))}

      {/* Show older */}
      {!showSkeleton && hasOlder && (
      <div className="ps-2 -ms-px flex gap-x-3">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-start inline-flex items-center gap-x-1 text-sm text-primary font-medium decoration-2 hover:underline focus:outline-none focus:underline"
        >
          <svg
            className="shrink-0 size-3.5"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
          {isOpen ? 'Hide older' : 'Show older'}
        </button>
      </div>
      )}
    </div>
  );
}
