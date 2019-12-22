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

interface IDBViewer extends HTMLElement {
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
  attributeChangedCallback(name: string, _oldValue: string, newValue: string): void;
}

declare const DBViewer: {
  readonly observedAttributes: string[];
  prototype: IDBViewer;
  new(): IDBViewer;
};
