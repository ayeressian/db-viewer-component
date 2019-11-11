import IPoint from './IPoint';

export interface IColumnSchema {
  name: string;
  fk: boolean;
}

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
