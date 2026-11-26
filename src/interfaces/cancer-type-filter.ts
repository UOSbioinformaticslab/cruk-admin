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
