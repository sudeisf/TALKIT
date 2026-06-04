'use client';

import AskedTopicsTimeline from '@/components/learner/ActiveSessions';

import { TotalSessionsChart } from '@/components/learner/Barcharts';
import GreetingCard from '@/components/learner/GreetingCard';
import SummaryCard from '@/components/learner/SummeryCards';
import { SkeletonDashboard } from '@/components/ui/skeleton';
import { useMinimumLoading } from '@/hooks/use-minimum-loading';
import { useLearnerDashboardStatsQuery } from '@/query/questionMutation';
import { Clock, Bookmark, CheckCircle, MessageSquare } from 'lucide-react';

export default function DashBoard() {
  const { data, isLoading } = useLearnerDashboardStatsQuery();
  const showSkeleton = useMinimumLoading(isLoading);

  if (showSkeleton) {
    return (
      <div className="w-full max-w-6xl mx-auto min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
        <SkeletonDashboard />
      </div>
    );
  }

  const questionsPosted = Math.round(data?.questions_posted.value ?? 0);
  const questionsPostedChange = data?.questions_posted.change ?? 0;

  const savedSummaries = Math.round(data?.saved_summaries.value ?? 0);
  const savedSummariesChange = data?.saved_summaries.change ?? 0;

  const problemsSolved = Math.round(data?.problems_solved.value ?? 0);
  const problemsSolvedChange = data?.problems_solved.change ?? 0;

  const activeSessions = Math.round(data?.active_sessions.value ?? 0);
  const activeSessionsChange = data?.active_sessions.change ?? 0;

  return (
    <div className="w-full max-w-6xl mx-auto min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <GreetingCard btnName="Ask Questions" name="sudeis" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <SummaryCard
          percentage={questionsPostedChange}
          title="Questions Posted"
          value={questionsPosted}
          icon={<MessageSquare size={20} />}
        />
        <SummaryCard
          percentage={savedSummariesChange}
          title="Saved Summaries"
          value={savedSummaries}
          icon={<Bookmark size={20} />}
          color="text-info"
        />
        <SummaryCard
          percentage={problemsSolvedChange}
          title="Problems Solved"
          value={problemsSolved}
          icon={<CheckCircle size={20} />}
          color="text-success"
        />
        <SummaryCard
          percentage={activeSessionsChange}
          title="Active Sessions"
          value={activeSessions}
          icon={<Clock size={20} />}
          color="text-warning"
        />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AskedTopicsTimeline />
        <TotalSessionsChart />
      </div>
    </div>
  );
}
