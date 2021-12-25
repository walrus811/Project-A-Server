import { Router } from "express";
import { isValidObjectId } from "../../utils/middlewares/isValidObjectId";
import schoolController from "./school.controller";
import { createQueryFieldsFromBody, createQueryFieldsFromQuery, createSchoolConditionQuery, isValidBody } from "./school.middleware";

const router = Router();
router
  .route('/')
  .get(createQueryFieldsFromQuery, schoolController.getItems)
  .post(isValidBody, schoolController.createItem);

router
  .route('/:id')
  .get(isValidObjectId, schoolController.getItemById)
  .put(isValidObjectId, isValidBody, schoolController.updateItemById)
  .delete(isValidObjectId, schoolController.deleteItemById);

router
  .route('/query')
  .post(createQueryFieldsFromBody, createSchoolConditionQuery, schoolController.createQuery);

export default router;