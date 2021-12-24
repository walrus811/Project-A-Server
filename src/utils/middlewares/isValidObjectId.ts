import { RequestHandler } from "express";
import { ObjectId } from "mongodb";

export const isValidObjectId: RequestHandler = (req, res, next) =>
{
  if (!ObjectId.isValid(req.params.id))
    return res.status(400).json({ message: `${req.params.id} is not valid id` });
  next();
};