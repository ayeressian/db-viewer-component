import Viewer from './Viewer';
import schemaParser from './schemaParser';
import template from './template';
import validateJson from './validate-schema';
import Table from './Table';
import { Schema } from './Schema';

const NO_TABLE = new Error(`No table exist with the given name.`);
const INVALID_FILE_FORMAT = new Error('Invalid file format.');

class DBViewer extends HTMLElement {
  private readyPromise: Promise<null>;
  private readyPromiseResolve?: Function;
  private viewer?: Viewer;
  private tables: Array<Table> = [];
  private notParsedSchema: Schema = {tables: [], arrangement: '', viewport: ''};

  constructor() {
    super();
    if (this.checkWindowLoaded()) {
      this.whenWindowLoaded();
    } else {
      window.addEventListener('load', this.whenWindowLoaded.bind(this));
    }

    this.readyPromise = new Promise((resolve: Function) => {
      this.readyPromiseResolve = resolve;
    });
  }

  private whenWindowLoaded() {
    const shadowDom = this.attachShadow({
      mode: 'open'
    });
    shadowDom.innerHTML = template;
    this.viewer = new Viewer(shadowDom);
    this.viewer.setCallbacks({
      tableDblClick: this.onTableDblClick.bind(this),
      tableClick: this.onTableClick.bind(this),
      tableContextMenu: this.onTableContextMenu.bind(this),
      tableMove: this.onTableMove.bind(this),
      zoomIn: this.onZoomIn.bind(this),
      zoomOut: this.onZoomOut.bind(this),
      viewportClick: this.onViewportClick.bind(this),
      tableMoveEnd: this.onTableMoveEnd.bind(this)
    });

    if (this.readyPromiseResolve != null) this.readyPromiseResolve();
    this.dispatchEvent(new CustomEvent('ready'));
  }

  private checkWindowLoaded() {
    return document.readyState === 'complete';
  }

  private onViewportClick(x: number, y: number) {
    this.dispatchEvent(new CustomEvent('viewportClick', {detail: {x, y}}));
  }

  private onTableClick(tableData: object) {
    this.dispatchEvent(new CustomEvent('tableClick', {detail: tableData}));
  }

  private onTableDblClick(tableData: object) {
    this.dispatchEvent(new CustomEvent('tableDblClick', {detail: tableData}));
  }

  private onTableContextMenu(tableData: object) {
    this.dispatchEvent(new CustomEvent('tableContextMenu', {detail: tableData}));
  }

  private onTableMove(tableData: object) {
    this.dispatchEvent(new CustomEvent('tableMove', {detail: tableData}));
  }

  private onZoomIn(zoom: object) {
    this.dispatchEvent(new CustomEvent('zoomIn', {detail: {zoom}}));
  }

  private onZoomOut(zoom: object) {
    this.dispatchEvent(new CustomEvent('zoomOut', {detail: {zoom}}));
  }

  private onTableMoveEnd(tableData: object) {
    this.dispatchEvent(new CustomEvent('tableMoveEnd', {detail: tableData}));
  }

  private getViewer(): Viewer {
    if (this.viewer) return this.viewer;
    else throw new Error('viewer is null. Must probably page is not loaded yet.');
  }

  get scrollLeft(): number {
    return this.getViewer().getPan().x;
  }

  get scrollTop() {
    return this.getViewer().getPan().y;
  }

  set scrollLeft(value: number) {
    this.getViewer().setPanX(value);
  }

  set scrollTop(value: number) {
    this.getViewer().setPanY(value);
  }

  getZoom() {
    return this.getViewer().getZoom();
  }

  zoomIn() {
    this.getViewer().zoomIn();
  }

  zoomOut() {
    this.getViewer().zoomOut();
  }

  set src(src: string) {
    this.setAttribute('src', src);
  }

  getTableInfo(name: string) {
    const table = this.tables.find((table) => table.name === name);
    if (table == null) {
      throw NO_TABLE;
    }
    return table.data();
  }

  setTablePos(name: string, xCord: number, yCord: number) {
    const table = this.tables.find((table) => table.name === name);
    if (table == null) {
      throw NO_TABLE;
    }
    table.setTablePos(xCord, yCord);
  }

  static get observedAttributes() {
    return ['src', 'disable-table-movement'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    switch (name) {
      case 'src':
      this.src = newValue;
      this.readyPromise.then(() => {
        fetch(this.src).then((response) => response.json()).
        then((response) => {
          if (!validateJson(response)) {
            throw INVALID_FILE_FORMAT;
          }
          this.notParsedSchema = JSON.parse(JSON.stringify(response));
          this.tables = schemaParser(response);
          this.getViewer().load(this.tables, response.viewport, this.notParsedSchema.arrangement);
          setTimeout(() => {
            this.dispatchEvent(new CustomEvent('load'));
          });
        });
      });
      break;
      case 'disable-table-movement':
        if (this.hasAttribute('disable-table-movement')) {
          this.readyPromise.then(() => this.getViewer().disableTableMovement(true));
        } else {
          this.readyPromise.then(() => this.getViewer().disableTableMovement(false));
        }
      break;
    }
  }

  set schema(schema: string) {
    if (!validateJson(schema)) {
      throw INVALID_FILE_FORMAT;
    }
    this.notParsedSchema = JSON.parse(JSON.stringify(schema));
    const objSchema: Schema = JSON.parse(JSON.stringify(schema));
    this.tables = schemaParser(schema);
    this.getViewer().load(this.tables, objSchema.viewport, objSchema.arrangement);
  }

  get schema(): string {
    this.notParsedSchema.tables.forEach((notParsedTable) => {
      notParsedTable.pos = this.tables.find((table) => table.name === notParsedTable.name).pos;
    });
    return JSON.stringify(this.notParsedSchema);
  }

  set disableTableMovement(value: boolean) {
    if (value) {
      this.setAttribute('disable-table-movement', '');
    } else {
      this.removeAttribute('disable-table-movement');
    }
  }

  get disableTableMovement() {
    return this.getViewer().isTableMovementDisabled;
  }
}

customElements.define('db-viewer', DBViewer);
