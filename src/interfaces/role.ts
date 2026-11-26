export interface Permission {
  id: number;
  role?: string;
  allowed_from_apps?: number;
  description?: string;
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
