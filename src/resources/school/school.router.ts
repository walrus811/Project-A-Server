import { Router } from "express";
import School from "./school.model";
import { getMdb, getAppName } from "../../utils/appVars";
import httpErrors from "http-errors";



const router = Router();
router
  .route('/')
  .get(async (req, res, next) =>
  {
    try
    {
      const client = getMdb(req);
      const db = client.db(getAppName(req));
      const schools = db.collection<School>("schools");
      const findCursor = schools.find<School>({}, { projection: { _id: 0 } });
      const schoolList = (await findCursor.toArray()).map(x => x.name);
      res.status(200).json({ data: schoolList });
    }
    catch (error)
    {
      next(error);
    }
  })
  .post(async (req, res, next) =>
  {
    const name = req.body.name;

    if (typeof name !== "string")
      return next(httpErrors(400, `invalid requst body, please input school name properly!`));

    try
    {
      const client = getMdb(req);
      const db = client.db(getAppName(req));
      const schools = db.collection<School>("schools");
      const insertResult = await schools.insertOne({ name });
    }
    catch (error)
    {
      next(error);
    }
  });


export default router;