import Viewer from './Viewer.js';
import schemaParser from './schemaParser.js';
import template from './template.js';
import validateJson from './validate-schema';

const NOT_READY_ERROR = new Error('Component isn\'t ready yet. Please use \'ready\' event of db-veiwer component.');

class DBViewer extends HTMLElement {
  constructor() {
    super();
    const shadowDom = this.attachShadow({
      mode: 'open'
    });
    this._ready = false;
    shadowDom.innerHTML = template;
    this.veiwer = new Viewer(shadowDom);
    this.veiwer.setTableDblClickCallback(this.onTableDblClick.bind(this));
    this.veiwer.setTableClickCallback(this.onTableClick.bind(this));
    this.veiwer.setTableContextMenuCallback(this.onTableContextMenu.bind(this));
    this.veiwer.setTableMoveCallback(this.onTableMove.bind(this));
    this.veiwer.setZoomInCallback(this.onZoomIn.bind(this));
    this.veiwer.setZoomOutCallback(this.onZoomOut.bind(this));

    this._readyPromise = new Promise((resolve, reject) => {
      this._readyPromiseResolve = resolve;
      this._readyPromiseReject = reject;
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
    if (!this._ready) {
      throw NOT_READY_ERROR;
    }
    return this.veiwer.getPan().x;
  }

  get scrollTop() {
    if (!this._ready) {
      throw NOT_READY_ERROR;
    }
    return this.veiwer.getPan().y;
  }

  set scrollLeft(value) {
    if (!this._ready) {
      throw NOT_READY_ERROR;
    }
    this.veiwer.setPanX(value);
  }

  set scrollTop(value) {
    if (!this._ready) {
      throw NOT_READY_ERROR;
    }
    this.veiwer.setPanY(value);
  }

  getZoom() {
    if (!this._ready) {
      throw NOT_READY_ERROR;
    }
    return this.veiwer.getZoom();
  }

  zoomIn() {
    if (!this._ready) {
      throw NOT_READY_ERROR;
    }
    this.veiwer.zoomIn();
  }

  zoomOut() {
    if (!this._ready) {
      throw NOT_READY_ERROR;
    }
    this.veiwer.zoomOut();
  }

  set src(src) {
    if (!this._ready) {
      throw NOT_READY_ERROR;
    }
    this.setAttribute('src', src);
  }

  getTableInfo(name) {
    const table = this._tables.find((table) => table.name === name);
    return table.formatData();
  }

  setTablePos(name, xCord, yCord) {
    const table = this._tables.find((table) => table.name === name);
    table.setPanX = xCord;
    table.setPanY = yCord;
  }

  get ready() {
    return this._readyPromise;
  }

  static get observedAttributes() {
    return ['src'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this._src = newValue;
    fetch(this._src).then((response) => response.json()).
    then((response) => {
      if (!validateJson(response)) {
        throw new Error('Invalid file format.');
      }
      this._tables = schemaParser(response);
      this.veiwer.load(this._tables);
    });
  }

  connectedCallback() {
    setTimeout(() => {
      this._ready = true;
      this._readyPromiseResolve();
    });
  }

  set schema(schema) {
    if (!this._ready) {
      throw NOT_READY_ERROR;
    }
    if (!validateJson(schema)) {
      throw new Error('Invalid file format.');
    }
    this._tables = schemaParser(schema);
    this.veiwer.load(this._tables);
  }
}

customElements.define('db-viewer', DBViewer);
