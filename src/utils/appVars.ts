import { Application, Request } from "express";
import { MongoClient } from "mongodb";

export function getAppName(req: Request): string
{
  return req.app.get("appName");
}

export function setAppName(app: Application, appName: string)
{
  app.set("appName", appName);
}

export function getMdb(req: Request): MongoClient
{
  return req.app.get("mdb");
}

export function setMdb(app: Application, client: MongoClient)
{
  app.set("mdb", client);
}

export function getAccessSecret(req: Request): string
{
  return req.app.get("accessSecret");
}

export function setAccessSecret(app: Application, secret: string)
{
  app.set("accessSecret", secret);
}

export function getAccessTokenLife(req: Request): number
{
  return req.app.get("accessTokenLife");
}

export function setAccessTokenLife(app: Application, lifeSecond: number)
{
  app.set("accessTokenLife", lifeSecond);
}

export function getHashSecret(req: Request): string
{
  return req.app.get("hashSecret");
}

export function setHashSecret(app: Application, secret: string)
{
  app.set("hashSecret", secret);
}
