import constant from './const';
import Viewer from './Viewer';
import Table from './Table';
import { ViewBoxVals } from './ViewBoxVals';

export default class Minimap {
  private mainElem: ShadowRoot;
  private viewer: Viewer;
  private minimap: HTMLElement | null;
  private viewpoint: HTMLElement | null;
  private btnZoomIn: HTMLButtonElement | null;
  private btnZoomOut: HTMLButtonElement | null;
  private svgElem: HTMLElement;
  private viewBoxVals?: ViewBoxVals;
  private tableMinimap: Map<Table, SVGElement>;

  onContainerMouseLeave?: Function;
  onContainerMouseUp?: Function;

  constructor(mainElem: ShadowRoot, viewer: Viewer, svgElem: HTMLElement) {
    this.mainElem = mainElem;
    this.viewer = viewer;
    this.minimap = this.mainElem.getElementById('minimap');
    this.viewpoint = this.mainElem.getElementById('viewpoint');
    this.btnZoomIn = <HTMLButtonElement | null>this.mainElem.getElementById('btn-zoom-in');
    this.btnZoomOut = <HTMLButtonElement | null>this.mainElem.getElementById('btn-zoom-out');
    if (this.minimap == null || this.viewpoint == null || this.btnZoomIn == null || this.btnZoomOut == null) {
      throw new Error('main element missing some html elements.');
    }
    this.tableMinimap = new Map();
    this.svgElem = svgElem;
    this._setUpEvents();
    this.reset();
  }

  _setUpEvents() {
    this.btnZoomIn!.addEventListener('click', this.viewer.zoomIn.bind(this.viewer));
    this.btnZoomOut!.addEventListener('click', this.viewer.zoomOut.bind(this.viewer));

    const minimapMouseMove = this._minimapPositionFromMouse.bind(this);

    this.minimap!.addEventListener('mousedown', (event) => {
      if (event.button === 0) {
        minimapMouseMove(event);
        this.minimap!.addEventListener('mousemove', minimapMouseMove);
      }
    });

    this.onContainerMouseLeave = () => {
      this.minimap!.removeEventListener('mousemove', minimapMouseMove);
    };

    this.onContainerMouseUp = this.onContainerMouseLeave;
  }

  _minimapPositionFromMouse(event: MouseEvent) {
    event.stopPropagation();
    const minimapBoundingClientRect = this.minimap!.getBoundingClientRect();
    const x = event.clientX - minimapBoundingClientRect.left;
    const y = event.clientY - minimapBoundingClientRect.top;
    const svgElemBoundingClientRect = this.svgElem.getBoundingClientRect();
    const ratioX = svgElemBoundingClientRect.width / minimapBoundingClientRect.width;
    const ratioY = svgElemBoundingClientRect.height / minimapBoundingClientRect.height;
    const _viewpointBoundingClientRect = this.viewpoint!.getBoundingClientRect();
    const xCord = (x - _viewpointBoundingClientRect.width / 2) * ratioX;
    const yCord = (y - _viewpointBoundingClientRect.height / 2) * ratioY;

    this.viewer.setPanX(xCord);
    this.viewer.setPanY(yCord);
  }

  removeTables() {
    this.tableMinimap = new Map();
    this.minimap!.querySelectorAll('.mini_table').forEach((miniTable) => miniTable.remove());
  }

  reset() {
    this.removeTables();
    this.minimap!.setAttribute('viewBox', `0 0 ${constant.VIEWER_PAN_WIDTH} ${constant.VIEWER_PAN_HEIGHT}`);
  }

  setMinimapViewPoint(viewBoxVals: ViewBoxVals) {
    this.viewBoxVals = viewBoxVals;
    this.viewpoint!.setAttributeNS(null, 'x', viewBoxVals.x.toString());
    this.viewpoint!.setAttributeNS(null, 'y', viewBoxVals.y.toString());
    this.viewpoint!.setAttributeNS(null, 'width', viewBoxVals.width.toString());
    this.viewpoint!.setAttributeNS(null, 'height', viewBoxVals.height.toString());
  }

  createTable(table: Table) {
    const tableMini = <SVGElement>document.createElementNS(constant.nsSvg, 'rect');
    tableMini.setAttributeNS(null, 'class', 'mini_table');
    this.tableMinimap.set(table, tableMini);
    this.minimap!.appendChild(tableMini);
  }

  setTableDim(table: Table, x: number, y: number) {
    const miniTable = this.tableMinimap.get(table);
    if (miniTable == null) throw new Error('Mini table does not exist.');
    miniTable.setAttributeNS(null, 'width', x.toString());
    miniTable.setAttributeNS(null, 'height', y.toString());
  }

  onTableMove(table: Table, deltaX: number, deltaY: number) {
    const minimapTableElem = this.tableMinimap.get(table);
    if (minimapTableElem == null) throw new Error('Mini table does not exist.');
    minimapTableElem.setAttributeNS(null, 'x', deltaX.toString());
    minimapTableElem.setAttributeNS(null, 'y', deltaY.toString());
  }
}
