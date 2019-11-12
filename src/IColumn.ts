import Table from './Table';

export interface IFk {
  table: Table;
  column: IColumn;
}

export default interface IColumn {
  name: string;
  elem?: HTMLTableRowElement;
  fk?: IFk;
  pk?: boolean;
  uq?: boolean;
  nn?: boolean;
  type: string;
}
