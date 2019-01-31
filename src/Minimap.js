import constant from './const.js';

export default class Minimap {
  constructor(mainElem, viewer) {
    this._mainElem = mainElem;
    this._viewer = viewer;
    this._minimap = this._mainElem.getElementById('minimap');
    this._viewpoint = this._mainElem.getElementById('viewpoint');
    this._btnZoomIn = this._mainElem.getElementById('btn-zoom-in');
    this._btnZoomOut = this._mainElem.getElementById('btn-zoom-out');
    this._setUpEvents();
    this.reset();
  }

  _setUpEvents() {
    this._btnZoomIn.addEventListener('click', this._viewer.zoomIn.bind(this));
    this._btnZoomOut.addEventListener('click', this._viewer.zoomOut.bind(this));

    const minimapMouseMove = this._minimapPositionFromMouse.bind(this);

    this._minimap.addEventListener('mousedown', (event) => {
      if (event.button === 0) {
        this._minimapPositionFromMouse(event);
        this._minimap.addEventListener('mousemove', minimapMouseMove);
      }
    });
    this._container.addEventListener('mouseleave', () => {
      this._minimap.removeEventListener('mousemove', minimapMouseMove);
    });
    this._container.addEventListener('mouseup', () => {
      this._minimap.removeEventListener('mousemove', minimapMouseMove);
    });
  }

  _minimapPositionFromMouse(event) {
    event.stopPropagation();
    const minimapBoundingClientRect = this._minimap.getBoundingClientRect();
    const x = event.clientX - minimapBoundingClientRect.x;
    const y = event.clientY - minimapBoundingClientRect.y;
    const svgElemBoundingClientRect = this._svgElem.getBoundingClientRect();
    const ratioX = svgElemBoundingClientRect.width / minimapBoundingClientRect.width;
    const ratioY = svgElemBoundingClientRect.height / minimapBoundingClientRect.height;
    const _viewpointBoundingClientRect = this._viewpoint.getBoundingClientRect();
    this._viewBoxVals.x = (x - _viewpointBoundingClientRect.width / 2) * ratioX;
    this._viewBoxVals.y = (y - _viewpointBoundingClientRect.height / 2) * ratioY;

    this.viewer.setPanX = this._viewBoxVals.x;
    this.viewer.setPanY = this._viewBoxVals.y;
  }

  reset() {
    this._tableMinimap = new Map();
    this._minimap.setAttribute('viewBox', `0 0 ${constant.VIEWER_PAN_WIDTH} ${constant.VIEWER_PAN_HEIGHT}`);
    this._minimap.querySelectorAll('.mini_table').forEach((miniTable) => miniTable.remove());
  }

  setMinimapViewPoint(viewpoint) {
    viewpoint.setAttributeNS(null, 'x', this._viewBoxVals.x);
    viewpoint.setAttributeNS(null, 'y', this._viewBoxVals.y);
    viewpoint.setAttributeNS(null, 'width', this._viewBoxVals.width);
    viewpoint.setAttributeNS(null, 'height', this._viewBoxVals.height);
  }

  onTableMove(table, deltaX, deltaY) {
    const minimapTableElem = this._tableMinimap.get(table);

    minimapTableElem.setAttributeNS(null, 'x', deltaX);
    minimapTableElem.setAttributeNS(null, 'y', deltaY);
  }
}