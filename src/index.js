
function _getBaseUrl() {
  const current = import.meta.url;
  var to = current.lastIndexOf('/');
  return current.substring(0,to);
}

function stringReplaceAll(str, find, replace) {
  find = find.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  return str.replace(new RegExp(find, 'g'), replace);
}

class DBDesigner extends HTMLElement {
  constructor() {
    super();
    this._baseUrl = _getBaseUrl();
    const shadowDom = this.attachShadow({mode: 'closed'});

    fetch(`${this._baseUrl}/index.html`).then((response) => {
      response.text().then((html) => {
        html = stringReplaceAll(html, '${base}', this._baseUrl);
        shadowDom.innerHTML = html;
      });
    }).catch((error) => {
      console.error(error);
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

  attributeChangedCallback(name, oldValue, newValue) {
    console.log('Custom square element attributes changed.');
  }
}

customElements.define('db-designer', DBDesigner);
