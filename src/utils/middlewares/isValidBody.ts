import { Request, RequestHandler } from "express";

export function getIsValidBody(requiredFields: string[], ...rules: ((req: Request) => [boolean, string])[])
{
  const handler: RequestHandler = async function (req, res, next)
  {
    const omittedFields = [];
    for (const field of requiredFields)
    {
      if (!req.body[field])
        omittedFields.push(field);
    }
    if (omittedFields.length > 0)
    {
      return res.status(400).json({ message: `${omittedFields.toString()} omitted from request body.` });
    }
    for (const rule of rules)
    {
      const [result, message] = rule(req);
      if (!result)
        return res.status(400).json({ message });
    }
    next();
  };

  return handler;
}