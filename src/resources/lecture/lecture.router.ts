import { Router } from "express";
import { isValidObjectId } from "../../utils/middlewares/isValidObjectId";
import lectrueController from "./lecture.controller";
import { createLectureConditionQuery, createQueryFieldsFromBody, createQueryFieldsFromQuery, isValidBody } from "./lecture.middleware";

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