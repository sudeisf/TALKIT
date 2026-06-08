'use client';

import { useState, useMemo } from 'react';
import {
  Bookmark,
  Search,
  Trash2,
  Share2,
  Eye,
  Calendar,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBookmarksQuery, useToggleBookmarkMutation } from '@/query/questionMutation';
import { format } from 'date-fns';
import Link from 'next/link';

export default function BookmarksPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: bookmarks, isLoading } = useBookmarksQuery();
  const toggleBookmark = useToggleBookmarkMutation();

  const groupedBookmarks = useMemo(() => {
    if (!bookmarks) return [];

    const filtered = bookmarks.filter((b) =>
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groups: { [date: string]: typeof bookmarks } = {};
    filtered.forEach((b) => {
      const dateKey = format(new Date(b.created_at), 'd MMM, yyyy');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(b);
    });

    return Object.entries(groups).map(([date, topics]) => ({
      date,
      topics,
    }));
  }, [bookmarks, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2  rounded-lg">
            <Bookmark className="h-6 w-6 text-ornage-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bookmarks</h1>
            <p className="text-gray-600">Your saved questions and resources</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className=" text-warning text-sm p-2 rounded-full capitalize"
        >
          {bookmarks?.length || 0} bookmarks
        </Badge>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search bookmarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Bookmarks Timeline */}
      <div className="space-y-6">
        {groupedBookmarks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bookmark className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No bookmarks found
              </h3>
              <p className="text-gray-600 text-center">
                Start bookmarking questions and resources you want to save for
                later.
              </p>
            </CardContent>
          </Card>
        ) : (
          groupedBookmarks.map((section, i) => (
            <div key={section.date}>
              <div className="ps-2 my-4">
                <h3 className="text-sm font-medium uppercase text-gray-500">
                  {section.date}
                </h3>
              </div>

              <div className="space-y-4">
                {section.topics.map((topic, index) => (
                  <div key={topic.id} className="flex gap-x-3">
                    {/* Timeline column */}
                    <div className="relative flex flex-col items-center">
                      {/* Dot */}
                      <div className="w-3 h-3 rounded-full bg-red-600 z-10 mt-2"></div>

                      {/* Vertical line (except for last item) */}
                      {index < section.topics.length - 1 && (
                        <div className="absolute top-5 bottom-0 w-px bg-gray-200"></div>
                      )}
                    </div>

                    {/* Card column */}
                    <div className="grow pb-8">
                      <Card className="shadow-none border-none">
                        <CardContent className=" p-2 rounded-sm ">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {topic.title}
                                </h3>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-info/10 text-info border-info/20"
                                >
                                  question
                                </Badge>
                              </div>

                              {topic.description && (
                                <p className="text-gray-600 mb-3 text-sm line-clamp-2">
                                  {topic.description}
                                </p>
                              )}

                              <div className="flex items-center gap-4 mb-3">
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <Calendar className="h-4 w-4" />
                                  {format(new Date(topic.created_at), 'p')}
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 mb-4">
                                {(topic.tags as string[]).map((tag, i) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="bg-gray-50 text-gray-600 border-gray-200 text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>

                              <div className="flex items-center gap-2">
                                <Link href={`/chat/${topic.id}`}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1"
                                  >
                                    <Eye className="h-4 w-4" />
                                    View
                                  </Button>
                                </Link>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-1"
                                >
                                  <Share2 className="h-4 w-4" />
                                  Share
                                </Button>
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => toggleBookmark.mutate(topic.id)}
                              disabled={toggleBookmark.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
