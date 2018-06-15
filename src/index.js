class DBDesigner extends HTMLElement {
  constructor() {
    super();

    fetch('../src/index.html').then((response) => {
      console.log(response);
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
