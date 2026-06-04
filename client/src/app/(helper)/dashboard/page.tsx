'use client';

import { TotalSessionsChart } from '@/components/learner/Barcharts';
import GreetingCard from '@/components/learner/GreetingCard';
import SummaryCard from '@/components/learner/SummeryCards';
import { ContributionHeatmap } from '@/components/ui/contribution -heatmap';
import { SkeletonDashboard } from '@/components/ui/skeleton';
import { useMinimumLoading } from '@/hooks/use-minimum-loading';
import { useHelperDashboardStatsQuery } from '@/query/questionMutation';
import { Bookmark, CheckCircle, Clock, MessageSquare } from 'lucide-react';

export default function HelperDashboard() {
  const { data, isLoading } = useHelperDashboardStatsQuery();
  const showSkeleton = useMinimumLoading(isLoading);

  if (showSkeleton) {
    return (
      <div className="w-full max-w-7xl mx-auto min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
        <SkeletonDashboard />
      </div>
    );
  }

  const questionsAnswered = data?.questions_answered.value ?? 0;
  const questionsAnsweredChange = data?.questions_answered.change ?? 0;

  const sessionsJoined = data?.sessions_joined.value ?? 0;
  const sessionsJoinedChange = data?.sessions_joined.change ?? 0;

  const averageResponseTime = data?.average_response_time.value ?? 0;
  const averageResponseTimeChange = data?.average_response_time.change ?? 0;

  const feedbackRating = data?.feedback_rating.value ?? 0;
  const feedbackRatingChange = data?.feedback_rating.change ?? 0;

  return (
    <div className="w-full max-w-7xl mx-auto min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <GreetingCard btnName={'Start Helping'} name={'sudeis'} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <SummaryCard
          percentage={questionsAnsweredChange}
          title="Questions Answered"
          value={Math.round(questionsAnswered)}
          icon={<MessageSquare size={20} />}
        />
        <SummaryCard
          percentage={sessionsJoinedChange}
          title="Sessions Joined"
          value={Math.round(sessionsJoined)}
          icon={<Bookmark size={20} />}
          color="text-info"
        />
        <SummaryCard
          percentage={averageResponseTimeChange}
          title="Average Response Time"
          value={Math.round(averageResponseTime)}
          icon={<CheckCircle size={20} />}
          color="text-success"
        />
        <SummaryCard
          percentage={feedbackRatingChange}
          title="Feedback Rating"
          value={Math.round(feedbackRating)}
          icon={<Clock size={20} />}
          color="text-warning"
        />
      </div>

      <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TotalSessionsChart />
        </div>
        <div className="rounded-lg w-full bg-card text-card-foreground p-6 border border-border">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-foreground mb-1">
              Sudeis
            </h2>
            <p className="text-sm text-muted-foreground">
              Daily contribution activity over the years
            </p>
          </div>

          <ContributionHeatmap />

          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-muted" />
              <div className="w-3 h-3 rounded-sm bg-primary/20" />
              <div className="w-3 h-3 rounded-sm bg-primary/40" />
              <div className="w-3 h-3 rounded-sm bg-primary/70" />
              <div className="w-3 h-3 rounded-sm bg-primary" />
            </div>
            <span>More</span>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Tip: Select a year to filter the heat map. Hover a day to see the
            exact contribution count.
          </div>
        </div>
      </div>
    </div>
  );
}
