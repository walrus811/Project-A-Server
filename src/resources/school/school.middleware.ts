import { RequestHandler } from "express";
import { Filter, WithId } from "mongodb";
import { getIsValidBody } from "../../utils/middlewares/isValidBody";
import { School } from "./school.model";

const requiredFields = ["name"];

export const createSchoolConditionQuery: RequestHandler = function (req, res, next)
{
  const queryConditions: Filter<WithId<School>>[] = [];

  const bodyObject = req.body as Object;

  if (bodyObject.hasOwnProperty("name"))
    queryConditions.push({ name: new RegExp(`${req.body.name}`) });

  res.locals.queryConditions = queryConditions;
  next();
};

export const isValidBody = getIsValidBody(requiredFields);