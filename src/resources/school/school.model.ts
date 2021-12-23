import { ObjectId } from 'mongodb';

interface School
{
  _id?: ObjectId;
  name: string;
}

export default School;