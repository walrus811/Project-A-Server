import { RequestHandler } from "express";
import httpErrors from "http-errors";
import { Condition, Document, Filter, ObjectId, Sort, UpdateFilter, WithId } from "mongodb";
import { getMdb, getAppName } from "./appVars";
import { stripSlashIdFromDocument } from "./format";
import { Pagination, QueryField } from "../utils/types/Types";
import { isEmptyObject } from "./check";

export function createController<T extends { _id: ObjectId; }>(collectionName: string, resourceName: string, exceptFieldList: string[] = [], uniqueField: string | null = null)
{
  return {
    getItems: getItems<T>(collectionName, exceptFieldList),
    createQuery: createQuery<T>(collectionName, exceptFieldList),
    createItem: createItem<T>(collectionName, resourceName, uniqueField),
    getItemById: getItemById<T>(collectionName, exceptFieldList),
    updateItemById: updateItemById<T>(collectionName, resourceName),
    deleteItemById: deleteItemById<T>(collectionName),
    checkItemExists: checkItemExists<T>(collectionName),
    checkUniqueField: checkUniqueField<T>(collectionName, resourceName, uniqueField),
    unsetItemProperty: unsetItemProperty<T>(collectionName, resourceName)
  };
};

function getItems<T extends { _id: ObjectId; }>(collectionName: string, exceptFieldList: string[])
{
  const handler: RequestHandler = async function (req, res, next)
  {
    try
    {
      const client = getMdb(req);
      const db = client.db(getAppName(req));
      const collection = db.collection<T>(collectionName);

      const queryField = res.locals.queryField as QueryField;
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
      const projection = generateProjection(queryField, exceptFieldList);
      const limit = queryField.limit;

      const findCursor = limit ? collection.find<T>(filter, { projection }).sort(sort).limit(limit > 0 ? limit : 0) : collection.find<T>(filter, { projection }).sort(sort);
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

function createQuery<T extends { _id: ObjectId; }>(collectionName: string, exceptFieldList: string[])
{
  const handler: RequestHandler = async function (req, res, next)
  {
    try
    {
      const client = getMdb(req);
      const db = client.db(getAppName(req));
      const collection = db.collection<T>(collectionName);

      const queryField = res.locals.queryField as QueryField;
      const queryConditions: Filter<WithId<T>>[] = res.locals.queryConditions;
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
      const projection = generateProjection(queryField, exceptFieldList);
      const limit = queryField.limit;

      if (isEmptyObject(filter))
      {
        const pagination: Pagination = { lastId: null, count: 0 };
        return res.status(200).json({ data: [], pagination });
      }

      const findCursor = limit ? collection.find<T>(filter, { projection }).sort(sort).limit(limit > 0 ? limit : 0) : collection.find<T>(filter, { projection }).sort(sort);
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
        if (!req.body[uniqueField])
          return res.status(400).json({ message: `${uniqueField} must be in request body.` });

        const filter: Filter<{ [key: string]: any; }> = { [uniqueField]: req.body[uniqueField] };

        const existItem = await collection.findOne<T>(filter);
        if (existItem)
          return res.status(409).setHeader("Content-Location", encodeURI(`/${resourceName}/${existItem._id.toString()}`)).json({ message: `${req.body[uniqueField]} already exists.` });
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

function getItemById<T extends { _id: ObjectId; }>(collectionName: string, exceptFieldList: string[])
{
  const handler: RequestHandler = async function (req, res, next)
  {
    try
    {
      const _id = new ObjectId(req.params.id);

      const client = getMdb(req);
      const db = client.db(getAppName(req));
      const collection = db.collection<T>(collectionName);
      const projection = generateProjection({}, exceptFieldList);

      const item = await collection.findOne<T>({ _id }, { projection });
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

function updateItemById<T extends { _id: ObjectId; }>(collectionName: string, resourceName: string)
{
  const handler: RequestHandler = async function (req, res, next)
  {
    try
    {
      const _id = new ObjectId(req.params.id);

      const client = getMdb(req);
      const db = client.db(getAppName(req));
      const collection = db.collection<T>(collectionName);

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

function deleteItemById<T extends { _id: ObjectId; }>(collectionName: string)
{
  const handler: RequestHandler = async function (req, res, next)
  {
    try
    {
      const client = getMdb(req);
      const db = client.db(getAppName(req));
      const collection = db.collection<T>(collectionName);
      const _id = new ObjectId(req.params.id);

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

function checkUniqueField<T extends { _id: ObjectId; }>(collectionName: string, resourceName: string, uniqueField: string | null)
{
  const handler: RequestHandler = async function (req, res, next)
  {
    try
    {
      const _id = new ObjectId(req.params.id);

      const client = getMdb(req);
      const db = client.db(getAppName(req));
      const collection = db.collection<T>(collectionName);

      if (uniqueField && req.body[uniqueField])
      {
        const filter: Filter<{ [key: string]: any; }> = { [uniqueField]: req.body[uniqueField] };

        const existItem = await collection.findOne<T>(filter);
        if (existItem && !existItem._id.equals(_id))
          return res.status(409).setHeader("Content-Location", encodeURI(`/${resourceName}/${existItem._id.toString()}`)).json({ message: `${req.body[uniqueField]} already exists.` });
      }

      const item = await collection.findOne<T>({ _id });
      if (item == null)
        return res.status(404).json({ message: `there's no item, ${req.params.id}` });
      res.locals.checkedItem = item;
      next();
    }
    catch (error)
    {
      next(error);
    }
  };

  return handler;
}

function checkItemExists<T extends { _id: ObjectId; }>(collectionName: string)
{
  const handler: RequestHandler = async function (req, res, next)
  {
    try
    {
      const client = getMdb(req);
      const db = client.db(getAppName(req));
      const collection = db.collection<T>(collectionName);
      const _id = new ObjectId(req.params.id);

      const item = await collection.findOne<T>({ _id });
      if (item == null)
        return res.status(404).json({ message: `there's no item, ${req.params.id}` });

      res.locals.checkedItem = item;
      next();
    }
    catch (error)
    {
      next(error);
    }
  };

  return handler;
}

function unsetItemProperty<T extends { _id: ObjectId; }>(collectionName: string, resourceName: string)
{
  const handler: RequestHandler = async function (req, res, next)
  {
    try
    {
      const _id = new ObjectId(req.params.id);

      const client = getMdb(req);
      const db = client.db(getAppName(req));
      const collection = db.collection<T>(collectionName);

      const unset: UpdateFilter<T> = {};
      const unsetProperty = res.locals.unsetProperty as string;
      unset[unsetProperty] = "";

      const updateResult = await collection.updateOne(
        { _id },
        {
          "$unset": unset
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

function generateProjection(query: QueryField, exceptFieldList: string[])
{
  let projection: Document = {
  };

  if (query.except)
  {
    const exceptList = query.except.split("|");
    for (const except of exceptList)
    {
      projection[except] = 0;
    }
  }

  for (const except of exceptFieldList)
  {
    projection[except] = 0;
  }

  return projection;
}