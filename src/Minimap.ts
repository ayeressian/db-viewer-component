import constant from './const';
import Table from './Table';
import CommonEventListener from './types/CommonEventListener';
import ViewBoxVals from './types/ViewBoxVals';
import Viewer from './Viewer';

export default class Minimap {

  public onContainerMouseLeave?: () => void;
  public onContainerMouseUp?: () => void;

  private minimap: Element;
  private viewpoint: Element;
  private btnZoomIn: Element;
  private btnZoomOut: Element;
  private tableMinimap?: Map<Table, SVGGraphicsElement>;

  constructor(private mainElem: ShadowRoot, private viewer: Viewer, private svgElem: SVGGraphicsElement) {
    this.minimap = this.mainElem.getElementById('minimap')!;
    this.viewpoint = this.mainElem.getElementById('viewpoint')!;
    this.btnZoomIn = this.mainElem.getElementById('btn-zoom-in')!;
    this.btnZoomOut = this.mainElem.getElementById('btn-zoom-out')!;
    this.setUpEvents();
    this.reset();
  }

  public minimapPositionFromMouse(event: MouseEvent): void {
    event.stopPropagation();
    const minimapBoundingClientRect = this.minimap.getBoundingClientRect();
    const x = event.clientX - minimapBoundingClientRect.left;
    const y = event.clientY - minimapBoundingClientRect.top;
    const svgElemBoundingClientRect = this.svgElem.getBoundingClientRect();
    const ratioX = svgElemBoundingClientRect.width / minimapBoundingClientRect.width;
    const ratioY = svgElemBoundingClientRect.height / minimapBoundingClientRect.height;
    const viewpointBoundingClientRect = this.viewpoint.getBoundingClientRect();
    const xCord = (x - viewpointBoundingClientRect.width / 2) * ratioX;
    const yCord = (y - viewpointBoundingClientRect.height / 2) * ratioY;

    this.viewer.setPanX(xCord);
    this.viewer.setPanY(yCord);
  }

  public removeTables(): void {
    this.tableMinimap = new Map();
    this.minimap.querySelectorAll('.mini_table').forEach((miniTable) => miniTable.remove());
  }

  public reset(): void {
    this.removeTables();
    this.minimap.setAttribute('viewBox', `0 0 ${constant.VIEWER_PAN_WIDTH} ${constant.VIEWER_PAN_HEIGHT}`);
  }

  public setMinimapViewPoint(viewBoxVals: ViewBoxVals): void {
    this.viewpoint.setAttributeNS(null, 'x', viewBoxVals.x.toString());
    this.viewpoint.setAttributeNS(null, 'y', viewBoxVals.y.toString());
    this.viewpoint.setAttributeNS(null, 'width', viewBoxVals.width.toString());
    this.viewpoint.setAttributeNS(null, 'height', viewBoxVals.height.toString());
  }

  public createTable(table: Table): void {
    const tableMini = document.createElementNS(constant.nsSvg, 'rect') as SVGGraphicsElement;
    tableMini.setAttributeNS(null, 'class', 'mini_table');
    this.tableMinimap!.set(table, tableMini);
    this.minimap.appendChild(tableMini);
  }

  public setTableDim(table: Table, x: number, y: number): void {
    const miniTable = this.tableMinimap!.get(table)!;
    miniTable.setAttributeNS(null, 'width', x.toString());
    miniTable.setAttributeNS(null, 'height', y.toString());
  }

  public onTableMove(table: Table, deltaX: number, deltaY: number): void {
    const minimapTableElem = this.tableMinimap!.get(table)!;

    minimapTableElem.setAttributeNS(null, 'x', deltaX.toString());
    minimapTableElem.setAttributeNS(null, 'y', deltaY.toString());
  }

  private setUpEvents(): void {
    this.btnZoomIn.addEventListener('click', this.viewer.zoomIn.bind(this.viewer));
    this.btnZoomOut.addEventListener('click', this.viewer.zoomOut.bind(this.viewer));

    const minimapMouseMove = this.minimapPositionFromMouse.bind(this);

    this.minimap.addEventListener('mousedown', ((event: MouseEvent) => {
      if (event.button === 0) {
        minimapMouseMove(event);
        this.minimap.addEventListener('mousemove', minimapMouseMove as CommonEventListener);
      }
    }) as CommonEventListener);

    this.onContainerMouseLeave = (): void => {
      this.minimap.removeEventListener('mousemove', minimapMouseMove as CommonEventListener);
    };

    this.onContainerMouseUp = this.onContainerMouseLeave;
  }
}
