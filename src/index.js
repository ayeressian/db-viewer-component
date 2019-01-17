import Viewer from './Viewer.js';
import schemaParser from './schemaParser.js';
import template from './template.js';
import validateJson from './validate-schema';

const FILE_NOT_LOADED = new Error(`No schema has been set or loaded yet. 
  If you are using 'src' attribute please use 'fileLoaded' method returned
  promise to know when the async file fetching has been finished.`);

class DBViewer extends HTMLElement {
  constructor() {
    super();
    const shadowDom = this.attachShadow({
      mode: 'open'
    });
    this._fileLoaded = true;
    shadowDom.innerHTML = template;
    this.veiwer = new Viewer(shadowDom);
    this.veiwer.setTableDblClickCallback(this.onTableDblClick.bind(this));
    this.veiwer.setTableClickCallback(this.onTableClick.bind(this));
    this.veiwer.setTableContextMenuCallback(this.onTableContextMenu.bind(this));
    this.veiwer.setTableMoveCallback(this.onTableMove.bind(this));
    this.veiwer.setZoomInCallback(this.onZoomIn.bind(this));
    this.veiwer.setZoomOutCallback(this.onZoomOut.bind(this));

    this._fileLoadPromise = new Promise((resolve, reject) => {
      this._fileLoadPromiseResolve = resolve;
      this._fileLoadPromiseReject = reject;
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

  onZoomIn() {
    this.dispatchEvent(new CustomEvent('zoomIn'));
  }

  onZoomOut() {
    this.dispatchEvent(new CustomEvent('zoomOut'));
  }

  get scrollLeft() {
    return this.veiwer.getPan().x;
  }

  get scrollTop() {
    return this.veiwer.getPan().y;
  }

  set scrollLeft(value) {
    this.veiwer.setPanX(value);
  }

  set scrollTop(value) {
    this.veiwer.setPanY(value);
  }

  getZoom() {
    return this.veiwer.getZoom();
  }

  zoomIn() {
    this.veiwer.zoomIn();
  }

  zoomOut() {
    this.veiwer.zoomOut();
  }

  set src(src) {
    this.setAttribute('src', src);
  }

  getTableInfo(name) {
    if (!this._fileLoaded) {
      throw FILE_NOT_LOADED;
    }
    const table = this._tables.find((table) => table.name === name);
    return table.formatData();
  }

  setTablePos(name, xCord, yCord) {
    const table = this._tables.find((table) => table.name === name);
    table.setPanX = xCord;
    table.setPanY = yCord;
  }

  get ready() {
    return this._fileLoadPromise;
  }

  static get observedAttributes() {
    return ['src'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this._src = newValue;
    this._fileLoaded = false;
    fetch(this._src).then((response) => response.json()).
    then((response) => {
      if (!validateJson(response)) {
        throw new Error('Invalid file format.');
      }
      this._tables = schemaParser(response);
      this.viewer.load(this._tables);
      this._fileLoaded = true;
      this._fileLoadPromiseResolve();
    }).catch((error) => {
      this._fileLoadPromiseReject(error);
      this._fileLoaded = false;
    });
  }

  set schema(schema) {
    if (!validateJson(schema)) {
      throw new Error('Invalid file format.');
    }
    this._tables = schemaParser(schema);
    this.veiwer.load(this._tables);
    this._fileLoaded = true;
  }
}

customElements.define('db-viewer', DBViewer);
