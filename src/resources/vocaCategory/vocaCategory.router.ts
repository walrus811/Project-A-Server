import { Router } from "express";
import { isValidObjectId } from "../../utils/middlewares/isValidObjectId";
import vocaCategoryController from "./vocaCategory.controller";
import { createQueryFieldsFromQuery, createQueryFieldsFromBody } from "../../utils/middlewares/createQueryField";
import { createVocaCategoryConditionQuery, isValidBody } from "./vocaCategory.middleware";

const router = Router();

router
  .route('/')
  .get(createQueryFieldsFromQuery, vocaCategoryController.getItems)
  .post(isValidBody, vocaCategoryController.createItem);

router
  .route('/:id')
  .get(isValidObjectId, vocaCategoryController.getItemById)
  .put(isValidObjectId, isValidBody, vocaCategoryController.updateItemById)
  .delete(isValidObjectId, vocaCategoryController.deleteItemById);

router
  .route('/query')
  .post(createQueryFieldsFromBody, createVocaCategoryConditionQuery, vocaCategoryController.createQuery);

export default router;