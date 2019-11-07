import Viewer from './Viewer';
import schemaParser from './schemaParser';
import template from './template';
import validateJson from './validate-schema';
import {Schema} from './Schema';
import Table from './Table';

const NO_TABLE = new Error(`No table exist with the given name.`);
const INVALID_FILE_FORMAT = new Error('Invalid file format.');

class DBViewer extends HTMLElement {
  private readyPromise: Promise<null>;
  private readyPromiseResolve: () => void;
  private viewer: Viewer;
  private tables: Array<Table>;
  private srcVal: string;
  private notParsedSchema: Schema;

  constructor() {
    super();
    if (this.checkWindowLoaded()) {
      this.whenWindowLoaded();
    } else {
      window.addEventListener('load', this.whenWindowLoaded.bind(this));
    }  

    this.readyPromise = new Promise((resolve) => {
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

    this.readyPromiseResolve();
    this.dispatchEvent(new CustomEvent('ready'));
  }

  private checkWindowLoaded() {
    return document.readyState === 'complete';
  }

  private onViewportClick(x: number, y: number) {
    this.dispatchEvent(new CustomEvent('viewportClick', {detail: {x, y}}));
  }

  private onTableClick(tableData) {
    this.dispatchEvent(new CustomEvent('tableClick', {detail: tableData}));
  }

  private onTableDblClick(tableData) {
    this.dispatchEvent(new CustomEvent('tableDblClick', {detail: tableData}));
  }

  private onTableContextMenu(tableData) {
    this.dispatchEvent(new CustomEvent('tableContextMenu', {detail: tableData}));
  }

  private onTableMove(tableData) {
    this.dispatchEvent(new CustomEvent('tableMove', {detail: tableData}));
  }

  private onZoomIn(zoom: number) {
    this.dispatchEvent(new CustomEvent('zoomIn', {detail: {zoom}}));
  }

  private onZoomOut(zoom: number) {
    this.dispatchEvent(new CustomEvent('zoomOut', {detail: {zoom}}));
  }

  private onTableMoveEnd(tableData) {
    this.dispatchEvent(new CustomEvent('tableMoveEnd', {detail: tableData}));
  }

  get scrollLeft(): number {
    return this.viewer.getPan().x;
  }

  get scrollTop(): number {
    return this.viewer.getPan().y;
  }

  set scrollLeft(value: number) {
    this.viewer.setPanX(value);
  }

  set scrollTop(value: number) {
    this.viewer.setPanY(value);
  }

  getZoom(): number {
    return this.viewer.getZoom();
  }

  zoomIn() {
    this.viewer.zoomIn();
  }

  zoomOut() {
    this.viewer.zoomOut();
  }

  set src(src) {
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

  attributeChangedCallback(name: string, oldValue, newValue: string) {
    switch (name) {
      case 'src':
      this.srcVal = newValue;
      this.readyPromise.then(() => {
        fetch(this.srcVal).then((response) => response.json()).
        then((response) => {
          if (!validateJson(response)) {
            throw INVALID_FILE_FORMAT;
          }
          this.notParsedSchema = JSON.parse(JSON.stringify(response));
          this.tables = schemaParser(response);
          this.viewer.load(this.tables, response.viewport, this.notParsedSchema.arrangement);
          setTimeout(() => {
            this.dispatchEvent(new CustomEvent('load'));
          });
        });
      });
      break;
      case 'disable-table-movement':
        if (this.hasAttribute('disable-table-movement')) {
          this.readyPromise.then(() => this.viewer.disableTableMovement(true));
        } else {
          this.readyPromise.then(() => this.viewer.disableTableMovement(false));
        }
      break;
    }
  }

  set schema(schema: string) {
    if (!validateJson(schema)) {
      throw INVALID_FILE_FORMAT;
    }
    this.notParsedSchema = JSON.parse(JSON.stringify(schema));
    const schemaObj = JSON.parse(JSON.stringify(schema));
    this.tables = schemaParser(schemaObj);
    this.viewer.load(this.tables, schemaObj.viewport, schemaObj.arrangement);
  }

  get schema() {
    this.notParsedSchema.tables.forEach((notParsedTable) => {
      notParsedTable.pos = this.tables.find((table) => table.name === notParsedTable.name).pos;
    });
    return JSON.stringify(this.notParsedSchema);
  }

  set disableTableMovement(value) {
    if (value) {
      this.setAttribute('disable-table-movement', '');
    } else {
      this.removeAttribute('disable-table-movement');
    }
  }

  get disableTableMovement(): boolean {
    return this.viewer.isTableMovementDisabled;
  }
}

customElements.define('db-viewer', DBViewer);
