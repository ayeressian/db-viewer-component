import { Column } from "./types/column";
import CommonEventListener from "./types/common-event-listener";
import Point from "./types/point";
import { TableSchema, TableArrang } from "./types/schema";
import TableData from "./types/table-data";
import Vertices from "./types/vertices";
import { isTouchEvent, normalizeEvent } from "./util";
import { createTableElem } from "./create-table-elem";
import Viewer from "./viewer";

const OUT_OF_VIEW_CORD = -1000;

type TableMove = (
  table: Table,
  x: number,
  y: number,
  cordinatesChanged: boolean
) => void;

type TableMoveEnd = (table: Table) => void;

type ViewerCallbacks = {
  tableDblClick: (data: TableData) => void;
  tableClick: (data: TableData) => void;
  tableContextMenu: (data: TableData) => void;
  tableMove: TableMove;
  tableMoveEnd: TableMoveEnd;
};

export default class Table {
  get pos(): string | Point {
    return this.posValue;
  }

  get name(): string {
    return this.nameValue;
  }
  private columns: Column[];
  private nameValue: string;
  private posValue: Point | string;
  private disableMovementValue: boolean;
  private gElem!: SVGGraphicsElement;
  private tableElem!: HTMLElement;
  private initialClientX!: number;
  private initialClientY!: number;
  private foreignObject!: Element;
  private penddingCenter!: boolean;
  private tablesArrangement?: TableArrang;

  constructor(
    {
      name,
      columns = [],
      pos = {
        x: 0,
        y: 0,
      },
    }: TableSchema,
    arrangement?: TableArrang
  ) {
    this.columns = columns as Column[];
    this.nameValue = name;
    this.posValue = pos;

    this.disableMovementValue = false;
    this.tablesArrangement = arrangement;
  }

  private viewerCallbacks!: ViewerCallbacks;
  private viewer!: Viewer;

  setViewer(viewer: Viewer, viewCallbacks: ViewerCallbacks): void {
    this.viewer = viewer;
    this.viewerCallbacks = viewCallbacks;
  }

  getColumns(): Column[] {
    return this.columns;
  }

  setName(name: string): void {
    this.nameValue = name;
  }

  getName(): string {
    return this.nameValue;
  }

  addColumn(column: Column): void {
    this.columns.push(column);
  }

  getCenter(): Point {
    const bbox = this.gElem.getBBox();

    const x = bbox.x + this.tableElem.offsetWidth / 2;
    const y = bbox.y + this.tableElem.offsetHeight / 2;
    return {
      x,
      y,
    };
  }

  getVertices(): Vertices {
    const bbox = this.gElem.getBBox();
    return {
      bottomLeft: {
        x: bbox.x,
        y: bbox.y + this.tableElem.offsetHeight,
      },
      bottomRight: {
        x: bbox.x + this.tableElem.offsetWidth,
        y: bbox.y + this.tableElem.offsetHeight,
      },
      topLeft: {
        x: bbox.x,
        y: bbox.y,
      },
      topRight: {
        x: bbox.x + this.tableElem.offsetWidth,
        y: bbox.y,
      },
    };
  }

  render(): SVGGraphicsElement {
    const { table, g, foreignObject } = createTableElem(
      this.name,
      this.columns
    );
    this.tableElem = table;
    this.gElem = g;
    this.foreignObject = foreignObject;

    this.clickEvents();
    this.moveEvents();

    if (this.tablesArrangement == null) {
      if (this.posValue === "center-viewport") {
        this.setTablePos(OUT_OF_VIEW_CORD, OUT_OF_VIEW_CORD, true);
        this.penddingCenter = true;
      } else {
        const point = this.posValue as Point;
        this.setTablePos(point.x, point.y);
      }
    }

    return this.gElem;
  }

  addedToView(): void {
    const computedStyle = getComputedStyle(this.tableElem);
    let borderWidth =
      parseInt(computedStyle.borderLeftWidth, 10) +
      parseInt(computedStyle.borderRightWidth, 10);
    let borderHeight =
      parseInt(computedStyle.borderTopWidth, 10) +
      parseInt(computedStyle.borderBottomWidth, 10);
    borderWidth = isNaN(borderWidth) ? 0 : borderWidth;
    borderHeight = isNaN(borderHeight) ? 0 : borderHeight;
    this.foreignObject.setAttributeNS(
      null,
      "width",
      (this.tableElem.scrollWidth + borderWidth).toString()
    );
    this.foreignObject.setAttributeNS(
      null,
      "height",
      (this.tableElem.scrollHeight + borderHeight).toString()
    );
  }

  postDraw(): void {
    if (this.penddingCenter) {
      this.center();
    }
  }

  setTablePos = (
    x: number,
    y: number,
    disableOutOfBoundCheck = false
  ): void => {
    if (!disableOutOfBoundCheck) {
      const result = this.notAllowOutOfBound(x, y);
      x = result.x;
      y = result.y;
    }
    const cordinatesChanged =
      this.isPoint(this.posValue) &&
      (this.posValue.x !== x || this.posValue.y !== y);

    this.posValue = {
      x,
      y,
    };
    this.foreignObject.setAttributeNS(null, "x", x.toString());
    this.foreignObject.setAttributeNS(null, "y", y.toString());
    this.viewerCallbacks.tableMove(this, x, y, cordinatesChanged);
  };

  data(): TableData {
    return {
      height: this.tableElem.offsetHeight,
      name: this.nameValue,
      pos: this.posValue as Point,
      width: this.tableElem.offsetWidth,
    };
  }

  highlightFrom(column: Column): void {
    column.elem!.classList.add("fromRelation");
  }

  removeHighlightFrom(column: Column): void {
    column.elem!.classList.remove("fromRelation");
  }

  highlightTo(column: Column): void {
    column.elem!.classList.add("toRelation");
  }

  removeHighlightTo(column: Column): void {
    column.elem!.classList.remove("toRelation");
  }

  disableMovement(value: boolean): void {
    this.disableMovementValue = value;
  }

  private moveToTop(): void {
    const parentNode = this.gElem.parentNode;
    // The reason for not using append of this.elem instead of remaining element prepend
    // is to keep event concistency. The following code is for making click and and double click to work.
    Array.from(parentNode!.children)
      .reverse()
      .forEach((childElem) => {
        if (childElem !== this.gElem) {
          parentNode!.prepend(childElem);
        }
      });
  }

  cleanup = (): void => {
    this.gElem.removeEventListener("dblclick", this.#onDoubleClick);
    this.gElem.removeEventListener("click", this.#onClick);
    this.gElem.removeEventListener("touch", this.#onClick);
    this.gElem.removeEventListener("contextmenu", this.#onContextMenu);

    document.removeEventListener(
      "mousemove",
      this.#onMouseMove as CommonEventListener
    );
    document.removeEventListener(
      "touchmove",
      this.#onMouseMove as CommonEventListener
    );

    document.removeEventListener(
      "mouseup",
      this.#mouseUp as CommonEventListener
    );
    document.removeEventListener(
      "touchend",
      this.#mouseUp as CommonEventListener
    );

    this.gElem.removeEventListener(
      "mousedown",
      this.#onMouseDown as CommonEventListener
    );
    this.gElem.removeEventListener(
      "touchstart",
      this.#onMouseDown as CommonEventListener
    );
  };

  #onDoubleClick = (): void => {
    this.viewerCallbacks.tableDblClick(this.data());
  };

  #onClick = (): void => {
    this.viewerCallbacks.tableClick(this.data());
  };

  #onContextMenu = (): void => {
    this.viewerCallbacks.tableContextMenu(this.data());
  };

  private clickEvents(): void {
    this.gElem.addEventListener("dblclick", this.#onDoubleClick);
    this.gElem.addEventListener("click", this.#onClick);
    this.gElem.addEventListener("touch", this.#onClick);
    this.gElem.addEventListener("contextmenu", this.#onContextMenu);
  }

  private notAllowOutOfBound(x: number, y: number): Point {
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + this.tableElem.offsetWidth > this.viewer.getViewerPanWidth()) {
      x = this.viewer.getViewerPanWidth() - this.tableElem.offsetWidth;
    }
    if (y + this.tableElem.offsetHeight > this.viewer.getViewerPanHeight()) {
      y = this.viewer.getViewerPanHeight() - this.tableElem.offsetHeight;
    }
    return { x, y };
  }

  private isPoint(pos: Point | string): pos is Point {
    return (pos as Point).x !== undefined;
  }

  keepInView(): void {
    if (this.isPoint(this.posValue)) {
      this.setTablePos(this.posValue.x, this.posValue.y);
    }
  }

  #mouseDownInitialElemX!: number;
  #mouseDownInitialElemY!: number;

  #onMouseMove = (event: MouseEvent | TouchEvent): void => {
    if (!this.viewer.getGestureStart()) {
      const mousePos = this.viewer.getMousePosRelativeContainer(event);

      const normalizedClientX =
        mousePos.x / this.viewer.getZoom()! +
        this.viewer.getPan().x / this.viewer.getZoom()!;
      const normalizedClientY =
        mousePos.y / this.viewer.getZoom()! +
        this.viewer.getPan().y / this.viewer.getZoom()!;
      const x = normalizedClientX - this.#mouseDownInitialElemX;
      const y = normalizedClientY - this.#mouseDownInitialElemY;

      this.setTablePos(x, y);
      const pos = this.posValue as Point;
      this.viewerCallbacks.tableMove(this, pos.x, pos.y, true);
    }
  };

  #mouseUp = (mouseUpEvent: MouseEvent): void => {
    if (
      this.initialClientX !== mouseUpEvent.clientX ||
      this.initialClientY !== mouseUpEvent.clientY
    ) {
      this.viewerCallbacks.tableMoveEnd(this);
    }
    this.tableElem.classList.remove("move");
    document.removeEventListener(
      "mouseup",
      this.#mouseUp as CommonEventListener
    );
    document.removeEventListener(
      "touchend",
      this.#mouseUp as CommonEventListener
    );
    document.removeEventListener(
      "mousemove",
      this.#onMouseMove as CommonEventListener
    );
    document.removeEventListener(
      "touchmove",
      this.#onMouseMove as CommonEventListener
    );
  };

  #onMouseDown = (event: MouseEvent | TouchEvent): void => {
    const touchEvent = isTouchEvent(event);
    if (
      ((!touchEvent &&
        ((event as MouseEvent).button === 0 ||
          (event as MouseEvent).button == null)) ||
        touchEvent) &&
      this.disableMovementValue === false
    ) {
      const eventVal = normalizeEvent(event);
      this.tableElem.classList.add("move");
      const boundingRect = this.gElem.getBoundingClientRect();
      const zoom = this.viewer.getZoom()!;
      this.#mouseDownInitialElemX =
        (eventVal.clientX - boundingRect.left) / zoom;
      this.#mouseDownInitialElemY =
        (eventVal.clientY - boundingRect.top) / zoom;

      this.initialClientX = eventVal.clientX;
      this.initialClientY = eventVal.clientY;

      document.addEventListener(
        "mousemove",
        this.#onMouseMove as CommonEventListener
      );
      document.addEventListener(
        "touchmove",
        this.#onMouseMove as CommonEventListener
      );

      this.moveToTop();

      document.addEventListener(
        "mouseup",
        this.#mouseUp as CommonEventListener
      );
      document.addEventListener(
        "touchend",
        this.#mouseUp as CommonEventListener
      );
    }
  };

  private moveEvents(): void {
    this.gElem.addEventListener(
      "mousedown",
      this.#onMouseDown as CommonEventListener
    );
    this.gElem.addEventListener(
      "touchstart",
      this.#onMouseDown as CommonEventListener
    );
  }

  private center(): void {
    const viewport = this.viewer.getViewPort();
    const x =
      viewport.x +
      viewport.width / 2 -
      this.tableElem.offsetWidth / this.viewer.getZoom()! / 2;
    const y =
      viewport.y +
      viewport.height / 2 -
      this.tableElem.offsetHeight / this.viewer.getZoom()! / 2;
    this.setTablePos(x, y);
  }
}
