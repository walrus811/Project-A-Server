import { ObjectId } from 'mongodb';

export interface Lecture
{
  _id: ObjectId;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
}