export function isEmptyObject(value: any)
{
  return value && Object.keys(value).length === 0 && Object.getPrototypeOf(value) === Object.prototype;
}