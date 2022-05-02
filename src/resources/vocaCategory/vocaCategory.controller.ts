import { VocaCategory } from "./vocaCategory.model";
import { createController } from "../../utils/crud";

const collectionName = "vocaCategories";
const resouceName = "vocaCategory";
const uniqueField = "name";
const exceptFieldList: string[] = [];

export default createController<VocaCategory>(collectionName, resouceName, exceptFieldList, uniqueField);