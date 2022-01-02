import { RequestHandler } from "express";
import { User } from "src/resources/users/user.model";
import { getAccessSecret, getAccessTokenLife, getAppName, getHashSecret, getMdb } from "../appVars";
import jwt, { JsonWebTokenError } from 'jsonwebtoken';
import { generatePasswordHash } from "../format";

export const createToken = (email: string, secret: string, tokenLife: number) =>
{
  return jwt.sign({ user: email }, secret, {
    algorithm: "HS256",
    expiresIn: tokenLife
  });
};

export const signin: RequestHandler = async (req, res, next) =>
{
  try
  {
    if (!req.body.email || !req.body.password ||
      typeof req.body.email !== "string" ||
      typeof req.body.password !== "string"
    )
      return res.status(400).json({ message: `Please use valid email and password` });

    const email = req.body.email;
    const password = req.body.password;
    const passwordHash = generatePasswordHash(password, req);

    const client = getMdb(req);
    const db = client.db(getAppName(req));
    const userCollection = db.collection<User>("users");

    const existUser = await userCollection.findOne({ email: req.body.email });
    if (existUser == null)
      return res.status(401).json({ message: "You did input wrong email or password" });

    if (existUser.password !== passwordHash)
      return res.status(401).json({ message: "You did input wrong email or password" });

    const tokenSecet = getAccessSecret(req);
    const tokenLife = getAccessTokenLife(req);
    const token = createToken(email, tokenSecet, tokenLife);

    return res.status(200).cookie("token", token, { signed: true, secure: process.env.NODE_ENV === "production", httpOnly: true }).end();
  }
  catch (error)
  {
    next(error);
  }
};

export const signup: RequestHandler = async (req, res, next) =>
{
  try
  {
    if (!req.body.email || !req.body.password ||
      typeof req.body.email !== "string" ||
      typeof req.body.password !== "string"
    )
      return res.status(400).json({ message: `Please use valid email and password` });

    const email = req.body.email;
    const password = req.body.password;
    const passwordHash = generatePasswordHash(password, req);
    
    const client = getMdb(req);
    const db = client.db(getAppName(req));
    const userCollection = db.collection<Partial<User>>("users");

    const existUser = await userCollection.findOne({ email: req.body.email });
    if (existUser != null)
      return res.status(409).json({ message: `The email already is` });

    const insertBody: Partial<User> = {
      email,
      password: passwordHash,
    };

    const insertResult = await userCollection.insertOne(insertBody);
    if (insertResult.acknowledged)
    {
      const tokenSecet = getAccessSecret(req);
      const tokenLife = getAccessTokenLife(req);
      const token = createToken(email, tokenSecet, tokenLife);

      return res.status(201).cookie("token", token, { signed: true, secure: process.env.NODE_ENV === "production", httpOnly: true }).end();
    }
    else
      next(new Error(`insertOne({${JSON.stringify(insertBody)}}) can't be done with some reasons. please check the DB.`));
  }
  catch (error)
  {
    next(error);
  }
};

export const checkAuthToken: RequestHandler = async (req, res, next) =>
{
  try
  {
    const accessToken = req.signedCookies.token;
    if (!accessToken || typeof accessToken !== "string")
      return res.status(401).end();

    const accessSecret = getAccessSecret(req);
    const jwtPayload = jwt.verify(accessToken, accessSecret);

    if (typeof jwtPayload === "string")
      return res.status(401).end();

    if (!jwtPayload.user)
      return res.status(401).end();

    const client = getMdb(req);
    const db = client.db(getAppName(req));
    const userCollection = db.collection<User>("users");

    const existUser = await userCollection.findOne({ email: jwtPayload.user }, { projection: { password: 0 } });
    if (existUser == null)
      return res.status(401).end();

    res.locals.user = existUser;
    next();
  }
  catch (error)
  {
    if (error instanceof JsonWebTokenError)
      return res.status(401).end();
    next(error);
  }
};