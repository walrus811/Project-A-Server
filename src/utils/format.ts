import { Request } from "express";
import md5 from "md5";
import { MongoError, ObjectId } from "mongodb";
import { getHashSecret } from "./appVars";

export function formatError(err: Error)
{
  return `name : ${err.name} / message : ${err.message}`;
}

export function formatMongoError(err: MongoError)
{
  return `name : ${err.name} / code : ${err.code} / message : ${err.message} / errmsg : ${err.errmsg}`;
}

export function stripSlashIdFromDocument<T extends { _id: ObjectId; }>(data: T)
{
  const result: { [key: string]: any; } = {};
  for (const key in data)
  {
    if (key == "_id")
      result.id = data._id.toString();
    else
      result[key] = data[key];
  }
  return result;
}

export function generatePasswordHash(password : string, req : Request){
  return md5(password + getHashSecret(req));
}