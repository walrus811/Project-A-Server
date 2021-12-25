import { Student } from "./student.model";
import { createController } from "../../utils/crud";

const collectionName = "students";
const resouceName = "student";
const uniqueField = null;

export default createController<Student>(collectionName, resouceName, uniqueField);