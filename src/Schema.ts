export interface ColumnSchema {
  name: string;
  fk: boolean;
}

export interface TableSchema {
  name: string;
  pos: object;
  columns: Array<ColumnSchema>;
}

export interface Schema {
  tables: Array<TableSchema>;
  arrangement: string;
  viewport: string;
}
