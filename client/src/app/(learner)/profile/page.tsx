'use client';
import UploadCoverImage from '@/components/coverImageUpload';
import { EditProfile } from '@/components/EditProfile';
import HistoryOfQuestions from '@/components/learner/QuestionHistory';
import { RecentQuestionsTimelineProfile } from '@/components/learner/RecentActitvityProfile';
import UploadProfileImage from '@/components/ProfileImageEdit';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bookmark,
  BookOpen,
  Briefcase,
  Camera,
  Clock,
  Edit,
  Pen,
  Star,
  Stars,
  Target,
  Trash,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/api/authApi';
import { SkeletonListItem, SkeletonProfileHeader } from '@/components/ui/skeleton';
import { useMinimumLoading } from '@/hooks/use-minimum-loading';

const userInfo = {
  name: 'User',
  email: '',
  avatar: 'https://github.com/shadcn.png',
  bio: '',
  location: '',
  role: '',
  username: '',
  phone: '',
  coverImage:
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1925&q=80',
  skills: ['React', 'Typescript', 'python', 'ML', 'Tailwindcss', 'NodeJs'],
  sessionsJoined: 24,
  ongoingSessions: 3,
  bookmarksSaved: 18,
  totalQuestions: 30,
  level: 8,
  experience: 1250,
  correctAnswers: 200,
};

const timelineQuestions = [
  {
    id: 't1',
    title: 'How to optimize React performance with useMemo?',
    status: 'ongoing' as const,
    timeAgo: '2 min ago',
    answerCount: 1,
    upvotes: 5,
  },
  {
    id: 't2',
    title: 'Best practices for API error handling in Next.js',
    status: 'answered' as const,
    timeAgo: '15 min ago',
    answerCount: 3,
    upvotes: 12,
  },
  {
    id: 't3',
    title: 'TypeScript generic constraints explained',
    status: 'closed' as const,
    timeAgo: '1 hour ago',
    answerCount: 8,
    upvotes: 24,
  },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const showSkeleton = useMinimumLoading(isProfileLoading);

  useEffect(() => {
    getCurrentUser()
      .then((data) => {
        setProfile(data);
        setCoverImage(data?.cover_image_url || null);
        setProfileImage(data?.profile_image_url || null);
      })
      .catch((error) => {
        console.error(error?.response?.data || error);
      })
      .finally(() => {
        setIsProfileLoading(false);
      });

    const onProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ profile?: any }>;
      const updated = customEvent?.detail?.profile;
      if (!updated) return;

      setProfile(updated);
      if (updated?.cover_image_url) {
        setCoverImage(updated.cover_image_url);
      }
      if (updated?.profile_image_url) {
        setProfileImage(updated.profile_image_url);
      }
    };

    window.addEventListener('profile-updated', onProfileUpdated);
    return () => {
      window.removeEventListener('profile-updated', onProfileUpdated);
    };
  }, []);

  const displayName =
    `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() ||
    profile?.username ||
    userInfo.name;
  const displayBio = profile?.bio || 'Add bio to your profile';
  const displayRole = profile?.profession || 'Add profession to your profile';
  const currentRole = profile?.profession || 'Add profession to your profile';
  const displayLocation =
    [profile?.city, profile?.country].filter(Boolean).join(', ') ||
    'Add location to your profile';
  const displaySkills: string[] = Array.isArray(profile?.tags)
    ? profile.tags
        .map((tag: any) =>
          typeof tag === 'string' ? tag : (tag?.name as string | undefined)
        )
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
      <>
      {/* cover image section */}
      <div className="relative h-[200px]  ">
        <div className="w-full h-full ">
          {coverImage ? (
            <div className="relative w-full h-full rounded-t-md overflow-hidden bg-muted">
              <img
                src={coverImage}
                alt="cover image"
                className="block w-full h-full object-cover"
                style={{ objectFit: 'cover' }}
              />
              <div className="absolute top-4 right-4">
                <UploadCoverImage onUploaded={setCoverImage} />
              </div>
            </div>
          ) : (
            <div className="w-full h-full rounded-t-md bg-primary flex justify-end p-4">
            <UploadCoverImage onUploaded={setCoverImage} />
          </div>
          )}
        </div>

        {/* profile Card */}
        <div className="  rounded-lg px-4 py-6 w-full border-b ">
          <div className="absolute bottom-0  top-22 z-10 left-10 ">
            <Avatar className="w-[150px] h-[150px] border-8 border-background">
              <AvatarImage src={profileImage || userInfo.avatar} />
              <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <UploadProfileImage onUploaded={setProfileImage} />
          </div>

          <div className="flex justify-between">
            <div className="pt-5  space-y-2">
              <h1 className="text-2xl font-sans font-bold">{displayName}</h1>
              <p className="text-md text-muted-foreground">{displayRole}</p>
              <p className="text-md text-muted-foreground">{displayLocation}</p>
              <div>
                <h1 className="text-md py-2 font-medium flex items-center gap-2 text-foreground">
                  Bio <Pen className="w-4 h-4" />
                </h1>
                <p className="text-md text-muted-foreground max-w-md leading-relaxed">
                  {displayBio}
                </p>
              </div>
              <div className="flex gap-2">
               <EditProfile/> 
                <Link href={'/settings'}>
                  <Button
                    variant={'outline'}
                    className="border-primary border p-5 text-md text-primary rounded-full mt-2 shadow-xs "
                  >
                    Settings
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-2 justify-between">
              <div className="flex flex-col items-end gap-2">
                <h1 className="font-sans text-md flex text-muted-foreground gap-2 w-fit">
                  Current role <Briefcase className="w-4 h-4" />
                </h1>
                <h2 className="rounded-full bg-muted text-foreground text-sm p-2 font-sans capitalize font-medium px-2">
                  {currentRole}
                </h2>
              </div>
              <div className=" flex flex-col items-end gap-2">
                <h1 className="capitalize flex gap-2 items-center text-muted-foreground">
                  skills <Star className="w-4 h-4" />
                </h1>
                <div className="flex flex-wrap gap-2 items-">
                  {displaySkills.length > 0 ? (
                    displaySkills.map((skill: string, index: number) => (
                      <div key={index}>
                        <p className="bg-muted text-foreground p-2 text-sm w-fit rounded-full font-sans font-medium">
                          {skill}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No skills added yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6 mt-4">
          {/*<Card className="shadow-none rounded-xl border-0 bg-white/95 p-2 ">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-warning" />
                  Level Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-md font-medium text-gray-600">Level {userInfo.level}</span>
                    <span className="text-md text-gray-500">{userInfo.experience} / {nextLevelExp} XP</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-orange-400 to-red-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${progressToNextLevel}%` }}
                    ></div>
                  </div>
                  <p className="text-md text-gray-500">
                    {nextLevelExp - userInfo.experience} XP needed for next level
                  </p>
                </div>
              </CardContent>
            </Card>
            */}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t p-4">
            <Card className="shadow-xs border border-border rounded-xl bg-card hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center">
                  <BookOpen className="h-8 w-8 text-primary mb-2" />
                  <h3 className="text-2xl font-bold text-foreground">
                    {userInfo.totalQuestions}
                  </h3>
                  <p className="text-sm text-muted-foreground">Questions Asked</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xs border border-border rounded-xl bg-card hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center">
                  <User className="h-8 w-8 text-success mb-2" />
                  <h3 className="text-2xl font-bold text-foreground">
                    {userInfo.sessionsJoined || 24}
                  </h3>
                  <p className="text-sm text-muted-foreground">Sessions Joined</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xs border border-border rounded-xl bg-card hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center">
                  <Clock className="h-8 w-8 text-warning mb-2" />
                  <h3 className="text-2xl font-bold text-foreground">
                    {userInfo.ongoingSessions || 3}
                  </h3>
                  <p className="text-sm text-muted-foreground">Ongoing Sessions</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xs border border-border rounded-xl bg-card hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center">
                  <Bookmark className="h-8 w-8 text-info mb-2" />
                  <h3 className="text-2xl font-bold text-foreground">
                    {userInfo.bookmarksSaved || 18}
                  </h3>
                  <p className="text-sm text-muted-foreground">Bookmarks Saved</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="flex flex-row-reverse gap-4 w-full pt-4 mx-auto border-t  max-w-6xl">
          <HistoryOfQuestions />
          <RecentQuestionsTimelineProfile questions={timelineQuestions} />
        </div>
      </div>
    </div>
  );
}
