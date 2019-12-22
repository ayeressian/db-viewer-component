import Ajv from 'ajv';
import ISchema from './types/ISchema.js';
import validationSchema from './validation-schema.json';

const ajv = new Ajv();
const ajvCompiled = ajv.compile(validationSchema);

export default function validateJson(dbSchema: ISchema) {
  const validJson = ajvCompiled(dbSchema);
  return validJson;
}
