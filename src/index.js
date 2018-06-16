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
    });
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

  connectedCallback() {
    console.log('Custom square element added to page.');
  }

  disconnectedCallback() {
    console.log('Custom square element removed from page.');
  }

  adoptedCallback() {
    console.log('Custom square element moved to new page.');
  }
}

customElements.define('db-designer', DBDesigner);
