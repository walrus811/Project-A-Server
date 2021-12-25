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
  lectureList: StudentLecture[];
  vocaTestList: StudentVocaTest[];
}

export interface StudentLecture
{
  lectureId: ObjectId;
  attend: boolean;
  homework: boolean;
  correctTestCount: number;
  wholeTestCount: number;
  description1: string;
  description2: string;
}

export interface StudentVocaTest
{
  startDate: Date;
  endDate: Date;
  lectureId: ObjectId;
  attend: boolean;
  homework: boolean;
  correctTestCount: number;
  wholeTestCount: number;
  description1: string;
  description2: string;
  vocaList: TestVoca[];
}

export interface TestVoca
{
  spell: string;
  meaning: string;
  category: ObjectId;
  subCategory: string;
  synonums: string;
  correctCount: number;
}