import type { Role } from './role';
import type { Team } from './team';

export interface Notification {
  id: number;
  name?: string;
}

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
  is_admin?: number | boolean;
  roles?: Role[];
  teams?: Team[];
  notifications?: Notification[];
  created_at?: string;
  updated_at?: string;
}
