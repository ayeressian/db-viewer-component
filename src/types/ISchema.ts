import IPoint from './IPoint';

export interface IFkSchema {
  table: string;
  column: string;
}

export interface IColumnNoneFkSchema {
  name: string;
  type: string;
  pk?: boolean;
  uq?: boolean;
  nn?: boolean;
}

export interface IColumnFkSchema extends Omit<IColumnNoneFkSchema, 'type'> {
  fk?: IFkSchema;
}

export type IColumnSchema = IColumnFkSchema | IColumnNoneFkSchema;

export interface ITableSchema {
  name: string;
  pos?: IPoint| string;
  columns: IColumnSchema[];
}

export default interface ISchema {
  tables: ITableSchema[];
  arrangement?: string;
  viewport?: string;
}
