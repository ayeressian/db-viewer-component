import css from './style.js';
export default /* html*/ `
<link rel="stylesheet" type="text/css" href="/node_modules/normalize.css/normalize.css">
<style>
 ${css}
</style>

<div id="designer-container">
  <svg id="designer" version="2" baseProfile="full" xmlns="http://www.w3.org/2000/svg">
  </svg>
  <svg id="minimap" version="2" baseProfile="full" xmlns="http://www.w3.org/2000/svg">
    <rect id="viewpoint"></rect>
  </svg>
  <button id="btn-zoom-in">+</button>
  <button id="btn-zoom-out">-</button>
</div>`;
