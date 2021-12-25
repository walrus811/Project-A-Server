import { RequestHandler } from "express";
import { Filter, WithId } from "mongodb";
import { getIsValidBody } from "src/utils/middlewares/isValidBody";
import { VocaCategory } from "./vocaCategory.model";

const requiredFields = ["name"];

export const createVocaCategoryConditionQuery: RequestHandler = function (req, res, next)
{
  const queryConditions: Filter<WithId<VocaCategory>>[] = [];

  const bodyObject = req.body as Object;

  if (bodyObject.hasOwnProperty("name"))
    queryConditions.push({ name: new RegExp(`${req.body.name}`) });

  req.body.queryConditions = queryConditions;
  next();
};

export const isValidBody = getIsValidBody(requiredFields);