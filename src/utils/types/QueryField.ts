interface QueryField
{
  limit?: number;
  lastId?: string;
  lastItem? : any;
  sortBy?: string;
  ascend?: -1 | 1;
}

export default QueryField;