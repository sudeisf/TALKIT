'use client';

import UploadCoverImage from '@/components/coverImageUpload';
import { EditProfile } from '@/components/EditProfile';
import HistoryOfQuestions from '@/components/learner/QuestionHistory';
import { RecentQuestionsTimelineProfile } from '@/components/learner/RecentActitvityProfile';
import UploadProfileImage from '@/components/ProfileImageEdit';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  BookOpen,
  Bookmark,
  Briefcase,
  Clock,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/api/authApi';
import { SkeletonListItem, SkeletonProfileHeader } from '@/components/ui/skeleton';
import { useMinimumLoading } from '@/hooks/use-minimum-loading';
import { useLearnerDashboardStatsQuery, useRecentActivityQuery } from '@/query/questionMutation';

const fallbackUserInfo = {
  name: 'User',
  avatar: 'https://github.com/shadcn.png',
  totalQuestions: 30,
  sessionsJoined: 24,
  ongoingSessions: 3,
  bookmarksSaved: 18,
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const { data: stats } = useLearnerDashboardStatsQuery();
  const { data: recentActivity } = useRecentActivityQuery(10);
  const showSkeleton = useMinimumLoading(isProfileLoading);

  useEffect(() => {
    getCurrentUser()
      .then((data) => {
        setProfile(data);
        setCoverImage(data?.cover_image_url || null);
        setProfileImage(data?.profile_image_url || null);
      })
      .catch((error) => {
        console.error('Failed to fetch profile:', error?.response?.data || error);
      })
      .finally(() => {
        setIsProfileLoading(false);
      });

    const onProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ profile?: any }>;
      const updated = customEvent?.detail?.profile;
      if (!updated) return;

      setProfile(updated);
      if (updated?.cover_image_url) setCoverImage(updated.cover_image_url);
      if (updated?.profile_image_url) setProfileImage(updated.profile_image_url);
    };

    window.addEventListener('profile-updated', onProfileUpdated);
    return () => window.removeEventListener('profile-updated', onProfileUpdated);
  }, []);

  // Computed display values
  const displayName = 
    `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() ||
    profile?.username ||
    fallbackUserInfo.name;

  const displayBio = profile?.bio || 'Add a bio to your profile';
  const displayRole = profile?.profession || 'Add profession to your profile';
  const displayLocation = 
    [profile?.city, profile?.country].filter(Boolean).join(', ') ||
    'Add location to your profile';

  const displaySkills: string[] = Array.isArray(profile?.tags)
    ? profile.tags
        .map((tag: any) => (typeof tag === 'string' ? tag : tag?.name))
        .filter((name: string | undefined): name is string => Boolean(name))
    : [];

  return (
    <div className="max-w-6xl mx-auto p-4 mb-4 text-foreground">
      {showSkeleton ? (
        <div className="space-y-4">
          <SkeletonProfileHeader />
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonListItem key={index} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cover Image Section */}
          <div className="relative h-[240px] rounded-xl overflow-hidden bg-muted">
            {coverImage ? (
              <img
                src={coverImage}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/10 via-muted to-background" />
            )}

            {/* Upload Cover Button */}
            <div className="absolute top-4 right-4 z-20">
              <UploadCoverImage onUploaded={setCoverImage} />
            </div>

            {/* Profile Picture */}
            <div className="absolute -bottom-16 left-6 z-20">
              <div className="relative">
                <Avatar className="w-[148px] h-[148px] border-[6px] border-background shadow-xl">
                  <AvatarImage src={profileImage || fallbackUserInfo.avatar} />
                  <AvatarFallback className="text-5xl font-medium">
                    {displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-2 right-2">
                  <UploadProfileImage onUploaded={setProfileImage} />
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="pt-16 px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row justify-between gap-6">
              <div className="space-y-3">
                <h1 className="text-3xl font-bold">{displayName}</h1>
                <p className="text-lg text-muted-foreground">{displayRole}</p>
                <p className="text-muted-foreground">{displayLocation}</p>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">Bio</span>
                  </div>
                  <p className="text-muted-foreground max-w-2xl leading-relaxed">
                    {displayBio}
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <EditProfile />
                  <Link href="/settings">
                    <Button variant="outline" className="rounded-full">
                      Settings
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Side Info */}
              <div className="flex flex-col items-start lg:items-end gap-6">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Briefcase className="w-4 h-4" />
                    <span className="font-medium">Current Role</span>
                  </div>
                  <p className="bg-muted px-4 py-2 rounded-full text-sm font-medium capitalize">
                    {displayRole}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">Skills</span>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
                    {displaySkills.length > 0 ? (
                      displaySkills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-muted text-foreground px-4 py-1.5 text-sm rounded-full font-medium"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No skills added yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6">
            <Card className="shadow-sm border border-border rounded-xl hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <BookOpen className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="text-3xl font-bold">
                  {stats?.questions_posted.value || 0}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">Questions Asked</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-border rounded-xl hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <User className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
                <h3 className="text-3xl font-bold">
                  {stats?.problems_solved.value || 0}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">Problems Solved</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-border rounded-xl hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Clock className="h-8 w-8 text-amber-600 mx-auto mb-3" />
                <h3 className="text-3xl font-bold">
                  {stats?.active_sessions.value || 0}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">Active Sessions</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-border rounded-xl hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Bookmark className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="text-3xl font-bold">
                  {stats?.saved_summaries.value || 0}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">Saved Summaries</p>
              </CardContent>
            </Card>
          </div>

          {/* Activity Sections */}
          <div className="flex flex-col lg:flex-row gap-6 px-6">
            <div className="flex-1">
              <HistoryOfQuestions />
            </div>
            <div className="flex-1">
              <RecentQuestionsTimelineProfile 
                questions={recentActivity?.items || []} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}