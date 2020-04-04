import Table from '../Table';

export interface Fk {
  table: Table;
  column: ColumnNoneFk;
}

export interface ColumnNoneFk {
  name: string;
  elem?: HTMLTableRowElement;
  pk?: boolean;
  uq?: boolean;
  nn?: boolean;
  type: string;
}

export interface ColumnFk extends Omit<ColumnNoneFk, 'type'> {
  fk?: Fk;
}

export type Column = ColumnFk | ColumnNoneFk;

export const isColumnFk = (column: Column): column is ColumnFk => {
  return (column as ColumnFk).fk !== undefined;
};
