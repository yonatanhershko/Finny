/**
 * Database types for the Finny Supabase schema.
 * Source of truth is supabase/migrations. After a schema change, regenerate
 * (Supabase "generate TypeScript types") and bring this file in line.
 */
export type UserRole = 'client' | 'admin';
export type AccountStatus = 'pending_approval' | 'active' | 'expired' | 'rejected';
export type AccessPlan = 'paid' | 'vip' | 'family';

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: AccountStatus;
  plan: AccessPlan | null;
  approved_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionEvent = {
  id: number;
  user_id: string;
  actor_id: string | null;
  action: 'approve' | 'reject' | 'extend' | 'set_plan' | 'resubmit' | 'expire';
  plan: AccessPlan | null;
  old_expires_at: string | null;
  new_expires_at: string | null;
  created_at: string;
};

export type DashboardStats = {
  total_users: number;
  active_subscribers: number;
  pending_approvals: number;
  expiring_soon: number;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Pick<Profile, 'id' | 'email'> & Partial<Profile>;
        Update: Partial<Profile>;
        Relationships: [];
      };
      subscription_events: {
        Row: SubscriptionEvent;
        Insert: Pick<SubscriptionEvent, 'user_id' | 'action'> & Partial<SubscriptionEvent>;
        Update: Partial<SubscriptionEvent>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      admin_approve_user: { Args: { p_user_id: string; p_plan?: AccessPlan }; Returns: Profile };
      admin_reject_user: { Args: { p_user_id: string }; Returns: Profile };
      admin_extend_user: { Args: { p_user_id: string }; Returns: Profile };
      admin_set_plan: { Args: { p_user_id: string; p_plan: AccessPlan }; Returns: Profile };
      admin_dashboard_stats: { Args: Record<never, never>; Returns: DashboardStats };
      request_approval: { Args: Record<never, never>; Returns: Profile };
      has_access: { Args: Record<never, never>; Returns: boolean };
      is_admin: { Args: Record<never, never>; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
      account_status: AccountStatus;
      access_plan: AccessPlan;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
