import { RequestHandler } from "express";
import { Filter, WithId } from "mongodb";
import { getIsValidBody } from "../../utils/middlewares/isValidBody";
import { School } from "./school.model";
import getCreateQueryFields from "../../utils/middlewares/createQueryField";


const requiredFields = ["name"];

export const createSchoolConditionQuery: RequestHandler = function (req, res, next)
{
  const queryConditions: Filter<WithId<School>>[] = [];

  const bodyObject = req.body as Object;

  if (bodyObject.hasOwnProperty("name"))
    queryConditions.push({ name: new RegExp(`${req.body.name}`) });

  req.body.queryConditions = queryConditions;
  next();
};

export const isValidBody = getIsValidBody(requiredFields);
export const createQueryFieldsFromQuery = getCreateQueryFields(false);
export const createQueryFieldsFromBody = getCreateQueryFields(true);