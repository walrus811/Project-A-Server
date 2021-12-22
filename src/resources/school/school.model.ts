import { ObjectId } from 'mongodb';

interface School
{
  _Id?: ObjectId;
  name: string;
}

export default School;