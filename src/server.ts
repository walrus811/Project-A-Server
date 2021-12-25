import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import httpErrors, { HttpError } from 'http-errors';
import { formatError, formatMongoError } from './utils/format';
import { MongoError } from 'mongodb';
import { connect } from './db/mongodb';
import schoolRouter from './resources/school/school.router';
import lectureRouter from './resources/lecture/lecture.router';
import vocaCategoryRouter from './resources/vocaCategory/vocaCategory.router';
import studentRouter from './resources/student/student.router';
import { setAppName, setMdb } from './utils/appVars';

//Preconfig
dotenv.config();
const port = parseInt(process.env.PORT as string) || 3000;
const app = express();
app.disable('x-powered-by');

//Middle
app.use(cors());
app.use(express.json({ limit: process.env.REQ_BODY_SIZE_LIMIT || "100kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/", async (req, res, next) =>
{
  res.status(200).json({
    message: "글로벌 헬로우"
  });
});

app.use('/api/school', schoolRouter);
app.use('/api/lecture', lectureRouter);
app.use('/api/vocaCategory', vocaCategoryRouter);
app.use('/api/student', studentRouter);

//Error Handle
app.use(RouteNotFound);
app.use(HandleGlobalErrors);

export async function start()
{
  const url = process.env.MDB_URL;
  try
  {
    if (!url)
    {
      console.error("There's no mdb url, please check server env!");
      return;
    }

    const appName = require('../package.json').name;
    setAppName(app, appName);
    const client = await connect(url, appName);
    setMdb(app, client);

    app.listen(port, () =>
    {
      console.log(`listening on ${port}`);
    });
  }
  catch (err)
  {
    let message = "";
    if (err instanceof Error)
    {
      message = formatError(err);
    }
    if (err instanceof MongoError)
    {
      console.error(`can't connect the mongod, ${url}`);
      message = formatMongoError(err);
    }
    console.error(message);
  }
}

/*------------------------- Private Function Declaration-------------------------*/

function RouteNotFound(req: Request, res: Response, next: NextFunction)
{
  next(httpErrors(404, `${req.originalUrl} Can't be Found`));
}

//TODO -  mongodb 접속 에러 처리 추가
function HandleGlobalErrors(err: Error, req: Request, res: Response, next: NextFunction) 
{
  let resBody = undefined;
  let status = 500;
  if (err instanceof HttpError)
  {
    const resBody = {
    } as { message?: string; };

    if (err.expose)
      resBody.message = err.message;
    status = err.status;
  }
  else if (err instanceof MongoError)
  {
    console.error(formatMongoError(err));
  } else if (err instanceof Error)
  {
    console.error(formatError(err));
  }
  else
  {
    const errNever: never = err;
    console.error("error should be error, not never!");
  }

  res.status(status);
  if (resBody)
    res.json(resBody);
  else
    res.end();
} 
