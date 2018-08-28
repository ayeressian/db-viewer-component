import Designer from './Designer.js';
import schemaParser from './schemaParser.js';

function _getBaseUrl() {
  const current =
    import.meta.url;
  var to = current.lastIndexOf('/');
  return current.substring(0, to);
}

function stringReplaceAll(str, find, replace) {
  find = find.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  return str.replace(new RegExp(find, 'g'), replace);
}

const baseUrl = _getBaseUrl();

const htmlPromise = fetch(`${baseUrl}/index.html`).then((response) => response.text()).
catch((error) => {
  console.error(error);
});

class DBDesigner extends HTMLElement {
  constructor() {
    super();
    this._baseUrl = _getBaseUrl();
    const shadowDom = this.attachShadow({
      mode: 'closed'
    });

    htmlPromise.then(html => {
      html = stringReplaceAll(html, '${base}', this._baseUrl);
      shadowDom.innerHTML = html;
      this.designer = new Designer(shadowDom);
      this.designer.setTableDblClickCallback(this.onTableDblClick.bind(this));
      this.designer.setTableClickCallback(this.onTableClick.bind(this));
      this.designer.setTableMoveCallback(this.onTableMove.bind(this));
    });
  }

  onTableDblClick(table) {
    this.dispatchEvent(new CustomEvent('tableDblClick', {detail: table}));
  }

  onTableClick(table) {
    this.dispatchEvent(new CustomEvent('tableClick', {detail: table}));
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
    then(response => {
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
