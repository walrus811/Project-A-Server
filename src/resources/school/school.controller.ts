import { RequestHandler } from "express";
import School from "./school.model";
import { getMdb, getAppName } from "../../utils/appVars";
import httpErrors from "http-errors";

const collectionName = "schools";

export const getSchools: RequestHandler = async (req, res, next) =>
{
  try
  {
    const client = getMdb(req);
    const db = client.db(getAppName(req));
    const schools = db.collection<School>(collectionName);
    const findCursor = schools.find<School>({}, { projection: { _id: 0 } });
    const schoolList = (await findCursor.toArray()).map(x => x.name);
    res.status(200).json({ data: schoolList });
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

    const withId = await schools.findOne<School>({ name: name });
    if (withId != null)
      return res.status(409).setHeader("Content-Location", encodeURI(`/school/${name}`)).json({ message: `${name} already exists.` });

    const insertResult = await schools.insertOne({ name });
    if (insertResult.acknowledged)
      return res.status(201).setHeader("Content-Location", encodeURI(`/school/${name}`)).end();
    else
      next(new Error(`inserOne(${name}) can't be done with some reasons. please check the DB.`));
  }
  catch (error)
  {
    next(error);
  }
};


export const getSchoolByName: RequestHandler = async (req, res, next) =>
{
  const name = req.params.name;

  try
  {
    const client = getMdb(req);
    const db = client.db(getAppName(req));
    const schools = db.collection<School>(collectionName);
    const findCursor = schools.find<School>({ name: new RegExp(`${name}`) }, { projection: { _id: 0 } });
    const schoolList = (await findCursor.toArray()).map(x => x.name);
    if (schoolList.length > 0)
      res.status(200).json({ data: schoolList });
    else
      res.status(404).json({ message: `there're no schools include ${name}.` });
  }
  catch (error)
  {
    next(error);
  }
};

export const updateSchoolByName: RequestHandler = async (req, res, next) =>
{
  const name = req.params.name;
  const newName = req.body.newName;

  if (typeof newName !== "string")
    return next(httpErrors(400, `invalid requst body, please input school name to create.`));

  try
  {
    const client = getMdb(req);
    const db = client.db(getAppName(req));
    const schools = db.collection<School>(collectionName);
    const school = await schools.findOne<School>({ name });
    if (school == null)
      return res.status(404).json({ message: `there're no schools include ${name}` });

    const newSchool = await schools.findOne<School>({ name: newName });
    if (newSchool != null)
      return res.status(409).setHeader("Content-Location", encodeURI(`/school/${newName}`)).json({ message: `${newName} already exists.` });

    const updateResult = await schools.updateOne({ _id: school._id }, {
      $set: {
        name: newName
      }
    });

    if (updateResult.modifiedCount > 0)
      return res.status(204).setHeader("Content-Location", encodeURI(`/school/${newName}`)).end();
    else
      next(new Error(`updateOne(${newName}) can't be done with some reasons. please check the DB.`));
  }
  catch (error)
  {
    next(error);
  }
};


export const deleteSchoolByName: RequestHandler = async (req, res, next) =>
{
  const name = req.params.name;

  try
  {
    const client = getMdb(req);
    const db = client.db(getAppName(req));
    const schools = db.collection<School>(collectionName);

    const school = await schools.findOne<School>({ name });
    if (school == null)
      return res.status(404).json({ message: `there're no schools include ${name}` });

    const deleteResult = await schools.deleteOne({ name });
    if (deleteResult.deletedCount > 0)
    {
      return res.status(204).end();
    }
    else
    {
      next(new Error(`findOneAndDelete(${name}) can't be done with some reasons. please check the DB.`));
    }
  }
  catch (error)
  {
    next(error);
  }
};