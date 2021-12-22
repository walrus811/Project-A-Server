import { Application, Request } from "express";
import { MongoClient } from "mongodb";

export function getAppName(req: Request) : string
{
  return req.app.get("appName");
}

export function setAppName(app: Application, appName: string)
{
  app.set("appName", appName);
}

export function getMdb(req: Request) : MongoClient
{
  return req.app.get("mdb");
}

export function setMdb(app: Application, client: MongoClient)
{
  app.set("mdb", client);
}