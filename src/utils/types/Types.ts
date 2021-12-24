export interface Pagination
{
  lastId: string | null;
  count: number;
}

export interface QueryField
{
  limit?: number;
  lastId?: string;
  lastItem?: any;
  sortBy?: string;
  ascend?: -1 | 1;
}