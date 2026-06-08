export interface CreateQuestionPayload {
  title: string;
  description: string;
  tags: string[];
}

export interface QuestionResponse {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

export interface ModifyDescriptionPayload {
  description: string;
}

export interface ModifyDescriptionResponse {
  improved_description: string;
}

export interface MyQuestionItem {
  id: number;
  title: string;
  description: string;
  tags: string[];
  status: 'searching' | 'ongoing' | 'answered' | 'closed';
  created_at: string;
  updated_at: string;
  upvotes: number;
  downvotes: number;
  my_vote?: 'UP' | 'DOWN' | null;
  is_bookmarked?: boolean;
}

export interface DashboardMetric {
  value: number;
  change: number;
}

export interface HelperDashboardStatsResponse {
  questions_answered: DashboardMetric;
  sessions_joined: DashboardMetric;
  average_response_time: DashboardMetric;
  feedback_rating: DashboardMetric;
}

export interface LearnerDashboardStatsResponse {
  questions_posted: DashboardMetric;
  problems_solved: DashboardMetric;
  active_sessions: DashboardMetric;
  saved_summaries: DashboardMetric;
}

export interface HelperMonthlySessionItem {
  month: string;
  sessions: number;
}

export interface HelperSessionsChartResponse {
  period_label: string;
  trend_percentage: number;
  sessions: HelperMonthlySessionItem[];
}

export interface ContributionDayItem {
  date: string;
  count: number;
}

export interface HelperContributionsResponse {
  items: ContributionDayItem[];
}

export interface HelperProfileOverviewResponse {
  helped_learners: number;
  sessions_joined: number;
  ongoing_sessions: number;
  average_response_minutes: number;
}

export interface QuestionFeedItem {
  id: number;
  title: string;
  description: string;
  status: 'searching' | 'ongoing' | 'answered' | 'closed';
  bounty_points: number;
  created_at: string;
  asked_by_username: string;
  asked_by_name?: string | null;
  asked_by_profile_image_url?: string | null;
  participants_preview?: Array<{
    id: number;
    name: string;
    avatar?: string | null;
  }>;
  participants_extra_count?: number;
  is_full: boolean;
  am_i_joined: boolean;
  has_summary: boolean;
  participant_count: number;
  tags: Array<string | number | { id?: number; name?: string }>;
  upvotes: number;
  downvotes: number;
  my_vote: 'UP' | 'DOWN' | null;
  is_bookmarked?: boolean;
}

export interface RecentActivityItem {
  id: number;
  title: string;
  status: 'searching' | 'ongoing' | 'answered' | 'closed';
  timeAgo: string;
  answerCount: number;
  upvotes: number;
}

export interface RecentActivityResponse {
  items: RecentActivityItem[];
}

export interface JoinQuestionResponse {
  message: string;
  session_id: number;
}

export interface VoteQuestionPayload {
  vote_type: 'UP' | 'DOWN';
}

export interface VoteQuestionResponse {
  message: string;
  upvotes: number;
  downvotes: number;
  my_vote: 'UP' | 'DOWN' | null;
}

export interface ChatSessionListItem {
  session_id: number;
  question_id: number;
  title: string;
  description: string;
  status: 'searching' | 'ongoing' | 'answered' | 'closed';
  tags: string[];
  asked_by?: {
    id: number | null;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    profile_image_url?: string | null;
  };
  is_favorite?: boolean;
  participant_count: number;
  is_active: boolean;
  last_message: string | null;
  last_message_at: string | null;
  updated_at: string;
}

export interface ChatSessionMessageItem {
  id: number;
  message_content: string;
  message_type: 'text' | 'image' | 'audio' | 'voice' | 'code' | 'link' | 'document' | 'other';
  code_snippet: string | null;
  file_url: string | null;
  created_at: string;
  sender: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_image_url?: string | null;
  };
  is_mine: boolean;
}

export interface ChatSessionParticipantItem {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  profile_image_url?: string | null;
  role: string;
}

export interface ChatSessionDetailResponse {
  chat_session_id: number;
  current_user_id: number;
  question_id: number;
  asked_by: {
    id: number | null;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    profile_image_url?: string | null;
  };
  title: string;
  description: string;
  status: 'searching' | 'ongoing' | 'answered' | 'closed';
  tags: string[];
  participants: ChatSessionParticipantItem[];
  messages: ChatSessionMessageItem[];
}
