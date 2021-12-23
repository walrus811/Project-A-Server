import { Router } from "express";
import { createSchool, deleteSchoolByName, getSchoolByName, getSchools, updateSchoolByName } from "./school.controller";

const router = Router();
router
  .route('/')
  .get(getSchools)
  .post(createSchool);

router
  .route('/:name')
  .get(getSchoolByName)
  .put(updateSchoolByName)
  .delete(deleteSchoolByName);

export default router;