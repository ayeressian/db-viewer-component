import Ajv from 'ajv';
import validationSchema from './validation-schema.json';

const ajv = new Ajv();
const ajvCompiled = ajv.compile(validationSchema);

export default function validateJson(dbSchema: string) {
  const validJson = ajvCompiled(dbSchema);
  return validJson;
}
