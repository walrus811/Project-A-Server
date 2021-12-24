import { Router } from "express";
import { isValidObjectId } from "../../utils/middlewares/isValidObjectId";
import { createSchool, deleteSchoolById, getSchoolById, getSchools, updateSchoolById } from "./school.controller";

const router = Router();
router
  .route('/')
  .get(getSchools)
  .post(createSchool);

router
  .route('/:id')
  .get(isValidObjectId, getSchoolById)
  .put(isValidObjectId, updateSchoolById)
  .delete(isValidObjectId, deleteSchoolById);

export default router;