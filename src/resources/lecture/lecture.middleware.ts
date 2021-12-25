import { Request, RequestHandler } from "express";
import { Filter, WithId } from "mongodb";
import { getIsValidBody } from "../../utils/middlewares/isValidBody";
import { Lecture } from "./lecture.model";

const requiredFields = ["name", "startDate", "endDate"];

function convertDateFields(req: Request): [boolean, string]
{
  const utcIsoRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/;

  const startDateString = req.body.startDate;
  const endDateString = req.body.endDate;

  if (!utcIsoRegex.test(startDateString) ||
    !utcIsoRegex.test(endDateString))
    return [false, `${startDateString}~${endDateString} is not valid. Please use YYYY-MM-DDThh:mm:ssZ format`];

  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);

  if (!startDate || !endDate)
    return [false, `${startDateString}~${endDateString} is not valid. Please use YYYY-MM-DDThh:mm:ssZ format`];

  if (startDate > endDate)
    return [false, `${endDateString} must be less than ${startDateString}`];
  req.body.startDate = startDate;
  req.body.endDate = endDate;
  return [true, ""];
}

export const createLectureConditionQuery: RequestHandler = function (req, res, next)
{
  const queryConditions: Filter<WithId<Lecture>>[] = [];

  const bodyObject = req.body as Object;

  if (bodyObject.hasOwnProperty("name"))
    queryConditions.push({ name: new RegExp(`${req.body.name}`) });

  if (bodyObject.hasOwnProperty("startDate") && bodyObject.hasOwnProperty("endDate"))
  {
    const [success, ..._] = convertDateFields(req);
    if (success)
      queryConditions.push({ startDate: { $gte: req.body.startDate, $lt: req.body.endDate } });
  }

  req.body.queryConditions = queryConditions;
  next();
};

export const isValidBody = getIsValidBody(requiredFields, convertDateFields);