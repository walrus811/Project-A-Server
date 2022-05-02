import {Lecture} from "./lecture.model";
import { createController } from "../../utils/crud";

const collectionName = "lectures";
const resouceName = "lecture";
const uniqueField = null;
const exceptFieldList: string[] = [];

export default createController<Lecture>(collectionName, resouceName, exceptFieldList, uniqueField);