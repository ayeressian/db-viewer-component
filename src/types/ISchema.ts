import IPoint from './IPoint';

export interface IFkSchema {
  table: string;
  column: string;
}
export interface IColumnSchema {
  name: string;
  type: string;
  pk?: boolean;
  uq?: boolean;
  nn?: boolean;
}

export interface IColumnFkSchema extends IColumnSchema {
  fk?: IFkSchema;
}

export interface ITableSchema {
  name: string;
  pos?: IPoint| string;
  columns: IColumnFkSchema[];
}

export default interface ISchema {
  tables: ITableSchema[];
  arrangement?: string;
  viewport?: string;
}
