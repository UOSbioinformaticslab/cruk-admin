import type { User } from './user';

export interface Alias {
  id: number;
  name: string;
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
  notifications?: { id: number; name?: string }[];
  aliases?: Alias[];
  created_at?: string;
  updated_at?: string;
}
