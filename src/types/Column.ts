import Table from '../Table';

export interface IFk {
  table: Table;
  column: IColumnNoneFk;
}

export interface IColumnNoneFk {
  name: string;
  elem?: HTMLTableRowElement;
  pk?: boolean;
  uq?: boolean;
  nn?: boolean;
  type: string;
}

export interface IColumnFk extends Omit<IColumnNoneFk, 'type'> {
  fk?: IFk;
}

export type Column = IColumnFk | IColumnNoneFk;

export const isColumnFk = (column: Column): column is IColumnFk => {
  return (column as IColumnFk).fk !== undefined;
};
