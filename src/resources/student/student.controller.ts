import { Student } from "./student.model";
import { createController } from "../../utils/crud";

const collectionName = "students";
const resouceName = "student";
const uniqueField = null;
const exceptFieldList: string[] = [];

export default createController<Student>(collectionName, resouceName, exceptFieldList, uniqueField);