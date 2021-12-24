import { Router } from "express";
import { createSchool, deleteSchoolByName, getSchools, updateSchoolByName } from "./school.controller";

const router = Router();
router
  .route('/')
  .get(getSchools)
  .post(createSchool);

router
  .route('/:name')
  .put(updateSchoolByName)
  .delete(deleteSchoolByName);

export default router;