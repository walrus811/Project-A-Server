import { ObjectId } from 'mongodb';

export interface User
{
  email: string;
  password: string;
  studentId: ObjectId;
}
