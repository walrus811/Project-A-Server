import { RequestHandler } from "express";
import httpErrors from "http-errors";
import { Condition, Filter, ObjectId, Sort, WithId } from "mongodb";
import { getMdb, getAppName } from "./appVars";
import { stripSlashIdFromDocument } from "./format";
import { Pagination, QueryField } from "../utils/types/Types";

export function createController<T extends { _id: ObjectId; }>(collectionName: string, resourceName: string, uniqueField: string | null = null)
{
  return {
    getItems: getItems<T>(collectionName),
    createQuery: createQuery<T>(collectionName),
    createItem: createItem<T>(collectionName, resourceName, uniqueField),
    getByItemById: getByItemById<T>(collectionName),
    updateByItemById: updateByItemById<T>(collectionName, resourceName),
    deleteByItemById: deleteByItemById<T>(collectionName),
  };
};

function getItems<T extends { _id: ObjectId; }>(collectionName: string)
{
  const handler: RequestHandler = async function (req, res, next)
  {
    try
    {
      const client = getMdb(req);
      const db = client.db(getAppName(req));
      const collection = db.collection<T>(collectionName);

      const queryField = req.body.queryField as QueryField;
      let lastItemSortValue: any = null;
      if (queryField.lastId)
      {
        const lastItem = await collection.findOne({ _id: new ObjectId(queryField.lastId) });
        if (lastItem == null)
          return next(httpErrors(400, `last id, ${queryField.lastId} is not valid.`));

        if (queryField.sortBy)
          lastItemSortValue = (lastItem as { [key: string]: any; })[queryField.sortBy];
      }

      const filter = generateFilter<T>(queryField, [], lastItemSortValue);
      const sort = generateSort(queryField);
      const limit = queryField.limit;

      const findCursor = limit ? collection.find<T>(filter).sort(sort).limit(limit > 0 ? limit : 0) : collection.find<T>(filter).sort(sort);
      const itemList = (await findCursor.toArray());
      const count = itemList.length;
      const pagination: Pagination = { lastId: itemList.length > 0 ? itemList[count - 1]._id.toString() : null, count };
      res.status(200).json({ data: itemList.map(x => stripSlashIdFromDocument(x)), pagination });
    }
    catch (error)
    {
      next(error);
    }
  };
  return handler;
};

function createQuery<T extends { _id: ObjectId; }>(collectionName: string)
{
  const handler: RequestHandler = async function (req, res, next)
  {
    try
    {
      const client = getMdb(req);
      const db = client.db(getAppName(req));
      const collection = db.collection<T>(collectionName);

      const queryField = req.body.queryField as QueryField;
      const queryConditions: Filter<WithId<T>>[] = req.body.queryConditions;
      let lastItemSortValue: any = null;
      if (queryField.lastId)
      {
        const lastItem = await collection.findOne({ _id: new ObjectId(queryField.lastId) });
        if (lastItem == null)
          return next(httpErrors(400, `last id, ${queryField.lastId} is not valid.`));

        if (queryField.sortBy)
          lastItemSortValue = (lastItem as { [key: string]: any; })[queryField.sortBy];
      }

      const filter = generateFilter<T>(queryField, queryConditions, lastItemSortValue);
      const sort = generateSort(queryField);
      const limit = queryField.limit;

      const findCursor = limit ? collection.find<T>(filter).sort(sort).limit(limit > 0 ? limit : 0) : collection.find<T>(filter).sort(sort);
      const itemList = (await findCursor.toArray());
      const count = itemList.length;
      const pagination: Pagination = { lastId: itemList.length > 0 ? itemList[count - 1]._id.toString() : null, count };
      res.status(200).json({ data: itemList.map(x => stripSlashIdFromDocument(x)), pagination });
    }
    catch (error)
    {
      next(error);
    }
  };
  return handler;
}

function createItem<T extends { _id: ObjectId; }>(collectionName: string, resourceName: string, uniqueField: string | null)
{
  const handler: RequestHandler = async function (req, res, next)
  {
    try
    {
      const client = getMdb(req);
      const db = client.db(getAppName(req));
      const collection = db.collection<T>(collectionName);

      if (uniqueField)
      {
        if (!req.body.uniqueField)
          return res.status(400).json({ message: `${uniqueField} must be in request body.` });

        const filter: Filter<{ [key: string]: any; }> = { [uniqueField]: req.body.uniqueField };

        const existItem = await collection.findOne<T>(filter);
        if (existItem != null)
          return res.status(409).setHeader("Content-Location", encodeURI(`/${resourceName}/${existItem._id.toString()}`)).json({ message: `${uniqueField} already exists.` });
      }

      const insertResult = await collection.insertOne(req.body);
      if (insertResult.acknowledged)
        return res.status(201).setHeader("Content-Location", encodeURI(`/${resourceName}/${insertResult.insertedId.toString()}`)).end();
      else
        next(new Error(`inserOne({${JSON.stringify(req.body)}}) can't be done with some reasons. please check the DB.`));
    }
    catch (error)
    {
      next(error);
    }
  };

  return handler;
};

function getByItemById<T extends { _id: ObjectId; }>(collectionName: string)
{
  const handler: RequestHandler = async function (req, res, next)
  {
    try
    {
      const _id = new ObjectId(req.params.id);

      const client = getMdb(req);
      const db = client.db(getAppName(req));
      const collection = db.collection<T>(collectionName);
      const item = await collection.findOne<T>({ _id });
      if (item === null)
        return res.status(404).json({ message: `there's no item include ${req.params.id}.` });

      res.status(200).json({ data: stripSlashIdFromDocument(item) });
    }
    catch (error)
    {
      next(error);
    }
  };

  return handler;
}

function updateByItemById<T extends { _id: ObjectId; }>(collectionName: string, resourceName: string)
{
  const handler: RequestHandler = async function (req, res, next)
  {
    try
    {
      const _id = new ObjectId(req.params.id);

      const client = getMdb(req);
      const db = client.db(getAppName(req));
      const collection = db.collection<T>(collectionName);
      const item = await collection.findOne<T>({ _id });
      if (item == null)
        return res.status(404).json({ message: `there's no item, ${req.params.id}` });

      const updateResult = await collection.updateOne(
        { _id },
        {
          $set: req.body
        }
      );

      if (updateResult.matchedCount > 0)
        return res.status(204).setHeader("Content-Location", encodeURI(`/${resourceName}/${req.params.id}`)).end();
      else
        next(new Error(`updateOne({${req.params.id}},{${JSON.stringify(req.body)}}) can't be done with some reasons. please check the DB.`));
    }
    catch (error)
    {
      next(error);
    }
  };

  return handler;
}

function deleteByItemById<T extends { _id: ObjectId; }>(collectionName: string)
{
  const handler: RequestHandler = async function (req, res, next)
  {
    try
    {
      const _id = new ObjectId(req.params.id);

      const client = getMdb(req);
      const db = client.db(getAppName(req));
      const collection = db.collection<T>(collectionName);

      const item = await collection.findOne<T>({ _id });
      if (item == null)
        return res.status(404).json({ message: `there's no item, ${req.params.id}` });

      const deleteResult = await collection.deleteOne({ _id });
      if (deleteResult.deletedCount > 0)
      {
        return res.status(204).end();
      }
      else
      {
        next(new Error(`deleteOne(${req.params.id}) can't be done with some reasons. please check the DB.`));
      }
    }
    catch (error)
    {
      next(error);
    }
  };

  return handler;
}

function generateFilter<T extends { _id: ObjectId; }>(query: QueryField, conditionList: Filter<WithId<T>>[], lastItemSortValue: any = null)
{
  let result: Filter<T> = {};

  const ascend = query.ascend ? query.ascend : 1;
  if (query.lastId)
  {
    const sortFilters: Filter<Condition<ObjectId>>[] = [
      {
        _id: ascend == 1 ? { $gt: new ObjectId(query.lastId) } : { $lt: new ObjectId(query.lastId) }
      }];

    if (query.sortBy && lastItemSortValue)
    {
      sortFilters[0][query.sortBy] = lastItemSortValue;
      sortFilters.unshift({ [query.sortBy]: ascend == 1 ? { $gt: lastItemSortValue } : { $lt: lastItemSortValue } });
    }
    result.$and = [{ $or: sortFilters }];
    if (conditionList.length > 0)
      result.$and.push(...conditionList);
  }
  else
  {
    if (conditionList.length > 0)
      result.$and = conditionList;
  }
  return result;
}

function generateSort(query: QueryField)
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
