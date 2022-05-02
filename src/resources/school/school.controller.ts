import { School } from "./school.model";
import { createController } from "../../utils/crud";

const collectionName = "schools";
const resouceName = "school";
const uniqueField = "name";
const exceptFieldList: string[] = [];

export default createController<School>(collectionName, resouceName, exceptFieldList, uniqueField);