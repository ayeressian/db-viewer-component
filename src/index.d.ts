interface IFkSchema {
  table: string;
  column: string;
}

interface IColumnSchema {
  name: string;
  type: string;
  pk?: boolean;
  uq?: boolean;
  nn?: boolean;
}

interface IColumnFkSchema extends IColumnSchema {
  fk?: IFkSchema;
}

interface ITableSchema {
  name: string;
  pos?: IPoint | string;
  columns: IColumnFkSchema[];
}

interface ISchema {
  tables: ITableSchema[];
  arrangement?: string;
  viewport?: string;
}

interface ITableData {
  name: string;
  pos: IPoint;
  width: number;
  height: number;
}

interface IPoint {
  x: number;
  y: number;
}

interface IDbViewer extends HTMLElement {
  scrollLeft: number;
  scrollTop: number;
  src: string;
  schema: string;
  disableTableMovement: boolean;
  getZoom(): number;
  zoomIn(): void;
  zoomOut(): void;
  getTableInfo(name: string): ITableData;
  setTablePos(name: string, xCord: number, yCord: number): void;
  attributeChangedCallback(
    name: string,
    _oldValue: string,
    newValue: string
  ): void;
}
