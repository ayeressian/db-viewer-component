import Annotation from "./annotation";
import constant from "./const";
import Table from "./table/table";
import CommonEventListener from "./types/common-event-listener";
import ViewBoxVals from "./types/view-box-vals";
import Viewer from "./viewer";

export default class Minimap {
  onContainerMouseLeave?: () => void;
  onContainerMouseUp?: () => void;

  private minimap: Element;
  private viewpoint: Element;
  private btnZoomIn: Element;
  private btnZoomOut: Element;
  private tableMinimap!: Map<Table, SVGGraphicsElement>;
  private annotationMinimap!: Map<Annotation, SVGGraphicsElement>;

  constructor(
    private mainElem: ShadowRoot,
    private viewer: Viewer,
    private svgElem: SVGGraphicsElement
  ) {
    this.minimap = this.mainElem.getElementById("minimap")!;
    this.viewpoint = this.mainElem.getElementById("viewpoint")!;
    this.btnZoomIn = this.mainElem.getElementById("btn-zoom-in")!;
    this.btnZoomOut = this.mainElem.getElementById("btn-zoom-out")!;
    this.setUpEvents();
    this.reset();
  }

  #minimapPositionFromMouse = (event: MouseEvent): void => {
    const minimapBoundingClientRect = this.minimap.getBoundingClientRect();
    const x = event.clientX - minimapBoundingClientRect.left;
    const y = event.clientY - minimapBoundingClientRect.top;
    const svgElemBoundingClientRect = this.svgElem.getBoundingClientRect();
    const ratioX =
      svgElemBoundingClientRect.width / minimapBoundingClientRect.width;
    const ratioY =
      svgElemBoundingClientRect.height / minimapBoundingClientRect.height;
    const viewpointBoundingClientRect = this.viewpoint.getBoundingClientRect();
    const xCord = (x - viewpointBoundingClientRect.width / 2) * ratioX;
    const yCord = (y - viewpointBoundingClientRect.height / 2) * ratioY;

    void this.viewer.setPanX(xCord);
    void this.viewer.setPanY(yCord);
  };

  removeTables(): void {
    this.tableMinimap = new Map<Table, SVGGraphicsElement>();
    this.annotationMinimap = new Map<Annotation, SVGGraphicsElement>();
    this.minimap
      .querySelectorAll(".mini_table")
      .forEach((miniTable) => miniTable.remove());
  }

  resetViewBox(): void {
    this.minimap.setAttribute(
      "viewBox",
      `0 0 ${this.viewer.getViewerPanWidth()} ${this.viewer.getViewerPanHeight()}`
    );
  }

  reset(): void {
    this.removeTables();
    this.resetViewBox();
  }

  setMinimapViewPoint(viewBoxVals: ViewBoxVals): void {
    this.viewpoint.setAttributeNS(null, "x", viewBoxVals.x.toString());
    this.viewpoint.setAttributeNS(null, "y", viewBoxVals.y.toString());
    this.viewpoint.setAttributeNS(null, "width", viewBoxVals.width.toString());
    this.viewpoint.setAttributeNS(
      null,
      "height",
      viewBoxVals.height.toString()
    );
  }

  createTable(table: Table): void {
    const tableMini = document.createElementNS(
      constant.nsSvg,
      "rect"
    ) as SVGGraphicsElement;
    tableMini.classList.add("mini_table");
    this.tableMinimap.set(table, tableMini);
    this.minimap.appendChild(tableMini);
  }

  createAnnotation(annotation: Annotation): void {
    const annotationMini = document.createElementNS(
      constant.nsSvg,
      "rect"
    ) as SVGGraphicsElement;
    annotationMini.classList.add("mini_annotation");
    this.minimap.appendChild(annotationMini);

    this.annotationMinimap.set(annotation, annotationMini);
  }

  setAnnotationDim(
    annotation: Annotation,
    width: number,
    height: number
  ): void {
    const annotationMini = this.annotationMinimap.get(annotation)!;
    annotationMini.setAttributeNS(null, "width", width.toString());
    annotationMini.setAttributeNS(null, "height", height.toString());
  }

  setTableDim(table: Table, x: number, y: number): void {
    const miniTable = this.tableMinimap.get(table)!;
    miniTable.setAttributeNS(null, "width", x.toString());
    miniTable.setAttributeNS(null, "height", y.toString());
  }

  onAnnotationMove(
    annotation: Annotation,
    deltaX: number,
    deltaY: number
  ): void {
    const minimapAnnotationElem = this.annotationMinimap.get(annotation)!;
    if (minimapAnnotationElem) {
      minimapAnnotationElem.setAttributeNS(null, "x", deltaX.toString());
      minimapAnnotationElem.setAttributeNS(null, "y", deltaY.toString());
    }
  }

  onTableMove(table: Table, deltaX: number, deltaY: number): void {
    const minimapTableElem = this.tableMinimap.get(table)!;

    minimapTableElem.setAttributeNS(null, "x", deltaX.toString());
    minimapTableElem.setAttributeNS(null, "y", deltaY.toString());
  }

  #mouseDown = (event: MouseEvent): void => {
    if (event.button === 0) {
      this.#minimapPositionFromMouse(event);
      this.minimap.addEventListener(
        "mousemove",
        this.#minimapPositionFromMouse as CommonEventListener
      );
    }
  };

  cleanUp(): void {
    this.btnZoomIn.removeEventListener("click", this.viewer.zoomIn);
    this.btnZoomOut.removeEventListener("click", this.viewer.zoomOut);
    this.minimap.removeEventListener(
      "mousedown",
      this.#mouseDown as CommonEventListener
    );

    this.minimap.removeEventListener(
      "mousemove",
      this.#minimapPositionFromMouse as CommonEventListener
    );
  }

  private setUpEvents(): void {
    this.btnZoomIn.addEventListener("click", this.viewer.zoomIn);
    this.btnZoomOut.addEventListener("click", this.viewer.zoomOut);

    this.minimap.addEventListener(
      "mousedown",
      this.#mouseDown as CommonEventListener
    );

    this.onContainerMouseLeave = (): void => {
      this.minimap.removeEventListener(
        "mousemove",
        this.#minimapPositionFromMouse as CommonEventListener
      );
    };

    this.onContainerMouseUp = this.onContainerMouseLeave;
  }
}
