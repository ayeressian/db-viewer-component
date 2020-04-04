interface FkSchema {
  table: string;
  column: string;
}

interface ColumnNoneFkSchema {
  name: string;
  type: string;
  pk?: boolean;
  uq?: boolean;
  nn?: boolean;
}

interface ColumnFkSchema extends Omit<ColumnNoneFkSchema, 'type'> {
  fk?: FkSchema;
}

type ColumnSchema = ColumnFkSchema | ColumnNoneFkSchema

interface TableSchema {
  name: string;
  pos?: Point | string;
  columns: ColumnSchema[];
}

interface Schema {
  tables: TableSchema[];
  arrangement?: string;
  viewport?: string;
}

interface TableData {
  name: string;
  pos: Point;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

interface DbViewerEventMap extends HTMLElementEventMap {
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
interface DbViewer extends HTMLElement {
  scrollLeft: number;
  scrollTop: number;
  src: string;
  schema: Schema;
  disableTableMovement: boolean;
  getZoom(): number;
  zoomIn(): void;
  zoomOut(): void;
  getTableInfo(name: string): TableData;
  setTablePos(name: string, xCord: number, yCord: number): void;

  addEventListener<K extends keyof DbViewerEventMap>(type: K, listener: (this: DbViewer, ev: DbViewerEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener<K extends keyof DbViewerEventMap>(type: K, listener: (this: HTMLFormElement, ev: DbViewerEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}
