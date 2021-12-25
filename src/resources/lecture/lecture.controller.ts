import {Lecture} from "./lecture.model";
import { createController } from "../../utils/crud";

const collectionName = "lectures";
const resouceName = "lecture";
const uniqueField = null;

export default createController<Lecture>(collectionName, resouceName, uniqueField);