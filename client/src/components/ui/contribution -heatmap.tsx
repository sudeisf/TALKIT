'use client';

import { useEffect, useState } from 'react';
import HeatMap from '@uiw/react-heat-map';
import { useHelperContributionsQuery } from '@/query/questionMutation';

const HeatMapComponent = HeatMap as any;

interface ContributionData {
  date: string;
  count: number;
}

export function ContributionHeatmap() {
  const [data, setData] = useState<{ date: string; count: number }[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const {
    data: contributionResponse,
    isLoading: loading,
    error,
  } = useHelperContributionsQuery();

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const updateTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Set current year on client side only
    setCurrentYear(new Date().getFullYear());
    setSelectedYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    const contributions: ContributionData[] = contributionResponse?.items ?? [];
    const filledData = fillMissingDates(contributions);
    setData(filledData);
  }, [contributionResponse, currentYear]);

  function fillMissingDates(contributions: ContributionData[]) {
    const startDate = new Date('2020-01-01');
    const endDate = currentYear ? new Date() : new Date('2020-01-01');
    const contributionMap = new Map(
      contributions.map((c) => [c.date, c.count])
    );

    const filledData: { date: string; count: number }[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = `${currentDate.getFullYear()}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}`;
      filledData.push({
        date: dateStr,
        count: contributionMap.get(dateStr) || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return filledData;
  }

  if (!selectedYear || !currentYear) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const years = Array.from(
    { length: currentYear - 2020 + 1 },
    (_, i) => 2020 + i
  ).reverse();

  const filteredData = data.filter((item) => {
    const year = Number.parseInt(item.date.split('/')[0]);
    return year === selectedYear;
  });

  const startDate = new Date(`${selectedYear}-01-01`);
  const endDate =
    selectedYear === currentYear
      ? new Date()
      : new Date(`${selectedYear}-12-31`);

  const totalContributions = filteredData.reduce(
    (sum, item) => sum + item.count,
    0
  );
  const hasContributionData = totalContributions > 0;

  const panelColors = isDarkMode
    ? {
        0: 'var(--muted)',
        2: 'color-mix(in srgb, var(--primary) 24%, transparent)',
        8: 'color-mix(in srgb, var(--primary) 42%, transparent)',
        16: 'color-mix(in srgb, var(--primary) 68%, transparent)',
        24: 'var(--primary)',
      }
    : {
        0: 'var(--muted)',
        2: 'color-mix(in srgb, var(--primary) 18%, var(--background))',
        8: 'color-mix(in srgb, var(--primary) 38%, var(--background))',
        16: 'color-mix(in srgb, var(--primary) 68%, var(--background))',
        24: 'var(--primary)',
      };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading contributions...</div>
      </div>
    );
  }

  if (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch contributions';

    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-primary text-center">
          <div className="font-medium mb-2">Failed to load contributions</div>
          <div className="text-sm text-muted-foreground">{errorMessage}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {totalContributions} contributions in {selectedYear}
          </span>
        </div>
      </div>

      <div className="w-full ">
        <div className="flex w-fit mb-4 flex-row items-center gap-1 border border-border rounded-md p-1 md:sticky md:top-0 md:self-start">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                selectedYear === year
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {year}
            </button>
          ))}
        </div>

        {!hasContributionData && (
          <div className="mb-4 text-sm text-muted-foreground">
            No contributions yet for {selectedYear}.
          </div>
        )}

        <div className="flex-1 overflow-x-auto">
          {hasContributionData ? (
            <HeatMapComponent
              value={filteredData}
              width="100%"
              startDate={startDate}
              endDate={endDate}
              rectSize={14}
              space={2}
              rectProps={{
                rx: 2,
              }}
              legendCellSize={0}
              panelColors={panelColors}
              weekLabels={['', 'Mon', '', 'Wed', '', 'Fri', '']}
              monthLabels={[
                'Jan',
                'Feb',
                'Mar',
                'Apr',
                'May',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Oct',
                'Nov',
                'Dec',
              ]}
            />
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground border border-dashed border-border rounded-md">
              No contributions yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
