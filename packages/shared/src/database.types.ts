/**
 * Database types for the Finny Supabase schema.
 * Source of truth is supabase/migrations. After a schema change, regenerate
 * (Supabase "generate TypeScript types") and bring this file in line.
 */
export type UserRole = 'client' | 'admin';
export type AccountStatus = 'pending_approval' | 'active' | 'expired' | 'rejected';
export type AccessPlan = 'paid' | 'vip' | 'family';
/** How long the admin opens access for: 12 = one year (365 days), 2 = two calendar months. */
export type AccessMonths = 12 | 2;

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

export type TransactionType = 'income' | 'expense';
export type RepeatKind = 'recurring' | 'installments';
export type RepeatFrequency = 'weekly' | 'monthly' | 'yearly';

export type UserSettings = {
  user_id: string;
  currency: 'ILS' | 'USD';
  month_start_day: number;
  /** minor units; null = no overall budget */
  overall_budget: number | null;
  daily_reminder_enabled: boolean;
  daily_reminder_time: string;
  purchase_notifications_enabled: boolean;
  updated_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  type: TransactionType;
  /** null for an untouched default category: show the translated default_key */
  name: string | null;
  default_key: string | null;
  icon: string;
  color: string;
  /** minor units; expense categories only */
  monthly_budget: number | null;
  sort_order: number;
  archived: boolean;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  type: TransactionType;
  /** minor units, always positive */
  amount: number;
  description: string;
  /** calendar date, YYYY-MM-DD */
  date: string;
  category_id: string;
  recurring_rule_id: string | null;
  created_at: string;
};

export type RecurringRule = {
  id: string;
  user_id: string;
  kind: RepeatKind;
  type: TransactionType;
  category_id: string;
  description: string;
  amount: number;
  frequency: RepeatFrequency;
  start_date: string;
  end_date: string | null;
  installments_count: number | null;
  occurrences_generated: number;
  active: boolean;
  created_at: string;
};

export type Goal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  icon: string;
  /** Set when the user deleted the goal but kept its deposits. */
  archived_at: string | null;
  created_at: string;
};

export type GoalDeposit = {
  id: string;
  user_id: string;
  goal_id: string;
  amount: number;
  date: string;
  created_at: string;
};

export type CategoryTotal = { category_id: string; type: TransactionType; total: number; count: number };
export type GoalTotal = { goal_id: string; saved: number };

type Table<Row, Required extends keyof Row = never> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
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
      user_settings: Table<UserSettings, 'user_id'>;
      categories: Table<Category, 'type'>;
      transactions: Table<Transaction, 'type' | 'amount' | 'category_id'>;
      recurring_rules: Table<RecurringRule, 'kind' | 'type' | 'category_id' | 'amount' | 'start_date'>;
      goals: Table<Goal, 'name' | 'target_amount'>;
      goal_deposits: Table<GoalDeposit, 'goal_id' | 'amount'>;
    };
    Views: { [_ in never]: never };
    Functions: {
      admin_approve_user: {
        Args: { p_user_id: string; p_plan?: AccessPlan; p_months?: AccessMonths };
        Returns: Profile;
      };
      admin_reject_user: { Args: { p_user_id: string }; Returns: Profile };
      admin_extend_user: { Args: { p_user_id: string; p_months?: AccessMonths }; Returns: Profile };
      admin_set_plan: { Args: { p_user_id: string; p_plan: AccessPlan }; Returns: Profile };
      admin_dashboard_stats: { Args: Record<never, never>; Returns: DashboardStats };
      request_approval: { Args: Record<never, never>; Returns: Profile };
      has_access: { Args: Record<never, never>; Returns: boolean };
      is_admin: { Args: Record<never, never>; Returns: boolean };
      materialize_recurring: { Args: Record<never, never>; Returns: number };
      create_recurring: {
        Args: {
          p_type: TransactionType;
          p_category_id: string;
          p_description: string;
          p_amount: number;
          p_frequency: RepeatFrequency;
          p_start_date: string;
          p_end_date?: string | null;
        };
        Returns: string;
      };
      create_installments: {
        Args: {
          p_type: TransactionType;
          p_category_id: string;
          p_description: string;
          p_total: number;
          p_count: number;
          p_first_date: string;
        };
        Returns: string;
      };
      category_totals: { Args: { p_from: string; p_to: string }; Returns: CategoryTotal[] };
      goal_totals: { Args: Record<never, never>; Returns: GoalTotal[] };
      delete_account: { Args: Record<never, never>; Returns: undefined };
      register_push_token: {
        Args: { p_token: string; p_platform: string; p_language: string; p_subscription_reminders: boolean };
        Returns: undefined;
      };
      unregister_push_token: { Args: { p_token: string }; Returns: undefined };
    };
    Enums: {
      user_role: UserRole;
      account_status: AccountStatus;
      access_plan: AccessPlan;
      transaction_type: TransactionType;
      repeat_kind: RepeatKind;
      repeat_frequency: RepeatFrequency;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
