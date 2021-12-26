import { ObjectId } from 'mongodb';

export interface Student
{
  _id: ObjectId;
  name: string;
  schoolName: string;
  grade: number;
  phone1: number;
  phone2: number;
  description: string;
  retire: boolean;
  lectureList: LectureInfo[];
}

export interface LectureInfo
{
  lectureId: ObjectId;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  attend: boolean;
  homework: boolean;
  correctTestCount: number;
  wholeTestCount: number;
  description1: string;
  description2: string;
  vocaTestList: TestVoca[];
}

export interface TestVoca
{
  spell: string;
  meaning: string;
  category: ObjectId;
  subCategory: string;
  synonyms: string;
  correctCount: number;
}