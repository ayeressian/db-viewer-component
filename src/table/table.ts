import { Column } from "../types/column";
import Point from "../types/point";
import { TableSchema, TableArrang } from "../types/schema";
import TableData from "../types/table-data";
import Vertices from "../types/vertices";
import Viewer from "../viewer";
import { createTableElem } from "./create-table-elem";
import MoveEvents from "../move-events";

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
  private disableMovementValue: boolean;
  private gElem!: SVGGraphicsElement;
  private tableElem!: HTMLElement;
  private foreignObject!: Element;
  private penddingCenter!: boolean;
  private tablesArrangement?: TableArrang;
  private moveEvents?: MoveEvents;
  private posValue: string | Point;

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
    this.moveEvents = new MoveEvents(
      this.viewer,
      this,
      this.tableElem,
      this.foreignObject,
      this.disableMovementValue,
      this.gElem,
      (_, x, y) => {
        this.viewerCallbacks.tableMove(this, x, y, false);
      },
      () => {
        this.viewerCallbacks.tableMoveEnd(this);
      },
      this.#setPosValue,
      () => this.posValue as Point
    );

    if (this.tablesArrangement == null) {
      if (this.posValue === "center-viewport") {
        this.moveEvents.setPos(OUT_OF_VIEW_CORD, OUT_OF_VIEW_CORD, true);
        this.penddingCenter = true;
      } else {
        const point = this.posValue as Point;
        this.moveEvents.setPos(point.x, point.y);
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

  cleanup = (): void => {
    this.gElem.removeEventListener("dblclick", this.#onDoubleClick);
    this.gElem.removeEventListener("click", this.#onClick);
    this.gElem.removeEventListener("touch", this.#onClick);
    this.gElem.removeEventListener("contextmenu", this.#onContextMenu);
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

  #setPosValue = (posValue: Point): void => {
    this.posValue = posValue;
  };

  private clickEvents(): void {
    this.gElem.addEventListener("dblclick", this.#onDoubleClick);
    this.gElem.addEventListener("click", this.#onClick);
    this.gElem.addEventListener("touch", this.#onClick);
    this.gElem.addEventListener("contextmenu", this.#onContextMenu);
  }

  private isPoint(pos: Point | string): pos is Point {
    return (pos as Point).x !== undefined;
  }

  keepInView(): void {
    if (this.isPoint(this.posValue)) {
      this.moveEvents?.setPos(this.posValue.x, this.posValue.y);
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
    this.moveEvents?.setPos(x, y);
  }

  setTablePos(x: number, y: number): void {
    this.moveEvents?.setPos(x, y);
  }
}
