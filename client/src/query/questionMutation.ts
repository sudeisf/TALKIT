import { useMutation, useQuery } from '@tanstack/react-query';
import {
  createQuestion,
  getHelperContributions,
  getHelperDashboardStats,
  getLearnerDashboardStats,
  getHelperProfileOverview,
  getHelperSessionsChart,
  getChatSessions,
  getChatSessionDetail,
  getMyQuestions,
  getQuestionFeed,
  getRecentActivity,
  getBookmarks,
  joinQuestion,
  modifyQuestionDescription,
  toggleQuestionBookmark,
  voteQuestion,
} from '@/lib/api/questionApi';
import { getTags } from '@/lib/api/authApi';
import { CreateQuestionPayload, ModifyDescriptionPayload } from '@/types/question';
import { queryClient } from './queryClient';

export const useCreateQuestionMutation = () => {
  return useMutation({
    mutationKey: ['create-question'],
    mutationFn: (payload: CreateQuestionPayload) => createQuestion(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['my-questions'] }),
        queryClient.invalidateQueries({ queryKey: ['chat-sessions'] }),
      ]);
    },
  });
};

export const useModifyQuestionDescriptionMutation = () => {
  return useMutation({
    mutationKey: ['modify-question-description'],
    mutationFn: (payload: ModifyDescriptionPayload) =>
      modifyQuestionDescription(payload),
  });
};

export const useMyQuestionsQuery = () => {
  return useQuery({
    queryKey: ['my-questions'],
    queryFn: getMyQuestions,
  });
};

export const useHelperDashboardStatsQuery = () => {
  return useQuery({
    queryKey: ['helper-dashboard-stats'],
    queryFn: getHelperDashboardStats,
  });
};

export const useLearnerDashboardStatsQuery = () => {
  return useQuery({
    queryKey: ['learner-dashboard-stats'],
    queryFn: getLearnerDashboardStats,
  });
};

export const useHelperSessionsChartQuery = () => {
  return useQuery({
    queryKey: ['helper-sessions-chart'],
    queryFn: getHelperSessionsChart,
  });
};

export const useHelperContributionsQuery = () => {
  return useQuery({
    queryKey: ['helper-contributions'],
    queryFn: getHelperContributions,
  });
};

export const useHelperProfileOverviewQuery = () => {
  return useQuery({
    queryKey: ['helper-profile-overview'],
    queryFn: getHelperProfileOverview,
  });
};

export const useQuestionFeedQuery = () => {
  return useQuery({
    queryKey: ['question-feed'],
    queryFn: getQuestionFeed,
  });
};

export const useRecentActivityQuery = (limit = 8) => {
  return useQuery({
    queryKey: ['recent-activity', limit],
    queryFn: () => getRecentActivity(limit),
  });
};

export const useBookmarksQuery = () => {
  return useQuery({
    queryKey: ['bookmarks'],
    queryFn: getBookmarks,
  });
};

export const useTagsQuery = () => {
  return useQuery({
    queryKey: ['tags'],
    queryFn: getTags,
  });
};

export const useJoinQuestionMutation = () => {
  return useMutation({
    mutationKey: ['join-question'],
    mutationFn: (questionId: number) => joinQuestion(questionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['question-feed'] });
    },
  });
};

export const useVoteQuestionMutation = () => {
  return useMutation({
    mutationKey: ['vote-question'],
    mutationFn: ({ questionId, voteType }: { questionId: number; voteType: 'UP' | 'DOWN' }) =>
      voteQuestion(questionId, voteType),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['question-feed'] }),
        queryClient.invalidateQueries({ queryKey: ['my-questions'] }),
      ]);
    },
  });
};

export const useToggleBookmarkMutation = () => {
  return useMutation({
    mutationKey: ['toggle-bookmark'],
    mutationFn: (questionId: number) => toggleQuestionBookmark(questionId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['question-feed'] }),
        queryClient.invalidateQueries({ queryKey: ['my-questions'] }),
        queryClient.invalidateQueries({ queryKey: ['chat-sessions'] }),
        queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
      ]);
    },
  });
};

export const useChatSessionsQuery = (searchQuery: string) => {
  return useQuery({
    queryKey: ['chat-sessions', searchQuery],
    queryFn: () => getChatSessions(searchQuery.trim() || undefined),
  });
};

export const useChatSessionDetailQuery = (sessionId: number) => {
  return useQuery({
    queryKey: ['chat-session-detail', sessionId],
    queryFn: () => getChatSessionDetail(sessionId),
    enabled: Number.isFinite(sessionId) && sessionId > 0,
  });
};
