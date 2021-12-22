import express, { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import httpErrors, { HttpError } from 'http-errors';
import { formatError, formatMongoError } from './utils/format';
import { MongoError } from 'mongodb';
import { connect } from './db/mongodb';

dotenv.config();
const port = parseInt(process.env.PORT as string) || 3000;
const appName = require('../package.json').name;

const app = express();

app.disable('x-powered-by');
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', async (_, res) =>
{
  res.status(200).send("마이크 테스트");
});

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
    await connect(url, appName);
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

function HandleGlobalErrors(err: unknown, req: Request, res: Response, next: NextFunction) 
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
  }

  res.status(status);
  res.send(resBody);
} 
