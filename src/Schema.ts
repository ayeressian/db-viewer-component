import { Point } from "./Point";

export interface ColumnSchema {
  name: string;
  fk: boolean;
}

export interface TableSchema {
  name: string;
  pos?: Point;
  columns: Array<ColumnSchema>;
}

export interface Schema {
  tables: Array<TableSchema>;
  arrangement?: string;
  viewport?: string;
}
