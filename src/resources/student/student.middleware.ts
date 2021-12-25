import { Request, RequestHandler } from "express";
import { Filter, WithId } from "mongodb";
import { getIsValidBody } from "../../utils/middlewares/isValidBody";
import { Student } from "./student.model";

const requiredFields = ["name", "schoolName", "grade"];

export const createStudentConditionQuery: RequestHandler = function (req, res, next)
{
  const queryConditions: Filter<WithId<Student>>[] = [];

  const bodyObject = req.body as Object;

  if (bodyObject.hasOwnProperty("name"))
    queryConditions.push({ name: new RegExp(`${req.body.name}`) });
  if (bodyObject.hasOwnProperty("schoolName"))
    queryConditions.push({ schoolName: new RegExp(`${req.body.schoolName}`) });
  if (bodyObject.hasOwnProperty("grade"))
    queryConditions.push({ grade: req.body.grade });
  if (bodyObject.hasOwnProperty("phone"))
    queryConditions.push({ $or: [{ phone1: req.body.phone }, { phone2: req.body.phone }] });
  if (bodyObject.hasOwnProperty("retire"))
    queryConditions.push({ retire: req.body.retire });

  req.body.queryConditions = queryConditions;
  next();
};
export const isValidBody = getIsValidBody(requiredFields);