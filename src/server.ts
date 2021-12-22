import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import httpErrors, { HttpError } from 'http-errors';
import { formatError, formatMongoError } from './utils/format';
import { MongoError } from 'mongodb';
import { connect } from './db/mongodb';
import schoolRouter from './resources/school/school.router';
import { setAppName, setMdb } from './utils/appVars';

//Preconfig
dotenv.config();
const port = parseInt(process.env.PORT as string) || 3000;
const app = express();
app.disable('x-powered-by');

//Middle
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/", async (req, res, next) =>
{
  res.status(200).json({ test: 123 });
});


//Router
app.use('/api/school', schoolRouter);

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

/*------------------------- Function Declaration-------------------------*/

function RouteNotFound(req: Request, res: Response, next: NextFunction)
{
  next(httpErrors(404, `${req.originalUrl} Can't be Found`));
}

//TODO -  mongodb 접속 에러 처리 추가
function HandleGlobalErrors(err: Error, req: Request, res: Response, next: NextFunction) 
{
  const resBody = {};
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
  }else if(err instanceof Error){
    console.error(formatError(err));
  }
  else{
    const errNever : never =err;
    console.error("error should be error, not never!");
  }

  res.status(status);
  res.send(resBody);
} 
