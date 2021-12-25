import { RequestHandler } from "express";
import { QueryField } from "../types/Types";

function getCreateQueryFields(fromBody: boolean = false)
{
  const handler: RequestHandler = async function (req, res, next)
  {
    const queryField: QueryField = {};
    const body = fromBody ? req.body : req.query;
    if ("limit" in body)
      queryField.limit = parseInt(body.limit);
    if ("lastId" in body)
      queryField.lastId = body.lastId;
    if ("sortBy" in body)
      queryField.sortBy = body.sortBy;
    if ("ascend" in body)
    {
      let parsed = parseInt(body.ascend);
      if (parsed)
        queryField.ascend = parsed > 0 ? 1 : -1;
    }
    req.body.queryField = queryField;
    next();
  };
  return handler;
}

export const createQueryFieldsFromQuery = getCreateQueryFields(false);
export const createQueryFieldsFromBody = getCreateQueryFields(true);