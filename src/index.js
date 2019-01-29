import Viewer from './Viewer.js';
import schemaParser from './schemaParser.js';
import template from './template.js';
import validateJson from './validate-schema';

const FILE_NOT_LOADED = new Error(`No schema has been set or loaded yet.
  If you are using 'src' attribute please use 'load' event
  to know when the async file fetching has been finished.`);

const NO_TABLE = new Error(`No table exist with the given name.`);
const INVALID_FILE_FORMAT = new Error('Invalid file format.');

class DBViewer extends HTMLElement {
  constructor() {
    super();
    const shadowDom = this.attachShadow({
      mode: 'open'
    });
    this._fileDownload = true;
    shadowDom.innerHTML = template;
    this.viewer = new Viewer(shadowDom);
    this.viewer.setTableDblClickCallback(this.onTableDblClick.bind(this));
    this.viewer.setTableClickCallback(this.onTableClick.bind(this));
    this.viewer.setTableContextMenuCallback(this.onTableContextMenu.bind(this));
    this.viewer.setTableMoveCallback(this.onTableMove.bind(this));
    this.viewer.setZoomInCallback(this.onZoomIn.bind(this));
    this.viewer.setZoomOutCallback(this.onZoomOut.bind(this));

    setTimeout(() => {
      this.dispatchEvent(new CustomEvent('ready'));
    });
  }

  onTableClick(tableData) {
    this.dispatchEvent(new CustomEvent('tableClick', {detail: tableData}));
  }

  onTableDblClick(tableData) {
    this.dispatchEvent(new CustomEvent('tableDblClick', {detail: tableData}));
  }

  onTableContextMenu(tableData) {
    this.dispatchEvent(new CustomEvent('tableContextMenu', {detail: tableData}));
  }

  onTableMove(tableData) {
    this.dispatchEvent(new CustomEvent('tableMove', {detail: tableData}));
  }

  onZoomIn(zoom) {
    this.dispatchEvent(new CustomEvent('zoomIn', {detail: {zoom}}));
  }

  onZoomOut(zoom) {
    this.dispatchEvent(new CustomEvent('zoomOut', {detail: {zoom}}));
  }

  get scrollLeft() {
    return this.viewer.getPan().x;
  }

  get scrollTop() {
    return this.viewer.getPan().y;
  }

  set scrollLeft(value) {
    this.viewer.setPanX(value);
  }

  set scrollTop(value) {
    this.viewer.setPanY(value);
  }

  getZoom() {
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

  getTableInfo(name) {
    const table = this._tables.find((table) => table.name === name);
    if (table == null) {
      throw NO_TABLE;
    }
    return table.formatData();
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
    fetch(this._src).then((response) => response.json()).
    then((response) => {
      if (!validateJson(response)) {
        throw INVALID_FILE_FORMAT;
      }
      this._notParsedSchema = JSON.parse(JSON.stringify(response));
      this._tables = schemaParser(response);
      this.viewer.load(this._tables);
      this._fileDownload = true;
      setTimeout(() => {
        this.dispatchEvent(new CustomEvent('load'));
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
    this.viewer.load(this._tables);
    this._fileDownload = true;
  }

  get schema() {
    this._notParsedSchema.tables.forEach((notParsedTable) => {
      notParsedTable.pos = this._tables.find((table) => table.name === notParsedTable.name).pos;
    });
    return this._notParsedSchema;
  }
}

customElements.define('db-viewer', DBViewer);
