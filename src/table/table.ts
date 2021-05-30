import { Column } from "../types/column";
import Point from "../types/point";
import { TableSchema, TableArrang } from "../types/schema";
import TableData from "../types/table-data";
import Vertices from "../types/vertices";
import Viewer from "../viewer";
import { createTableElem } from "./create-table-elem";
import MoveEvents, {
  OnMove as OnMoveEvent,
  OnMoveEnd as OnMoveEndEvent,
} from "../move-events";

const OUT_OF_VIEW_CORD = -1000;

type OnMove = (
  table: Table,
  x: number,
  y: number,
  cordinatesChanged: boolean
) => void;

type OnMoveEnd = (table: Table) => void;

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
  private viewer!: Viewer;
  private tableElem!: HTMLElement;
  private onMove!: OnMove;
  private onMoveEnd!: OnMoveEnd;
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

  setMoveListener(onMove: OnMove): void {
    this.onMove = onMove;
  }

  setMoveEndListener(onMoveEnd: OnMoveEnd): void {
    this.onMoveEnd = onMoveEnd;
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
    new MoveEvents(
      this.viewer,
      this,
      this.tableElem,
      this.posValue,
      this.foreignObject,
      this.disableMovementValue,
      this.gElem,
      this.onMove as OnMoveEvent,
      this.onMoveEnd as OnMoveEndEvent
    );

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
    if (this.onMove) this.onMove(this, x, y, cordinatesChanged);
  };

  data(): TableData {
    return {
      height: this.tableElem.offsetHeight,
      name: this.nameValue,
      pos: this.posValue as Point,
      width: this.tableElem.offsetWidth,
    };
  }

  setViewer(viewer: Viewer): void {
    this.viewer = viewer;
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

  cleanup = (): void => {
    this.gElem.removeEventListener("dblclick", this.#onDoubleClick);
    this.gElem.removeEventListener("click", this.#onClick);
    this.gElem.removeEventListener("touch", this.#onClick);
    this.gElem.removeEventListener("contextmenu", this.#onContextMenu);
  };

  #onDoubleClick = (): void => {
    this.viewer.tableDblClick(this.data());
  };

  #onClick = (): void => {
    this.viewer.tableClick(this.data());
  };

  #onContextMenu = (): void => {
    this.viewer.tableContextMenu(this.data());
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
