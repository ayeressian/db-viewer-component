import Viewer from './Viewer.js';
import schemaParser from './schemaParser.js';
import template from './template.js';
import validateJson from './validate-schema';

const NO_TABLE = new Error(`No table exist with the given name.`);
const INVALID_FILE_FORMAT = new Error('Invalid file format.');

class DBViewer extends HTMLElement {
  constructor() {
    super();
    if (this._checkWindowLoaded()) {
      this._whenWindowLoaded();
    } else {
      window.addEventListener('load', this._whenWindowLoaded.bind(this));
    }

    this._readyPromise = new Promise((resolve) => {
      this._readyPromiseResolve = resolve;
    });
  }

  _whenWindowLoaded() {
    const shadowDom = this.attachShadow({
      mode: 'open'
    });
    this._fileDownload = true;
    shadowDom.innerHTML = template;
    this._viewer = new Viewer(shadowDom);
    this._viewer.setCallbacks({
      tableDblClick: this._onTableDblClick.bind(this),
      tableClick: this._onTableClick.bind(this),
      tableContextMenu: this._onTableContextMenu.bind(this),
      tableMove: this._onTableMove.bind(this),
      zoomIn: this._onZoomIn.bind(this),
      zoomOut: this._onZoomOut.bind(this),
      viewportClick: this._onViewportClick.bind(this),
      tableMoveEnd: this._onTableMoveEnd.bind(this)
    });

    this._readyPromiseResolve();
    this.dispatchEvent(new CustomEvent('ready'));
  }

  _checkWindowLoaded() {
    return document.readyState === 'complete';
  }

  _onViewportClick(x, y) {
    this.dispatchEvent(new CustomEvent('viewportClick', {detail: {x, y}}));
  }

  _onTableClick(tableData) {
    this.dispatchEvent(new CustomEvent('tableClick', {detail: tableData}));
  }

  _onTableDblClick(tableData) {
    this.dispatchEvent(new CustomEvent('tableDblClick', {detail: tableData}));
  }

  _onTableContextMenu(tableData) {
    this.dispatchEvent(new CustomEvent('tableContextMenu', {detail: tableData}));
  }

  _onTableMove(tableData) {
    this.dispatchEvent(new CustomEvent('tableMove', {detail: tableData}));
  }

  _onZoomIn(zoom) {
    this.dispatchEvent(new CustomEvent('zoomIn', {detail: {zoom}}));
  }

  _onZoomOut(zoom) {
    this.dispatchEvent(new CustomEvent('zoomOut', {detail: {zoom}}));
  }

  _onTableMoveEnd(tableData) {
    this.dispatchEvent(new CustomEvent('tableMoveEnd', {detail: tableData}));
  }

  get scrollLeft() {
    return this._viewer.getPan().x;
  }

  get scrollTop() {
    return this._viewer.getPan().y;
  }

  set scrollLeft(value) {
    this._viewer.setPanX(value);
  }

  set scrollTop(value) {
    this._viewer.setPanY(value);
  }

  getZoom() {
    return this._viewer.getZoom();
  }

  zoomIn() {
    this._viewer.zoomIn();
  }

  zoomOut() {
    this._viewer.zoomOut();
  }

  set src(src) {
    this.setAttribute('src', src);
  }

  getTableInfo(name) {
    const table = this._tables.find((table) => table.name === name);
    if (table == null) {
      throw NO_TABLE;
    }
    return table.data();
  }

  setTablePos(name, xCord, yCord) {
    const table = this._tables.find((table) => table.name === name);
    if (table == null) {
      throw NO_TABLE;
    }
    table.setTablePos(xCord, yCord);
  }

  static get observedAttributes() {
    return ['src'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this._src = newValue;
    this._fileDownload = false;
    this._readyPromise.then(() => {
      fetch(this._src).then((response) => response.json()).
      then((response) => {
        if (!validateJson(response)) {
          throw INVALID_FILE_FORMAT;
        }
        this._notParsedSchema = JSON.parse(JSON.stringify(response));
        this._tables = schemaParser(response);
        this._viewer.load(this._tables, response.viewport);
        this._fileDownload = true;
        setTimeout(() => {
          this.dispatchEvent(new CustomEvent('load'));
        });
      });
    });
  }

  set schema(schema) {
    if (!validateJson(schema)) {
      throw INVALID_FILE_FORMAT;
    }
    this._notParsedSchema = JSON.parse(JSON.stringify(schema));
    schema = JSON.parse(JSON.stringify(schema));
    this._tables = schemaParser(schema);
    this._viewer.load(this._tables);
    this._fileDownload = true;
  }

  get schema() {
    this._notParsedSchema.tables.forEach((notParsedTable) => {
      notParsedTable.pos = this._tables.find((table) => table.name === notParsedTable.name).pos;
    });
    return this._notParsedSchema;
  }

  set disableTableMovement(value) {
    this._viewer.disableTableMovement(value);
  }
}

customElements.define('db-viewer', DBViewer);
