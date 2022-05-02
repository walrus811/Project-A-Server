import { Router } from "express";
import { isValidObjectId } from "../../utils/middlewares/isValidObjectId";
import studentController from "./student.controller";
import { createStudentConditionQuery, isValidBody } from "./student.middleware";
import { createQueryFieldsFromQuery, createQueryFieldsFromBody } from "../../utils/middlewares/createQueryField";

const router = Router();

router
  .route('/')
  .get(createQueryFieldsFromQuery, studentController.getItems)
  .post(isValidBody, studentController.createItem);

router
  .route('/:id')
  .get(isValidObjectId, studentController.getItemById)
  .put(isValidObjectId, isValidBody, studentController.checkUniqueField, studentController.updateItemById)
  .delete(isValidObjectId, studentController.checkItemExists, studentController.deleteItemById);

router
  .route('/query')
  .post(createQueryFieldsFromBody, createStudentConditionQuery, studentController.createQuery);

export default router;