export interface Pagination
{
  lastId: string | null;
  count: number;
}

export interface QueryField
{
  limit?: number;
  lastId?: string;
  sortBy?: string;
  ascend?: -1 | 1;
}