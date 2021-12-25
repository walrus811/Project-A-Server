import { ObjectId } from 'mongodb';

export interface VocaCategory
{
  _id: ObjectId;
  name: string;
  subCategories: string[];
  vocaList: Voca[];
}

export interface Voca
{
  spell: string;
  meaning: string;
  subCategory: string;
  synonums: string;
}