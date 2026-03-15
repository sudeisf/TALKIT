import API from './axiosInstance';
import axios from 'axios';
import {
  HelperContributionsResponse,
  CreateQuestionPayload,
  HelperDashboardStatsResponse,
  LearnerDashboardStatsResponse,
  HelperProfileOverviewResponse,
  HelperSessionsChartResponse,
  JoinQuestionResponse,
  ModifyDescriptionPayload,
  ModifyDescriptionResponse,
  MyQuestionItem,
  ChatSessionListItem,
  ChatSessionDetailResponse,
  QuestionFeedItem,
  QuestionResponse,
  RecentActivityResponse,
  VoteQuestionResponse,
} from '@/types/question';

export const createQuestion = async (payload: CreateQuestionPayload) => {
  const response = await API.post<QuestionResponse>('/questions/create/', payload, {
    withCredentials: true,
  });
  return response.data;
};

export const modifyQuestionDescription = async (payload: ModifyDescriptionPayload) => {
  const response = await API.post<ModifyDescriptionResponse>(
    '/questions/modify-description/',
    payload,
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const getMyQuestions = async () => {
  const response = await API.get<MyQuestionItem[]>('/questions/my/', {
    withCredentials: true,
  });
  return response.data;
};

export const getHelperDashboardStats = async () => {
  const response = await API.get<HelperDashboardStatsResponse>(
    '/questions/helper-dashboard-stats/',
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const getLearnerDashboardStats = async () => {
  const response = await API.get<LearnerDashboardStatsResponse>(
    '/questions/learner-dashboard-stats/',
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const getHelperSessionsChart = async () => {
  const response = await API.get<HelperSessionsChartResponse>(
    '/questions/helper-sessions-chart/',
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const getHelperContributions = async () => {
  const response = await API.get<HelperContributionsResponse>(
    '/questions/helper-contributions/',
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const getHelperProfileOverview = async () => {
  const response = await API.get<HelperProfileOverviewResponse>(
    '/questions/helper-profile-overview/',
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const getQuestionFeed = async () => {
  const response = await API.get<QuestionFeedItem[] | { results: QuestionFeedItem[] }>(
    '/questions/feed/',
    {
      withCredentials: true,
    }
  );

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return response.data.results || [];
};

export const getRecentActivity = async (limit = 8) => {
  const response = await API.get<RecentActivityResponse>('/questions/recent-activity/', {
    params: { limit },
    withCredentials: true,
  });
  return response.data;
};

export const joinQuestion = async (questionId: number) => {
  const response = await API.post<JoinQuestionResponse>(
    `/questions/${questionId}/join/`,
    {},
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const voteQuestion = async (questionId: number, voteType: 'UP' | 'DOWN') => {
  const response = await API.post<VoteQuestionResponse>(
    `/questions/${questionId}/vote/`,
    {
      vote_type: voteType,
    },
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const toggleQuestionBookmark = async (questionId: number) => {
  const response = await API.post<{ is_favorite: boolean }>(
    `/questions/${questionId}/bookmark/`,
    {},
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const getChatSessions = async (searchQuery?: string) => {
  try {
    const response = await API.get<ChatSessionListItem[]>('/chat/sessions/', {
      params: searchQuery ? { q: searchQuery } : undefined,
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      // If backend route is unavailable or no list endpoint yet, show empty state.
      if (statusCode === 404 || statusCode === 405) {
        return [];
      }
    }
    throw error;
  }
};

export const getChatSessionDetail = async (sessionId: number) => {
  const response = await API.get<ChatSessionDetailResponse>(`/chat/sessions/${sessionId}/`, {
    withCredentials: true,
  });
  return response.data;
};
