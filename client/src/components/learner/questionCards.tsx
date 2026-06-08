'use client';

import { MouseEvent, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Bookmark,
  MessageCircle,
  Calendar,
  Clock,
  Triangle,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/dist/client/link';
import { AvatarFallback, AvatarImage ,Avatar } from '../ui/avatar';

interface QuestionCardProps {
  id: string;
  title: string;
  description?: string;
  contributors?: Array<{
    name: string;
    avatar?: string;
  }>;
  additionalContributors?: number;
  tags: string[];
  status: 'ongoing' | 'answered' | 'closed';
  createdDate: string;
  lastActivity: string;
  answerCount: number;
  upvotes?: number;
  downvotes?: number;
  userVote?: 'up' | 'down' | null;
  isBookmarked?: boolean;
  user?: {
    name: string;
    avatar?: string;
    reputation?: number;
  };
  onTitleClick?: (id: string) => void;
  onContinueClick?: (id: string) => void;
  onBookmarkToggle?: (id: string, bookmarked: boolean) => void;
  onUpvote?: (id: string) => void;
  onDownvote?: (id: string) => void;
  continueHref?: string;
}

const statusConfig = {
  ongoing: {
    label: 'Ongoing',
    className: 'bg-info/10 text-info border-info/20',
  },
  answered: {
    label: 'Answered',
    className:
      'bg-success/10 text-success dark:bg-success/15 dark:text-success',
  },
  closed: {
    label: 'Closed',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  },
};

export function QuestionCard({
  id,
  title,
  description,
  contributors = [],
  additionalContributors = 0,
  tags,
  status,
  createdDate,
  lastActivity,
  answerCount,
  upvotes = 0,
  downvotes = 0,
  userVote = null,
  isBookmarked = false,
  user = { name: 'Anonymous User' },
  onTitleClick,
  onContinueClick,
  onBookmarkToggle,
  onUpvote,
  onDownvote,
  continueHref,
}: QuestionCardProps) {
  const normalizeAvatarUrl = (url?: string | null) => {
    if (!url) return undefined;
    if (/^https?:\/\//i.test(url)) {
      return url.replace(/^http:\/\//i, 'https://');
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const parsed = new URL(apiUrl);
      return `${parsed.origin}${url.startsWith('/') ? url : `/${url}`}`;
    } catch {
      return url;
    }
  };
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [currentVote, setCurrentVote] = useState<'up' | 'down' | null>(
    userVote
  );
  const [voteCount, setVoteCount] = useState(upvotes - downvotes);

  useEffect(() => {
    setBookmarked(isBookmarked);
  }, [isBookmarked]);

  useEffect(() => {
    setCurrentVote(userVote);
    setVoteCount(upvotes - downvotes);
  }, [userVote, upvotes, downvotes]);

  const handleBookmarkClick = () => {
    const newBookmarked = !bookmarked;
    setBookmarked(newBookmarked);
    onBookmarkToggle?.(id, newBookmarked);
  };

  const handleTitleClick = () => {
    onTitleClick?.(id);
  };

  const handleContinueClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (onContinueClick) {
      event.preventDefault();
    }
    onContinueClick?.(id);
  };

  const handleUpvote = () => {
    if (currentVote === 'up') {
      setCurrentVote(null);
      setVoteCount((prev) => prev - 1);
    } else {
      const adjustment = currentVote === 'down' ? 2 : 1;
      setCurrentVote('up');
      setVoteCount((prev) => prev + adjustment);
    }
    onUpvote?.(id);
  };

  const handleDownvote = () => {
    if (currentVote === 'down') {
      setCurrentVote(null);
      setVoteCount((prev) => prev + 1);
    } else {
      const adjustment = currentVote === 'up' ? 2 : 1;
      setCurrentVote('down');
      setVoteCount((prev) => prev - adjustment);
    }
    onDownvote?.(id);
  };

  return (
    <Card className="w-full hover:shadow-xs border rounded-sm shadow-none transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-0.5 shrink-0 py-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'p-1 h-auto hover:bg-transparent',
                currentVote === 'up'
                  ? 'text-primary'
                  : 'text-gray-400 hover:text-primary dark:text-gray-500 dark:hover:text-primary/80'
              )}
              onClick={handleUpvote}
            >
              <Triangle className="h-3 w-3 fill-current" />
            </Button>

            <span
              className={cn(
                'text-xs font-bold px-1 py-0.5 min-w-[24px] text-center',
                voteCount > 0
                  ? 'text-primary'
                  : voteCount < 0
                    ? 'text-primary'
                    : 'text-gray-500 dark:text-gray-400'
              )}
            >
              {voteCount}
            </span>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'p-1 h-auto hover:bg-transparent',
                currentVote === 'down'
                  ? 'text-primary'
                  : 'text-gray-400 hover:text-primary dark:text-gray-500 dark:hover:text-primary'
              )}
              onClick={handleDownvote}
            >
              <Triangle className="h-3 w-3 fill-current rotate-180" />
            </Button>
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className="font-medium font-sans text-lg leading-tight cursor-pointer hover:text-primary dark:hover:text-primary/80 transition-colors line-clamp-2"
              onClick={handleTitleClick}
            >
              {title}
            </h3>

            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                {description}
              </p>
            )}

            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 h-auto shrink-0"
            onClick={handleBookmarkClick}
          >
            <Bookmark
              className={cn(
                'h-4 w-4 transition-colors',
                bookmarked
                  ? 'fill-primary text-primary'
                  : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
              )}
            />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <Badge className={cn('text-xs', statusConfig[status].className)}>
              {statusConfig[status].label}
            </Badge>

            <div className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>
                {answerCount} {answerCount === 1 ? 'answer' : 'answers'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{createdDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{lastActivity}</span>
              </div>
            </div>
          </div>

          <Link
            href={continueHref ?? (onContinueClick ? '#' : '/')}
            onClick={handleContinueClick}
            className="shrink-0 flex text-sm items-center gap-2 hover:text-primary"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {contributors.length > 0 && (
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
              Contributors:
            </span>
            <div className="flex items-center">
              {contributors.slice(0, 3).map((contributor, index) => (
                <div
                  key={index}
                  className="relative -ml-2 first:ml-0"
                  style={{ zIndex: index + 1 }}
                  title={contributor.name}
                >
                  <Avatar className="w-6 h-6 rounded-full ring-2 ring-white dark:ring-gray-800 border">
                    {contributor.avatar ? (
                      <AvatarImage src={normalizeAvatarUrl(contributor.avatar)} alt={contributor.name} loading="lazy" />
                    ) : (
                      <AvatarFallback>{contributor.name.charAt(0).toUpperCase()}</AvatarFallback>
                    )}
                  </Avatar>
                </div>
              ))}
              {additionalContributors > 0 && (
                <div
                  className="relative -ml-2 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ring-2 ring-white dark:ring-gray-800 text-xs font-medium text-gray-600 dark:text-gray-300 border"
                  style={{ zIndex: contributors.length + 1 }}
                  title={`+${additionalContributors} more`}
                >
                  +{additionalContributors}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          

          <Avatar className="w-8 h-8 rounded-full ring-2 ring-white dark:ring-gray-800 border">
            {user.avatar ? (
              <AvatarImage src={normalizeAvatarUrl(user.avatar)} alt={user.name} loading="lazy" />
            ) : null}
            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
          className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate"
          title={user.name}
              >
          {user.name.charAt(0).toUpperCase() + user.name.slice(1)}
              </span>
              {typeof user.reputation === 'number' && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({user.reputation} rep)
          </span>
              )}
            </div>
            {/* optional small meta line for better spacing / context */}
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              Posted by {user.name}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
