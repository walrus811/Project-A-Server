import { ObjectId } from 'mongodb';
import { QueryField } from 'src/utils/types/Types';

export interface Lecture
{
  _id: ObjectId;
  name: string;
  startDate: Date;
  endDate: Date;
}