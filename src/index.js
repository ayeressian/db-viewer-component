import Designer from './Designer.js';
import schemaParser from './schemaParser.js';
import template from './template.js';

class DBDesigner extends HTMLElement {
  constructor() {
    super();
    const shadowDom = this.attachShadow({
      mode: 'open'
    });

    shadowDom.innerHTML = template;
    this.designer = new Designer(shadowDom);
    this.designer.setTableDblClickCallback(this.onTableDblClick.bind(this));
    this.designer.setTableClickCallback(this.onTableClick.bind(this));
    this.designer.setTableMoveCallback(this.onTableMove.bind(this));
  }

  onTableDblClick(table) {
    this.dispatchEvent(new CustomEvent('tableDblClick', {detail: table}));
  }

  onTableClick(table) {
    this.dispatchEvent(new CustomEvent('tableClick', {detail: table}));
  }

  onTableContextMenu(table) {
    this.dispatchEvent(new CustomEvent('contextMenu', {detail: table}));
  }

  getTablePos(tableName) {
    return this.designer.getTablePos(tableName);
  }

  get scrollLeft() {
    return this.designer.getPan().x;
  }

  get scrollTop() {
    return this.designer.getPan().y;
  }

  onTableMove(table) {
    this.dispatchEvent(new CustomEvent('tableMove', {detail: table}));
  }

  set src(src) {
    this.setAttribute('src', src);
  }

  static get observedAttributes() {
    return ['src'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this._src = newValue;
    fetch(this._src).then((response) => response.json()).
    then((response) => {
      const tables = schemaParser(response);
      this.designer.load(tables);
    });
  }

  set schema(schema) {
    const tables = schemaParser(schema);
    this.designer.load(tables);
  }
}

customElements.define('db-designer', DBDesigner);
