import { ColumnFk } from "../src/types/column";
import { Schema } from "../src/types/schema";

export const getNumberOfTables = (schema: Schema): number =>
  schema.tables.length;
export const getNumberOfRelations = (schema: Schema): number => {
  return schema.tables.reduce((acc, { columns }) => {
    acc += columns.reduce((accColumns, column) => {
      if ((column as ColumnFk).fk) ++accColumns;
      return accColumns;
    }, 0);
    return acc;
  }, 0);
};
