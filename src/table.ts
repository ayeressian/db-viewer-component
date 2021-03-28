import constant from "./const";
import { Column, ColumnFk, isColumnFk } from "./types/column";
import CommonEventListener from "./types/common-event-listener";
import Point from "./types/point";
import { TableSchema, TableArrang } from "./types/schema";
import TableData from "./types/table-data";
import Vertices from "./types/vertices";
import Viewer from "./viewer";
import { isTouchEvent, normalizeEvent } from "./util";

const OUT_OF_VIEW_CORD = -1000;

type OnMove = (table: Table, x: number, y: number) => void;

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
  private elem!: SVGGraphicsElement;
  private viewer!: Viewer;
  private table!: HTMLElement;
  private onMove!: OnMove;
  private initialClientX!: number;
  private initialClientY!: number;
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
    const bbox = this.elem.getBBox();

    const x = bbox.x + this.table.offsetWidth / 2;
    const y = bbox.y + this.table.offsetHeight / 2;
    return {
      x,
      y,
    };
  }

  getVertices(): Vertices {
    const bbox = this.elem.getBBox();
    return {
      bottomLeft: {
        x: bbox.x,
        y: bbox.y + this.table.offsetHeight,
      },
      bottomRight: {
        x: bbox.x + this.table.offsetWidth,
        y: bbox.y + this.table.offsetHeight,
      },
      topLeft: {
        x: bbox.x,
        y: bbox.y,
      },
      topRight: {
        x: bbox.x + this.table.offsetWidth,
        y: bbox.y,
      },
    };
  }

  render(): SVGGraphicsElement {
    this.elem = document.createElementNS(
      constant.nsSvg,
      "g"
    ) as SVGGraphicsElement;
    this.foreignObject = document.createElementNS(
      constant.nsSvg,
      "foreignObject"
    );
    this.elem.appendChild(this.foreignObject);

    this.table = document.createElementNS(
      constant.nsHtml,
      "table"
    ) as HTMLElement;
    this.table.className = "table";
    const thead = document.createElementNS(constant.nsHtml, "thead");
    const headingTr = document.createElementNS(constant.nsHtml, "tr");
    const headingTh = document.createElementNS(constant.nsHtml, "th");
    headingTh.setAttributeNS(null, "colspan", `${3}`);
    headingTh.innerHTML = this.nameValue;
    headingTr.appendChild(headingTh);
    thead.appendChild(headingTr);

    this.table.appendChild(thead);

    this.foreignObject.appendChild(this.table);

    const tbody = document.createElementNS(constant.nsHtml, "tbody");

    this.createColumns(tbody);

    this.table.appendChild(tbody);
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

    return this.elem;
  }

  addedToView(): void {
    const computedStyle = getComputedStyle(this.table);
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
      (this.table.scrollWidth + borderWidth).toString()
    );
    this.foreignObject.setAttributeNS(
      null,
      "height",
      (this.table.scrollHeight + borderHeight).toString()
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
    this.posValue = {
      x,
      y,
    };
    this.foreignObject.setAttributeNS(null, "x", x.toString());
    this.foreignObject.setAttributeNS(null, "y", y.toString());
    if (this.onMove) this.onMove(this, x, y);
  };

  data(): TableData {
    return {
      height: this.table.offsetHeight,
      name: this.nameValue,
      pos: this.posValue as Point,
      width: this.table.offsetWidth,
    };
  }

  setVeiwer(veiwer: Viewer): void {
    this.viewer = veiwer;
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
    const parentNode = this.elem.parentNode;
    // The reason for not using append of this.elem instead of remaining element prepend
    // is to keep event concistency. The following code is for making click and and double click to work.
    Array.from(parentNode!.children)
      .reverse()
      .forEach((childElem) => {
        if (childElem !== this.elem) {
          parentNode!.prepend(childElem);
        }
      });
  }

  private clickEvents(): void {
    this.elem.addEventListener("dblclick", () => {
      this.viewer.tableDblClick(this.data());
    });
    const onClick = (): void => {
      this.viewer.tableClick(this.data());
    };
    this.elem.addEventListener("click", onClick);
    this.elem.addEventListener("touch", onClick);
    this.elem.addEventListener("contextmenu", () => {
      this.viewer.tableContextMenu(this.data());
    });
  }

  private notAllowOutOfBound(x: number, y: number): Point {
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + this.table.offsetWidth > this.viewer.getViewerPanWidth()) {
      x = this.viewer.getViewerPanWidth() - this.table.offsetWidth;
    }
    if (y + this.table.offsetHeight > this.viewer.getViewerPanHeight()) {
      y = this.viewer.getViewerPanHeight() - this.table.offsetHeight;
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

  private moveEvents(): void {
    let mouseDownInitialElemX: number;
    let mouseDownInitialElemY: number;

    const mouseMove = (event: MouseEvent | TouchEvent): void => {
      if (!this.viewer.getGestureStart()) {
        const mousePos = this.viewer.getMousePosRelativeContainer(event);

        const normalizedClientX =
          mousePos.x / this.viewer.getZoom()! +
          this.viewer.getPan().x / this.viewer.getZoom()!;
        const normalizedClientY =
          mousePos.y / this.viewer.getZoom()! +
          this.viewer.getPan().y / this.viewer.getZoom()!;
        const x = normalizedClientX - mouseDownInitialElemX;
        const y = normalizedClientY - mouseDownInitialElemY;

        this.setTablePos(x, y);
        const pos = this.posValue as Point;
        if (this.onMove) this.onMove(this, pos.x, pos.y);
      }
    };

    const mouseDown = (event: MouseEvent | TouchEvent): void => {
      const touchEvent = isTouchEvent(event);
      if (
        ((!touchEvent &&
          ((event as MouseEvent).button === 0 ||
            (event as MouseEvent).button == null)) ||
          touchEvent) &&
        this.disableMovementValue === false
      ) {
        const eventVal = normalizeEvent(event);
        this.table.classList.add("move");
        const boundingRect = this.elem.getBoundingClientRect();
        const zoom = this.viewer.getZoom()!;
        mouseDownInitialElemX = (eventVal.clientX - boundingRect.left) / zoom;
        mouseDownInitialElemY = (eventVal.clientY - boundingRect.top) / zoom;

        this.initialClientX = eventVal.clientX;
        this.initialClientY = eventVal.clientY;

        document.addEventListener(
          "mousemove",
          mouseMove as CommonEventListener
        );
        document.addEventListener(
          "touchmove",
          mouseMove as CommonEventListener
        );

        this.moveToTop();

        const mouseUp = (mouseUpEvent: MouseEvent): void => {
          if (
            this.onMoveEnd &&
            (this.initialClientX !== mouseUpEvent.clientX ||
              this.initialClientY !== mouseUpEvent.clientY)
          ) {
            this.onMoveEnd(this);
          }
          this.table.classList.remove("move");
          document.removeEventListener(
            "mouseup",
            mouseUp as CommonEventListener
          );
          document.removeEventListener(
            "touchend",
            mouseUp as CommonEventListener
          );
          document.removeEventListener(
            "mousemove",
            mouseMove as CommonEventListener
          );
          document.removeEventListener(
            "touchmove",
            mouseMove as CommonEventListener
          );
        };
        document.addEventListener("mouseup", mouseUp as CommonEventListener);
        document.addEventListener("touchend", mouseUp as CommonEventListener);
      }
    };

    this.elem.addEventListener("mousedown", mouseDown as CommonEventListener);
    this.elem.addEventListener("touchstart", mouseDown as CommonEventListener);
  }

  private createColumns(tbody: Element): void {
    this.columns.forEach((column) => {
      const columnTr = document.createElementNS(
        constant.nsHtml,
        "tr"
      ) as HTMLTableRowElement;
      column.elem = columnTr;

      const columnStatusTd = document.createElementNS(constant.nsHtml, "td");
      if (column.pk) {
        const pdDiv = document.createElementNS(constant.nsHtml, "div");
        pdDiv.classList.add("pk");
        columnStatusTd.appendChild(pdDiv);
        columnStatusTd.classList.add("status");
      } else if ((column as ColumnFk).fk) {
        const fkDiv = document.createElementNS(constant.nsHtml, "div");
        fkDiv.classList.add("fk");
        columnStatusTd.appendChild(fkDiv);
        columnStatusTd.classList.add("status");
      }
      columnTr.appendChild(columnStatusTd);

      const columnNameTd = document.createElementNS(constant.nsHtml, "td");
      columnNameTd.innerHTML = column.name;
      columnTr.appendChild(columnNameTd);

      const columnTypeTd = document.createElementNS(constant.nsHtml, "td");
      if (isColumnFk(column)) {
        columnTypeTd.innerHTML = column.fk!.column.type;
      } else {
        columnTypeTd.innerHTML = column.type;
      }
      columnTr.appendChild(columnTypeTd);
      tbody.appendChild(columnTr);
    });
  }

  private center(): void {
    const viewport = this.viewer.getViewPort();
    const x =
      viewport.x +
      viewport.width / 2 -
      this.table.offsetWidth / this.viewer.getZoom()! / 2;
    const y =
      viewport.y +
      viewport.height / 2 -
      this.table.offsetHeight / this.viewer.getZoom()! / 2;
    this.setTablePos(x, y);
  }
}
