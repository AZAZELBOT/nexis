export type ProjectRecord = {
  id: string;
  name: string;
  created_at: string;
};

export type ProjectKeyPublicRecord = {
  id: string;
  project_id: string;
  name: string;
  scopes: string[];
  revoked_at: string | null;
  rotated_from: string | null;
  created_at: string;
};

export type ControlMetricsCounters = {
  requests_total: number;
  projects_created: number;
  keys_created: number;
  keys_revoked: number;
  keys_rotated: number;
  tokens_minted: number;
  tokens_denied: number;
};

export type ControlMetricsResponse = {
  started_at: string;
  uptime_seconds: number;
  counters: ControlMetricsCounters;
};

export type MintTokenResponse = {
  token: string;
  claims: {
    project_id: string;
    issued_at: string;
    expires_at: string;
    key_id?: string;
    aud?: string;
  };
};

export type RuntimeAdminMetricsSnapshot = {
  active_connections: number;
  room_count: number;
  transport_messages_in_total: number;
  transport_messages_out_total: number;
  rpc_requests_total: number;
  state_patches_total: number;
  state_resync_total: number;
};

export type RuntimeAdminTotals = {
  connected_sessions: number;
  suspended_sessions: number;
  matchmaking_waiting: number;
};

export type RuntimeAdminRoomSnapshot = {
  id: string;
  room_type: string;
  member_count: number;
  members: string[];
  created_at: string;
  last_activity_at: string;
  last_tick_at: string;
  state?: unknown | null;
};

export type RuntimeAdminSessionRoom = {
  room_id: string;
  room_type: string;
};

export type RuntimeAdminSessionSnapshot = {
  session_id: string;
  project_id: string;
  expires_at: string;
  rooms: RuntimeAdminSessionRoom[];
};

export type RuntimeAdminMatchmakingSnapshot = {
  session_id: string;
  room_type: string;
  size: number;
  enqueued_at: string;
  age_seconds: number;
};

export type RuntimeAdminSnapshot = {
  generated_at: string;
  metrics: RuntimeAdminMetricsSnapshot;
  totals: RuntimeAdminTotals;
  connected_sessions: string[];
  rooms: RuntimeAdminRoomSnapshot[];
  suspended_sessions: RuntimeAdminSessionSnapshot[];
  matchmaking_queue: RuntimeAdminMatchmakingSnapshot[];
};

export type DashboardAuthUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
};

export type DashboardAuthSessionRecord = {
  id: string;
  user_id: string;
  expires_at: string;
};

export type DashboardAuthSession = {
  user: DashboardAuthUser;
  session: DashboardAuthSessionRecord;
};
