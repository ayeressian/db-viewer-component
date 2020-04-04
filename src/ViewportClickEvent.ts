import TableData from './types/TableData';
import Point from './types/Point';

export class ViewportClickEvent extends CustomEvent<Point> {
  constructor(point: Point) {
    super('viewportClick', { detail: point });
  }
}
export class TableClickEvent extends CustomEvent<TableData> {
  constructor(tableData: TableData) {
    super('tableClick', { detail: tableData });
  }
}
export class TableDblClickEvent extends CustomEvent<TableData> {
  constructor(tableData: TableData) {
    super('tableDblClick', { detail: tableData });
  }
}
export class TableContextMenuEvent extends CustomEvent<TableData> {
  constructor(tableData: TableData) {
    super('tableContextMenu', { detail: tableData });
  }
}
export class TableMoveEvent extends CustomEvent<TableData> {
  constructor(tableData: TableData) {
    super('tableMove', { detail: tableData });
  }
}
export class TableMoveEndEvent extends CustomEvent<TableData> {
  constructor(tableData: TableData) {
    super('tableMoveEnd', { detail: tableData });
  }
}
export class ZoomInEvent extends CustomEvent<{
  zoom: number;
}> {
  constructor(zoom: number) {
    super('zoomIn', {
      detail: {
        zoom,
      }
    });
  }
}
export class ZoomOutEvent extends CustomEvent<{
  zoom: number;
}> {
  constructor(zoom: number) {
    super('zoomOut', {
      detail: {
        zoom,
      }
    });
  }
}
export class LoadEvent extends CustomEvent<void> {
  constructor() {
    super('load');
  }
}
export class ReadyEvent extends CustomEvent<void> {
  constructor() {
    super('ready');
  }
}
interface DbViewerEventMap extends HTMLElementEventMap {
  'ready': ReadyEvent;
  'load': LoadEvent;
  'viewportClick': ViewportClickEvent;
  'tableClick': TableClickEvent;
  'tableDblClick': TableDblClickEvent;
  'tableContextMenu': TableContextMenuEvent;
  'tableMove': TableMoveEvent;
  'tableMoveEnd': TableMoveEndEvent;
  'zoomIn': ZoomInEvent;
  'zoomOut': ZoomOutEvent;
}
export interface DbViewerEventListeners {
  addEventListener<K extends keyof DbViewerEventMap>(type: K, listener: (this: DbViewerEventListeners, ev: DbViewerEventMap[K]) => unknown, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener<K extends keyof DbViewerEventMap>(type: K, listener: (this: HTMLFormElement, ev: DbViewerEventMap[K]) => unknown, options?: boolean | EventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}
