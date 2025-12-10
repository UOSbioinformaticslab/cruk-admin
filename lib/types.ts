export interface User {
  id: number;
  name: string;
  firstname?: string;
  lastname?: string;
  email: string;
  secondary_email?: string;
  preferred_email?: string;
  provider?: string;
  sector_id?: number;
  organisation?: string;
  bio?: string;
  domain?: string;
  link?: string;
  orcid?: string;
  contact_feedback?: boolean;
  contact_news?: boolean;
  roles?: Role[];
  teams?: Team[];
  notifications?: Notification[];
  created_at?: string;
  updated_at?: string;
}

export interface Team {
  id: number;
  name: string;
  enabled: boolean;
  allows_messaging?: boolean;
  workflow_enabled?: boolean;
  access_requests_management?: boolean;
  uses_5_safes?: boolean;
  is_admin?: boolean;
  member_of?: string;
  contact_point?: string;
  is_question_bank?: boolean;
  is_provider?: boolean;
  url?: string;
  introduction?: string;
  service?: string;
  users?: User[];
  notifications?: Notification[];
  aliases?: Alias[];
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: number;
  name: string;
  full_name?: string;
  enabled: boolean;
  permissions?: Permission[];
  created_at?: string;
  updated_at?: string;
}

export interface Permission {
  id: number;
  role?: string;
  allowed_from_apps?: number;
  description?: string;
}

export interface CancerTypeFilter {
  id: number;
  filter_id: string;
  label: string;
  category?: string;
  primary_group?: string;
  count?: string;
  parent_id?: number;
  level: number;
  sort_order?: number;
  children?: CancerTypeFilter[];
}

export interface Alias {
  id: number;
  name: string;
}

export interface Notification {
  id: number;
  name?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

