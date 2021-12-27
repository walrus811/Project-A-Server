import { RequestHandler } from "express";
import { User } from "src/resources/users/user.model";
import { getAccessSecret, getAccessTokenLife, getAppName, getHashSecret, getMdb, getRefreshSecret, getRefreshTokenLife } from "../appVars";
import jwt from 'jsonwebtoken';
import md5 from "md5";


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
    const passwordHash = md5(password + getHashSecret(req));

    const client = getMdb(req);
    const db = client.db(getAppName(req));
    const userCollection = db.collection<User>("users");

    const existUser = await userCollection.findOne({ email: req.body.email });
    if (existUser == null)
      return res.status(401).json({ message: "You did input wrong email or password" });

    if (existUser.password !== passwordHash)
      return res.status(401).json({ message: "You did input wrong email or password" });

    const refreshSecret = getRefreshSecret(req);
    const refreshTokenLife = getRefreshTokenLife(req);
    const refreshToken = jwt.sign({ user: email }, refreshSecret, {
      algorithm: "HS256",
      expiresIn: refreshTokenLife
    });

    const updateResult = await userCollection.updateOne({ _id: existUser._id }, { $set: { refreshToken } });
    if (updateResult.modifiedCount > 0)
    {
      const accessSecret = getAccessSecret(req);
      const accessTokenLife = getAccessTokenLife(req);
      const accessToken = jwt.sign({ user: email }, accessSecret, {
        algorithm: "HS256",
        expiresIn: accessTokenLife
      });

      return res.status(201).cookie("token", accessToken, { secure: process.env.NODE_ENV === "production", httpOnly: true }).end();
    }
    else
      next(new Error(`updateOne with refreshToken(${refreshToken}) can't be done with some reasons. please check the DB.`));
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
    const passwordHash = md5(password + getHashSecret(req));
    const client = getMdb(req);
    const db = client.db(getAppName(req));
    const userCollection = db.collection<Partial<User>>("users");

    const existUser = await userCollection.findOne({ email: req.body.email });
    if (existUser != null)
      return res.status(409).json({ message: `The email already is` });

    const refreshSecret = getRefreshSecret(req);
    const refreshTokenLife = getRefreshTokenLife(req);
    const refreshToken = jwt.sign({ user: email }, refreshSecret, {
      algorithm: "HS256",
      expiresIn: refreshTokenLife
    });

    const insertBody: Partial<User> = {
      email,
      password: passwordHash,
      refreshToken
    };

    const insertResult = await userCollection.insertOne(insertBody);
    if (insertResult.acknowledged)
    {
      const accessSecret = getAccessSecret(req);
      const accessTokenLife = getAccessTokenLife(req);
      const accessToken = jwt.sign({ user: email }, accessSecret, {
        algorithm: "HS256",
        expiresIn: accessTokenLife
      });

      return res.status(201).cookie("token", accessToken, { secure: process.env.NODE_ENV === "production", httpOnly: true }).end();
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

  }
  catch (error)
  {
    next(error);
  }
};