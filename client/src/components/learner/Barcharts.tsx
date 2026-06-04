'use client';

import { MessageSquare, TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useHelperSessionsChartQuery } from '@/query/questionMutation';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { useMinimumLoading } from '@/hooks/use-minimum-loading';

const chartConfig = {
  sessions: {
    label: 'Sessions',
    color: 'var(--primary)',
  },
  label: {
    color: 'var(--background)',
  },
} satisfies ChartConfig;

export function TotalSessionsChart() {
  const { data, isLoading } = useHelperSessionsChartQuery();
  const showSkeleton = useMinimumLoading(isLoading);

  const sessionData = data?.sessions ?? [];
  const periodLabel = data?.period_label ?? 'Last 6 months';
  const trendPercentage = data?.trend_percentage ?? 0;
  const hasSessionData = sessionData.some((item) => item.sessions > 0);

  return (
    <Card className="w-full max-w-2xl *:font-sans border-0 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-rubik font-semibold">
          <MessageSquare className="h-5 w-5 text-primary" />
          Total Sessions
        </CardTitle>
        <CardDescription>{periodLabel}</CardDescription>
      </CardHeader>
      <CardContent>
        {showSkeleton ? (
          <Skeleton className="h-[280px] w-full rounded-lg" />
        ) : hasSessionData ? (
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={sessionData}
              layout="vertical"
              margin={{ right: 16 }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="month"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
                hide
              />
              <XAxis dataKey="sessions" type="number" hide />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Bar dataKey="sessions" fill="var(--color-sessions)" radius={4}>
                <LabelList
                  dataKey="month"
                  position="insideLeft"
                  offset={8}
                  className="fill-white"
                  fontSize={12}
                />
                <LabelList
                  dataKey="sessions"
                  position="right"
                  offset={8}
                  className="fill-foreground"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
            No sessions yet.
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        {hasSessionData ? (
          <div className="flex gap-2 leading-none font-medium">
            Trending by {Math.abs(trendPercentage).toFixed(2)}% this month
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
        ) : (
          <div className="leading-none font-medium text-muted-foreground">
            No session activity yet.
          </div>
        )}
        <div className="text-muted-foreground leading-none">
          Based on total chat sessions over the latest months
        </div>
      </CardFooter>
    </Card>
  );
}
