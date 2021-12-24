import { RequestHandler } from "express";
import { ParsedQs } from 'qs';
import School from "./school.model";
import { getMdb, getAppName } from "../../utils/appVars";
import httpErrors from "http-errors";
import { SchoolConditionField } from "./school.type";
import { Filter, ObjectId, Sort } from "mongodb";
import { Pagination, QueryField } from "../../utils/types/Types";
import { stripSlashIdFromDocument } from "../../utils/format";

const collectionName = "schools";

export const getSchools: RequestHandler = async (req, res, next) =>
{
  try
  {
    const client = getMdb(req);
    const db = client.db(getAppName(req));
    const schools = db.collection<School>(collectionName);

    const queryField = generateQueryField(req.query);
    if (queryField.lastId)
    {
      const lastItem = await schools.findOne({ _id: new ObjectId(queryField.lastId) });
      if (lastItem == null)
        return next(httpErrors(400, `last id, ${queryField.lastId} is not valid.`));
      queryField.lastItem = lastItem.name;
    }
    const conditionField = generateSchoolConditionField(req.query);
    const filter = generateSchoolFilter(queryField, conditionField);
    const sort = generateSchoolSort(queryField);
    const limit = queryField.limit;

    const findCursor = limit ? schools.find<School>(filter).sort(sort).limit(limit > 0 ? limit : 0) : schools.find<School>(filter).sort(sort);
    const schoolList = (await findCursor.toArray());
    const count = schoolList.length;
    const pagination: Pagination = { lastId: schoolList.length > 0 ? schoolList[count - 1]._id.toString() : null, count };
    res.status(200).json({ data: schoolList.map(x => stripSlashIdFromDocument(x)), pagination });
  }
  catch (error)
  {
    next(error);
  }
};

export const createSchool: RequestHandler = async (req, res, next) =>
{
  const name = req.body.name;

  if (typeof name !== "string")
    return next(httpErrors(400, `invalid requst body, please input school name to create.`));

  try
  {
    const client = getMdb(req);
    const db = client.db(getAppName(req));
    const schools = db.collection<School>(collectionName);

    const existSchool = await schools.findOne<School>({ name: name });
    if (existSchool != null)
      return res.status(409).setHeader("Content-Location", encodeURI(`/school/${existSchool._id.toString()}`)).json({ message: `${name} already exists.` });

    const insertResult = await schools.insertOne({ name });
    if (insertResult.acknowledged)
      return res.status(201).setHeader("Content-Location", encodeURI(`/school/${insertResult.insertedId.toString()}`)).end();
    else
      next(new Error(`inserOne(${name}) can't be done with some reasons. please check the DB.`));
  }
  catch (error)
  {
    next(error);
  }
};

export const getSchoolById: RequestHandler = async (req, res, next) =>
{
  try
  {
    const _id = new ObjectId(req.params.id);

    const client = getMdb(req);
    const db = client.db(getAppName(req));
    const schools = db.collection<School>(collectionName);
    const school = await schools.findOne<School>({ _id });
    if (school === null)
      return res.status(404).json({ message: `there're no schools include ${req.params.id}.` });

    res.status(200).json({ data: stripSlashIdFromDocument(school) });
  }
  catch (error)
  {
    next(error);
  }
};

export const updateSchoolById: RequestHandler = async (req, res, next) =>
{
  try
  {
    const _id = new ObjectId(req.params.id);
    const newName = req.body.newName;
    if (typeof newName !== "string")
      return next(httpErrors(400, `invalid requst body, please input school name to create.`));

    const client = getMdb(req);
    const db = client.db(getAppName(req));
    const schools = db.collection<School>(collectionName);
    const school = await schools.findOne<School>({ _id });
    if (school == null)
      return res.status(404).json({ message: `there're no schools include ${req.params.id}` });

    const newSchool = await schools.findOne<School>({ name: newName });
    if (newSchool != null)
      return res.status(409).setHeader("Content-Location", encodeURI(`/school/${newSchool._id.toString()}`)).json({ message: `${newName} already exists.` });

    const updateResult = await schools.updateOne({ _id }, {
      $set: {
        name: newName
      }
    });

    if (updateResult.modifiedCount > 0)
      return res.status(204).setHeader("Content-Location", encodeURI(`/school/${req.params.id}`)).end();
    else
      next(new Error(`updateOne(${newName}) can't be done with some reasons. please check the DB.`));
  }
  catch (error)
  {
    next(error);
  }
};

export const deleteSchoolById: RequestHandler = async (req, res, next) =>
{
  try
  {
    const _id = new ObjectId(req.params.id);

    const client = getMdb(req);
    const db = client.db(getAppName(req));
    const schools = db.collection<School>(collectionName);

    const school = await schools.findOne<School>({ _id });
    if (school == null)
      return res.status(404).json({ message: `there're no schools include ${req.params.id}` });

    const deleteResult = await schools.deleteOne({ _id });
    if (deleteResult.deletedCount > 0)
    {
      return res.status(204).end();
    }
    else
    {
      next(new Error(`findOneAndDelete(${req.params.id}) can't be done with some reasons. please check the DB.`));
    }
  }
  catch (error)
  {
    next(error);
  }
};

/*------------------------- Private Function Declaration-------------------------*/

function generateQueryField(query: ParsedQs)
{
  const result: QueryField = {};

  if ("limit" in query && typeof query.limit === "string")
    result.limit = parseInt(query.limit);
  if ("lastId" in query && typeof query.lastId === "string")
    result.lastId = query.lastId;
  if ("sortBy" in query && typeof query.sortBy === "string")
    result.sortBy = query.sortBy;
  if ("ascend" in query && typeof query.ascend === "string")
  {
    let parsed = parseInt(query.ascend);
    if (parsed)
      result.ascend = parsed > 0 ? 1 : -1;
  }
  return result;
}

function generateSchoolConditionField(query: ParsedQs)
{
  const result: SchoolConditionField = {};

  if ("name" in query && typeof query.name === "string")
    result.name = new RegExp(`${query.name}`);
  return result;
}


function generateSchoolFilter(query: QueryField, condition: SchoolConditionField)
{
  let result: Filter<School> = {};

  const ascend = query.ascend ? query.ascend : 1;
  if (query.lastId)
  {
    const sortFilters: Filter<School>[] = [
      {
        _id: ascend == 1 ? { $gt: new ObjectId(query.lastId) } : { $lt: new ObjectId(query.lastId) }
      }];
    if (query.sortBy)
    {
      sortFilters[0][query.sortBy] = query.lastItem;
      sortFilters.unshift({ [query.sortBy]: ascend == 1 ? { $gt: query.lastItem } : { $lt: query.lastItem } });
    }

    result.$and = [{ $or: sortFilters }];

    if (Object.keys(condition).length > 0)
    {
      result.$and.push(condition);
    }
  }
  else
  {
    result = condition;
  }
  return result;
}

function generateSchoolSort(query: QueryField)
{
  const ascend = query.ascend ? query.ascend : 1;
  let sort: Sort = {
  };

  if (query.sortBy)
  {
    sort[query.sortBy] = ascend;
  }
  sort._id = ascend;

  return sort;
}
