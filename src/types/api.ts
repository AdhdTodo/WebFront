export type FeedbackReaction = "do" | "snooze" | "pass" | "make_smaller" | "capture_only";
export type Reaction = FeedbackReaction;
export type ActionStatus = "active" | "completed" | "aborted";
export type EffortLevel = "quiet" | "gentle" | "neutral" | "tiny" | "nano";

export interface User {
  id: number;
  email: string;
  nickname: string | null;
  email_verified: boolean;
  created_at: string;
}

export interface Session {
  id: number;
  context_note: string | null;
  created_at: string;
}

export interface BrainDump {
  id: number;
  session_id: number;
  raw_text: string;
  created_at: string;
}

export interface Suggestion {
  id: number;
  session_id: number;
  brain_dump_id: number | null;
  parent_suggestion_id: number | null;
  generation_type: "original" | "smaller" | "safety_net";
  source?: "rule_based" | "ai";
  title: string;
  micro_step: string;
  effort_level: EffortLevel;
  created_at: string;
}

export interface Action {
  id: number;
  session_id: number;
  suggestion_id: number | null;
  title: string;
  micro_step: string;
  status: ActionStatus;
  completion_note: string | null;
  abort_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: number;
  user_id: number;
  session_id: number | null;
  action_id: number | null;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  timezone: string;
  location: string | null;
  source: "manual" | "action" | string;
  external_uid: string | null;
  provider: string | null;
  external_id: string | null;
  created_at: string;
  updated_at: string;
}

export type CalendarCandidateType =
  | "fixed_time"
  | "flexible"
  | "deadline_based"
  | "routine"
  | "recovery";
export type CalendarPreferredTimeBlock =
  | "morning"
  | "afternoon"
  | "evening"
  | "night"
  | "anytime";
export type CalendarCandidateLevel = "low" | "medium" | "high";
export type CalendarSplitStrategy = "single_block" | "multiple_blocks" | "tiny_first_step";
export type CalendarCandidateStatus = "proposed" | "accepted" | "rejected" | "scheduled";

export interface CalendarCandidate {
  id: number;
  user_id: number;
  session_id: number;
  suggestion_id: number | null;
  action_id: number | null;
  title: string;
  micro_step: string;
  candidate_type: CalendarCandidateType;
  estimated_minutes: number;
  min_minutes: number;
  max_minutes: number;
  preferred_date: string | null;
  earliest_start_at: string | null;
  latest_end_at: string | null;
  due_at: string | null;
  preferred_time_block: CalendarPreferredTimeBlock;
  energy_level: CalendarCandidateLevel;
  friction_level: CalendarCandidateLevel;
  split_strategy: CalendarSplitStrategy;
  status: CalendarCandidateStatus;
  reason: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarCandidateScheduleResponse {
  candidate: CalendarCandidate;
  event: CalendarEvent;
}

export interface Feedback {
  id: number;
  session_id: number;
  suggestion_id: number | null;
  action_id: number | null;
  reaction: Reaction;
  note: string | null;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
}

export interface HistoryResponse {
  sessions: Session[];
  brain_dumps: BrainDump[];
  actions: Action[];
  feedback: Feedback[];
}

export interface FeedbackResponse {
  feedback: Feedback;
  action_id?: number | null;
  action?: Action | null;
  smaller_suggestions?: Suggestion[];
}
