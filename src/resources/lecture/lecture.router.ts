import { Router } from "express";
import { isValidObjectId } from "../../utils/middlewares/isValidObjectId";
import lectrueController from "./lecture.controller";
import { createLectureConditionQuery, isValidBody } from "./lecture.middleware";
import {createQueryFieldsFromQuery,createQueryFieldsFromBody} from "../../utils/middlewares/createQueryField";

const router = Router();

router
  .route('/')
  .get(createQueryFieldsFromQuery, lectrueController.getItems)
  .post(isValidBody, lectrueController.createItem);

router
  .route('/:id')
  .get(isValidObjectId, lectrueController.getItemById)
  .put(isValidObjectId, isValidBody, lectrueController.updateItemById)
  .delete(isValidObjectId, lectrueController.deleteItemById);

router
  .route('/query')
  .post(createQueryFieldsFromBody, createLectureConditionQuery, lectrueController.createQuery);

export default router;