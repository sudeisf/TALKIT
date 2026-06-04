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
  TimerIcon,
  Trash,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/api/authApi';
import { useHelperProfileOverviewQuery } from '@/query/questionMutation';

const userInfo = {
  name: 'Sudeis Fedlu',
  email: 'sudeisfed@gmail.com',
  avatar: 'https://github.com/shadcn.png',
  bio: 'Passionate learner focused on mastering programming and technology. Always eager to explore new concepts and improve my skills.',
  location: 'Addis Ababa, Ethiopia',
  role: 'Software engineer',
  username: 'sudeisfed',
  phone: '+251 912 345 678',
  coverImage:
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1925&q=80',
  skills: ['React', 'Typescript', 'python', 'ML', 'Tailwindcss', 'NodeJs'],
  sessionsJoined: 24,
  ongoingSessions: 3,
  avargeResponseTime: 3.2,
  HelpedLearners: 30,
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

export default function HelperProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const { data: overview } = useHelperProfileOverviewQuery();

  useEffect(() => {
    getCurrentUser()
      .then((data) => {
        setProfile(data);
        setCoverImage(data?.cover_image_url || null);
        setProfileImage(data?.profile_image_url || null);
      })
      .catch((error) => {
        console.error(error?.response?.data || error);
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
  const displayBio = profile?.bio || userInfo.bio;
  const displayRole = profile?.profession || userInfo.role;
  const currentRole = profile?.profession || userInfo.role;
  const displayLocation =
    [profile?.city, profile?.country].filter(Boolean).join(', ') ||
    userInfo.location;
  const displaySkills: string[] = Array.isArray(profile?.tags)
    ? profile.tags
        .map((tag: any) =>
          typeof tag === 'string' ? tag : (tag?.name as string | undefined)
        )
        .filter((name: string | undefined): name is string => Boolean(name))
    : [];

  return (
    <div className="max-w-6xl mx-auto p-4 mb-4 bg-background text-foreground">
      {/* cover image section */}
      <div className="relative h-[200px]">
        <div className="w-full h-full">
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
        <div className="rounded-lg px-4 py-6 w-full border-x border-b border-border bg-card text-card-foreground">
          <div className="absolute bottom-0 top-20 z-10 left-10">
            <Avatar className="w-[150px] h-[150px] border-8 border-background">
              <AvatarImage src={profileImage || userInfo.avatar} />
              <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
            </Avatar>
           
            <UploadProfileImage onUploaded={setProfileImage} />
          </div>

          <div className="flex justify-between">
            <div className="pt-5 space-y-2">
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
                <EditProfile />
                <Link href={'/helper-settings'}>
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
                <h2 className="rounded-full bg-muted text-sm p-2 font-sans capitalize font-medium px-2">
                  {currentRole}
                </h2>
              </div>
              <div className=" flex flex-col items-end gap-2">
                <h1 className="capitalize flex gap-2 items-center text-muted-foreground">
                  skills <Star className="w-4 h-4" />
                </h1>
                <div className="flex flex-wrap gap-2 items-center">
                  {displaySkills.length > 0 ? (
                    displaySkills.map((skill: string, index: number) => (
                      <div key={index}>
                        <p className="bg-muted p-2 text-sm w-fit rounded-full font-sans font-medium text-foreground">
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-border p-4">
            <Card className="shadow-xs border border-border rounded-xl bg-card hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center">
                  <BookOpen className="h-8 w-8 text-primary mb-2" />
                  <h3 className="text-2xl font-bold text-foreground">
                    {overview?.helped_learners ?? userInfo.HelpedLearners}
                  </h3>
                  <p className="text-sm text-muted-foreground">Helped Learners</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xs border border-border rounded-xl bg-card hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center">
                  <User className="h-8 w-8 text-primary mb-2" />
                  <h3 className="text-2xl font-bold text-foreground">
                    {overview?.sessions_joined ?? userInfo.sessionsJoined}
                  </h3>
                  <p className="text-sm text-muted-foreground">Sessions Joined</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xs border border-border rounded-xl bg-card hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center">
                  <Clock className="h-8 w-8 text-primary mb-2" />
                  <h3 className="text-2xl font-bold text-primary">
                    {overview?.ongoing_sessions ?? userInfo.ongoingSessions}
                  </h3>
                  <p className="text-sm text-muted-foreground">Ongoing Sessions</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xs border border-border rounded-xl bg-card hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center">
                  <TimerIcon className="h-8 w-8 text-primary mb-2" />
                  <h3 className="text-2xl font-bold text-foreground">
                    {overview?.average_response_minutes ?? userInfo.avargeResponseTime}{' '}
                    <span className="text-[.96rem]">min</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">Avg. Respone</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="flex flex-row-reverse gap-4 w-full pt-4 mx-auto border-t border-border max-w-6xl">
          <HistoryOfQuestions />
          <RecentQuestionsTimelineProfile questions={timelineQuestions} />
        </div>
      </div>
    </div>
  );
}
