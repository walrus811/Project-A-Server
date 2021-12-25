import { ObjectId } from "mongodb";

export interface Pagination
{
  lastId: string | null;
  count: number;
}

export interface QueryField
{
  limit?: number;
  lastId?: string;
  lastItem?: any;//TODO - will be removed
  sortBy?: string;
  ascend?: -1 | 1;
}

export interface ConditionField 
{
  [key: string]: RegExp | string | number | Date;
}