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

interface IDbViewerEventMap extends HTMLElementEventMap {
  'ready': CustomEvent;
  'load': CustomEvent;
  'viewportClick': CustomEvent;
  'tableClick': CustomEvent;
  'tableDblClick': CustomEvent;
  'tableContextMenu': CustomEvent;
  'tableMove': CustomEvent;
  'tableMoveEnd': CustomEvent;
  'zoomIn': CustomEvent;
  'zoomOut': CustomEvent;
}

/** DbViewer element */
interface IDbViewer extends HTMLElement {
  scrollLeft: number;
  scrollTop: number;
  src: string;
  schema: ISchema;
  disableTableMovement: boolean;
  getZoom(): number;
  zoomIn(): void;
  zoomOut(): void;
  getTableInfo(name: string): ITableData;
  setTablePos(name: string, xCord: number, yCord: number): void;

  addEventListener<K extends keyof IDbViewerEventMap>(type: K, listener: (this: IDbViewer, ev: IDbViewerEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener<K extends keyof IDbViewerEventMap>(type: K, listener: (this: HTMLFormElement, ev: IDbViewerEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}
