import constant from "./const";
import Minimap from "./minimap";
import Relation, { RelationData } from "./realtion/relation";
import spiralArrange from "./spiral-arrange";
import Table from "./table/table";
import { isColumnFk } from "./types/column";
import CommonEventListener from "./types/common-event-listener";
import Callbacks from "./types/callbacks";
import Orientation from "./types/orientation";
import TableData from "./types/table-data";
import ViewBoxVals from "./types/view-box-vals";
import Point from "./types/point";
import { normalizeEvent, isSafari } from "./util";
import { TableArrang, Viewport } from "./types/schema";
import { center, distance } from "./math-util";
import Annotation from "./annotation";

interface SideAndCount {
  side: Orientation;
  order: number;
  count: number;
}

interface GestureEvent extends MouseEvent {
  scale: number;
}

export default class Viewer {
  isTableMovementDisabled = false;
  tables: Table[] = [];
  annotations: Annotation[] = [];
  private container: HTMLElement;
  private svgElem: SVGGraphicsElement;
  private svgContainer: HTMLElement;
  private minimap: Minimap;
  private disbleScrollEvent: boolean;
  private viewBoxVals: ViewBoxVals;
  private zoom!: number;
  private callbacks!: Callbacks;
  private relationInfos!: Relation[];
  private panXResolver?: () => void;
  private panYResolver?: () => void;
  private zoomResolve?: () => void;
  private safariScale!: number;
  private tablesLoaded = false;
  private gestureStart = false;
  private viewLoaded: Promise<void>;

  private tableArrang?: TableArrang;
  private viewHeight = constant.VIEW_HEIGHT;
  private viewWidth = constant.VIEW_WIDTH;

  constructor(private mainElem: ShadowRoot) {
    this.container = this.mainElem.getElementById("veiwer-container")!;

    this.svgElem = this.mainElem.querySelector<SVGGraphicsElement>("#veiwer")!;

    this.svgContainer = this.mainElem.querySelector<HTMLElement>(
      ".svg-container"
    )!;

    this.minimap = new Minimap(mainElem, this, this.svgElem);

    this.setUpEvents();

    this.disbleScrollEvent = false;

    const width = this.svgContainer.clientWidth;
    const height = this.svgContainer.clientHeight;
    this.viewBoxVals = {
      height,
      width,
      x: 0,
      y: 0,
    };
    this.minimap.setMinimapViewPoint(this.viewBoxVals);

    this.viewLoaded = this.reset().then(() => {
      void this.setViewport(Viewport.center);
    });
  }

  getViewLoaded(): Promise<void> {
    return this.viewLoaded;
  }

  getViewerPanWidth(): number {
    return this.viewWidth;
  }

  getViewerPanHeight(): number {
    return this.viewHeight;
  }

  async load(
    tables: Table[],
    annotations: Annotation[],
    viewport: Viewport = Viewport.centerByTables,
    tableArrang: TableArrang = TableArrang.default,
    viewWidth = constant.VIEW_WIDTH,
    viewHeight = constant.VIEW_HEIGHT
  ): Promise<void> {
    this.relationInfos = [];
    this.svgElem.innerHTML = "";
    this.tables = tables;
    this.annotations = annotations;
    annotations.forEach((annotation) => {
      annotation.setVeiwer(this);
    });
    tables.forEach((table) => {
      table.setViewer(this);
      table.setMoveListener(this.onTableMove.bind(this));
      table.setMoveEndListener(this.onTableMoveEnd.bind(this));
      table.disableMovement(this.isTableMovementDisabled);
    });
    this.tableArrang = tableArrang;
    await this.render(viewport);

    if (this.viewWidth !== viewWidth || this.viewHeight !== viewHeight) {
      this.viewWidth = viewWidth;
      this.viewHeight = viewHeight;
      this.resetViewBox();
      this.setZoom(this.zoom);
      for (const table of tables) {
        table.keepInView();
      }
    }
  }

  onTableMove(
    table: Table,
    deltaX: number,
    deltaY: number,
    cordinatesChanged: boolean
  ): void {
    if (this.tablesLoaded) this.renderRelations();

    this.minimap.onTableMove(table, deltaX, deltaY);

    if (cordinatesChanged) this.callbacks?.tableMove(table.data());
  }

  onTableMoveEnd(table: Table): void {
    this.callbacks?.tableMoveEnd(table.data());
  }

  async render(viewport: Viewport): Promise<void> {
    this.tablesLoaded = false;
    let minX = Number.MAX_SAFE_INTEGER;
    let maxX = Number.MIN_SAFE_INTEGER;
    let minY = Number.MAX_SAFE_INTEGER;
    let maxY = Number.MIN_SAFE_INTEGER;

    this.minimap.removeTables();

    for (const annotation of this.annotations) {
      const annotationElem = annotation.render();
      this.svgElem.appendChild(annotationElem);
      annotation.addedToView();
    }

    for (const [i, table] of this.tables.entries()) {
      this.minimap.createTable(table);

      const tableElm = table.render();
      tableElm.setAttribute("id", `${i}table`);
      this.svgElem.appendChild(tableElm);
      table.addedToView();

      const vertices = table.getVertices();

      this.minimap.setTableDim(
        table,
        vertices.topRight.x - vertices.topLeft.x,
        vertices.bottomLeft.y - vertices.topLeft.y
      );

      table.getColumns().forEach((column) => {
        if (isColumnFk(column)) {
          const relationInfo = {
            fromColumn: column.fk!.column,
            fromTable: column.fk!.table,
            toColumn: column,
            toTable: table,
          };
          const relation = new Relation(relationInfo, this);
          this.relationInfos.push(relation);
        }
      });

      const rightX = table.getVertices().topRight.x;
      if (rightX > maxX) {
        maxX = rightX;
      }

      const leftX = table.getVertices().topLeft.x;
      if (leftX < minX) {
        minX = leftX;
      }

      const topY = table.getVertices().topLeft.y;
      if (topY < minY) {
        minY = topY;
      }

      const bottomY = table.getVertices().bottomLeft.y;
      if (bottomY > maxY) {
        maxY = bottomY;
      }
    }

    if (this.tableArrang === TableArrang.spiral) {
      spiralArrange(this.tables, this.viewWidth, this.viewHeight);
    }

    this.renderRelations();
    await this.setViewport(viewport);
    this.tables.forEach((table) => table.postDraw());
    this.tablesLoaded = true;
  }

  getCords(): Point {
    const bRect = this.svgElem.getBoundingClientRect();
    return {
      x: bRect.left + this.svgContainer.scrollLeft * this.zoom,
      y: bRect.top + this.svgContainer.scrollTop * this.zoom,
    };
  }

  viewportAddjustment(): void {
    if (this.viewBoxVals.x < 0) {
      this.viewBoxVals.x = 0;
    } else {
      const offsetWidth =
        this.viewBoxVals.width + this.viewBoxVals.x - this.viewWidth;
      if (offsetWidth > 0) {
        this.viewBoxVals.x -= offsetWidth;
      }
    }

    if (this.viewBoxVals.y < 0) {
      this.viewBoxVals.y = 0;
    } else {
      const offsetHeight =
        this.viewBoxVals.height + this.viewBoxVals.y - this.viewHeight;
      if (offsetHeight > 0) {
        this.viewBoxVals.y -= offsetHeight;
      }
    }
  }

  zoomIn = (): void => {
    this.setZoom(this.zoom * constant.ZOOM);
  };

  zoomOut = (): void => {
    this.setZoom(this.zoom / constant.ZOOM);
  };

  getZoom(): number {
    return this.zoom;
  }

  getTablePos(tableName: string): Point | string {
    return this.tables.find((table) => table.name === tableName)!.pos;
  }

  getPan(): Point {
    return {
      x: this.svgContainer.scrollLeft,
      y: this.svgContainer.scrollTop,
    };
  }

  getGestureStart(): boolean {
    return this.gestureStart;
  }

  getViewPort(): ViewBoxVals {
    return this.viewBoxVals;
  }

  setPanX(value: number): Promise<void> {
    this.viewBoxVals.x = value / this.zoom;
    const originalScrollLeft = this.svgContainer.scrollLeft;
    this.svgContainer.scrollLeft = value;
    if (this.svgContainer.scrollLeft === originalScrollLeft) {
      return Promise.resolve();
    } else {
      return new Promise((resolve) => (this.panXResolver = resolve));
    }
  }

  setPanY(value: number): Promise<void> {
    this.viewBoxVals.y = value / this.zoom;
    const originalScrollTop = this.svgContainer.scrollTop;
    this.svgContainer.scrollTop = value;
    if (this.svgContainer.scrollTop === originalScrollTop) {
      return Promise.resolve();
    } else {
      return new Promise((resolve) => (this.panYResolver = resolve));
    }
  }

  getMousePosRelativeContainer(event: MouseEvent | TouchEvent): Point {
    const eventVals = normalizeEvent(event);
    return {
      x: eventVals.clientX - this.container.getBoundingClientRect().left,
      y: eventVals.clientY - this.container.getBoundingClientRect().top,
    };
  }

  setCallbacks(callbacks: Callbacks): void {
    this.callbacks = callbacks;
  }

  tableDblClick(table: TableData): void {
    this.callbacks?.tableDblClick(table);
  }

  tableClick(table: TableData): void {
    this.callbacks?.tableClick(table);
  }

  tableContextMenu(table: TableData): void {
    this.callbacks?.tableContextMenu(table);
  }

  relationClick(relationData: RelationData): void {
    this.callbacks?.relationClick(relationData);
  }

  relationDblClick(relationData: RelationData): void {
    this.callbacks?.relationDblClick(relationData);
  }

  relationContextMenu(relationData: RelationData): void {
    this.callbacks?.relationContextMenu(relationData);
  }

  disableTableMovement(value: boolean): void {
    this.isTableMovementDisabled = value;
    if (this.tables) {
      this.tables.forEach((table) => table.disableMovement(value));
    }
  }

  private resetViewBox(): void {
    this.svgElem.setAttribute(
      "viewBox",
      `0 0 ${this.viewWidth} ${this.viewHeight}`
    );
    this.minimap.resetViewBox();
  }

  private async reset(): Promise<void> {
    this.resetViewBox();
    await this.setZoom(1);
    this.relationInfos = [];
  }

  private updatePathIndex(
    relations: Relation[],
    side: Orientation,
    sidesAndCount: SideAndCount[],
    table: Table
  ): void {
    let pathIndex = 0;
    relations.forEach((relation) => {
      const count = sidesAndCount.find((item) => item.side === side)!.count;
      if (relation.fromTable !== relation.toTable) {
        if (relation.fromTable === table) {
          relation.fromPathIndex = pathIndex;
          relation.fromPathCount = count;
        } else {
          relation.toPathIndex = pathIndex;
          relation.toPathCount = count;
        }
        pathIndex++;
      } else {
        relation.fromPathCount = count;
        relation.toPathCount = count;
        relation.fromPathIndex = pathIndex;
        relation.toPathIndex = pathIndex + 1;
        pathIndex += 2;
      }
    });
  }

  private renderRelations(): void {
    this.tables.forEach((table) => {
      const tableRelations = this.getTableRelations(table);

      const pendingSelfRelations = tableRelations.filter((relation) =>
        relation.calcPathTableSides()
      );

      const leftRelations = [] as Relation[],
        rightRelations = [] as Relation[],
        topRelations = [] as Relation[],
        bottomRelations = [] as Relation[];

      for (const tableRelation of tableRelations) {
        let pathSide: Orientation | undefined;
        if (tableRelation.sameTableRelation()) continue;
        if (tableRelation.toTable === table) {
          pathSide = tableRelation.toTablePathSide;
        } else if (tableRelation.fromTable === table) {
          pathSide = tableRelation.fromTablePathSide;
        }
        switch (pathSide) {
          case Orientation.Left:
            leftRelations.push(tableRelation);
            break;
          case Orientation.Right:
            rightRelations.push(tableRelation);
            break;
          case Orientation.Top:
            topRelations.push(tableRelation);
            break;
          case Orientation.Bottom:
            bottomRelations.push(tableRelation);
            break;
        }
      }

      Relation.ySort(leftRelations, table);
      Relation.ySort(rightRelations, table);
      Relation.xSort(topRelations, table);
      Relation.xSort(bottomRelations, table);

      const sidesAndCount: SideAndCount[] = [
        {
          count: leftRelations.length,
          order: 1,
          side: Orientation.Left,
        },
        {
          count: rightRelations.length,
          order: 2,
          side: Orientation.Right,
        },
        {
          count: topRelations.length,
          order: 3,
          side: Orientation.Top,
        },
        {
          count: bottomRelations.length,
          order: 4,
          side: Orientation.Bottom,
        },
      ];

      pendingSelfRelations.forEach((pendingSelfRelation) => {
        const minPathSideCount = sidesAndCount.sort((item1, item2) => {
          const result = item1.count - item2.count;
          if (result === 0) {
            return item1.order - item2.order;
          }
          return result;
        })[0];

        switch (minPathSideCount.side) {
          case Orientation.Left:
            leftRelations.push(pendingSelfRelation);
            pendingSelfRelation.fromTablePathSide = Orientation.Left;
            pendingSelfRelation.toTablePathSide = Orientation.Left;
            break;
          case Orientation.Right:
            rightRelations.push(pendingSelfRelation);
            pendingSelfRelation.fromTablePathSide = Orientation.Right;
            pendingSelfRelation.toTablePathSide = Orientation.Right;
            break;
          case Orientation.Top:
            topRelations.push(pendingSelfRelation);
            pendingSelfRelation.fromTablePathSide = Orientation.Top;
            pendingSelfRelation.toTablePathSide = Orientation.Top;
            break;
          case Orientation.Bottom:
            bottomRelations.push(pendingSelfRelation);
            pendingSelfRelation.fromTablePathSide = Orientation.Bottom;
            pendingSelfRelation.toTablePathSide = Orientation.Bottom;
            break;
        }
        minPathSideCount.count += 2;
      });

      this.updatePathIndex(
        leftRelations,
        Orientation.Left,
        sidesAndCount,
        table
      );
      this.updatePathIndex(
        rightRelations,
        Orientation.Right,
        sidesAndCount,
        table
      );
      this.updatePathIndex(topRelations, Orientation.Top, sidesAndCount, table);
      this.updatePathIndex(
        bottomRelations,
        Orientation.Bottom,
        sidesAndCount,
        table
      );
    });

    this.relationInfos.forEach((relation: Relation) => {
      relation.removeHoverEffect();
      relation.getElems().forEach((elem) => this.svgElem.removeChild(elem));
      const elems = relation.render();
      elems.forEach((elem) => this.svgElem.prepend(elem!));
    });
  }

  // TODO: call cleanup when appropriate
  cleanup(): void {
    this.minimap.cleanup();

    this.mainElem.removeEventListener(
      "mousemove",
      this.onMouseMove as CommonEventListener
    );

    window.removeEventListener("resize", this.windowResizeEvent.bind(this));
    this.mainElem.removeEventListener("touchmove", this.onTouchMove);
    this.container.removeEventListener("mousedown", this.onMousedown);
    this.mainElem.removeEventListener("mouseup", this.onMouseup);
    this.container.removeEventListener(
      "mouseleave",
      this.minimap.onContainerMouseLeave!
    );
    this.container.removeEventListener(
      "mouseup",
      this.minimap.onContainerMouseUp!
    );

    this.tables.forEach((table) => {
      table.cleanup();
    });

    this.svgContainer.removeEventListener("scroll", this.onScroll);
    this.svgContainer.removeEventListener("click", this.onClick);
    this.container.removeEventListener("wheel", this.onWheel);

    if (isSafari) {
      this.container.removeEventListener(
        "gesturestart",
        this.onGesturestart as CommonEventListener
      );
      this.container.removeEventListener(
        "gesturechange",
        this.onGesturechange as CommonEventListener,
        true
      );

      this.container.removeEventListener("gestureend", this.onGestureend);
    } else {
      this.container.removeEventListener("pointerdown", this.onPointerdown);
      this.container.removeEventListener("pointermove", this.onPointermove);

      this.container.removeEventListener("pointerup", this.onPointer, true);
      this.container.removeEventListener("pointercancel", this.onPointer, true);
      this.container.removeEventListener("pointerout", this.onPointer, true);
      this.container.removeEventListener("pointerleave", this.onPointer, true);
    }
  }

  setViewport(type = Viewport.noChange): Promise<[void, void]> {
    let viewportX;
    let viewportY;
    switch (type) {
      case Viewport.noChange:
        return Promise.resolve([undefined, undefined]);
      case Viewport.centerByTablesWeight:
        {
          let totalX = 0;
          let totalY = 0;
          const filteredTables = this.tables.filter((table) => {
            const data = table.data();
            return data.pos.x >= 0 && data.pos.y >= 0;
          });
          filteredTables.forEach((table) => {
            const data = table.data();
            totalX += data.pos.x + data.width / 2;
            totalY += data.pos.y + data.height / 2;
          });
          const centerX = totalX / filteredTables.length;
          const centerY = totalY / filteredTables.length;
          viewportX = centerX - this.viewBoxVals.width / 2;
          viewportY = centerY - this.viewBoxVals.height / 2;
        }
        break;
      case Viewport.center:
        {
          const width = this.svgContainer.clientWidth;
          const height = this.svgContainer.clientHeight;
          viewportX = this.viewWidth / 2 - width / 2;
          viewportY = this.viewHeight / 2 - height / 2;
        }
        break;
      default:
        // centerByTables
        {
          if (this.tables.length === 0) {
            return this.setViewport(Viewport.center);
          }
          let minX = Number.MAX_SAFE_INTEGER;
          let minY = Number.MAX_SAFE_INTEGER;
          let maxX = Number.MIN_SAFE_INTEGER;
          let maxY = Number.MIN_SAFE_INTEGER;
          this.tables.forEach((table) => {
            const data = table.data();
            if (data.pos.x >= 0 && data.pos.y >= 0) {
              if (data.pos.x < minX) minX = data.pos.x;
              if (data.pos.y < minY) minY = data.pos.y;
              if (data.pos.x + data.width > maxX)
                maxX = data.pos.x + data.width;
              if (data.pos.y + data.height > maxY)
                maxY = data.pos.y + data.height;
            }
          });
          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;
          viewportX = centerX - this.viewBoxVals.width / 2;
          viewportY = centerY - this.viewBoxVals.height / 2;
          if (viewportX < 0) viewportX = 0;
          if (viewportY < 0) viewportY = 0;
        }
        break;
    }
    return Promise.all([this.setPanX(viewportX), this.setPanY(viewportY)]);
  }

  private getTableRelations(table: Table): Relation[] {
    return this.relationInfos.filter((relations) => {
      return relations.fromTable === table || relations.toTable === table;
    });
  }

  private windowResizeEvent(): void {
    this.viewBoxVals.width = this.svgContainer.clientWidth / this.zoom;
    this.viewBoxVals.height = this.svgContainer.clientHeight / this.zoom;

    this.viewportAddjustment();

    this.minimap.setMinimapViewPoint(this.viewBoxVals);
  }

  private async setZoom(
    zoom: number,
    targetX = this.svgContainer.clientWidth / 2,
    targetY = this.svgContainer.clientHeight / 2
  ): Promise<void> {
    let minZoomValue: number;
    if (this.svgContainer.offsetWidth > this.svgContainer.offsetHeight) {
      minZoomValue = this.svgContainer.clientWidth / this.viewWidth;
    } else {
      minZoomValue = this.svgContainer.clientHeight / this.viewHeight;
    }
    if (minZoomValue > zoom) {
      zoom = minZoomValue;
    }

    if (zoom > constant.MAXZOOM_VALUE) {
      zoom = constant.MAXZOOM_VALUE;
    }

    if (targetX == null) targetX = this.svgContainer.clientWidth / 2;
    if (targetY == null) targetY = this.svgContainer.clientHeight / 2;

    this.svgElem.style.height = `${this.viewHeight * zoom}px`;
    this.svgElem.style.width = `${this.viewWidth * zoom}px`;

    const newWidth = this.svgContainer.clientWidth / zoom;
    const newHeight = this.svgContainer.clientHeight / zoom;

    const resizeWidth = newWidth - this.viewBoxVals.width;
    const resizeHeight = newHeight - this.viewBoxVals.height;

    const dividerX = this.svgContainer.clientWidth / targetX;
    const dividerY = this.svgContainer.clientHeight / targetY;

    this.viewBoxVals.width = newWidth;
    this.viewBoxVals.height = newHeight;

    this.viewBoxVals.x -= resizeWidth / dividerX;
    this.viewBoxVals.y -= resizeHeight / dividerY;

    this.viewportAddjustment();

    const newScrollLeft = this.viewBoxVals.x * zoom;
    const newScrollTop = this.viewBoxVals.y * zoom;
    if (
      this.svgContainer.scrollLeft !== newScrollLeft ||
      this.svgContainer.scrollTop !== newScrollTop
    ) {
      this.disbleScrollEvent = true;
      this.svgContainer.scrollLeft = newScrollLeft;
      this.svgContainer.scrollTop = newScrollTop;
    } else {
      this.disbleScrollEvent = false;
    }

    this.minimap.setMinimapViewPoint(this.viewBoxVals);

    if (this.zoom < zoom) {
      this.callbacks?.zoomIn(zoom);
    } else if (this.zoom > zoom) {
      this.callbacks?.zoomOut(zoom);
    }
    this.zoom = zoom;

    if (this.disbleScrollEvent) {
      return new Promise((resolve) => (this.zoomResolve = resolve));
    } else {
      return Promise.resolve();
    }
  }

  private noneBlockingEvent(event: Event): boolean {
    return !event.composedPath().some((item) => {
      const htmlElement = item as HTMLElement;
      return (
        htmlElement.id === "minimap-container" ||
        htmlElement.classList?.contains("table") ||
        htmlElement.classList?.contains("annotation")
      );
    });
  }

  private onScroll = () => {
    if (!this.disbleScrollEvent) {
      this.viewBoxVals.x = this.svgContainer.scrollLeft / this.zoom;
      this.viewBoxVals.y = this.svgContainer.scrollTop / this.zoom;
      this.minimap.setMinimapViewPoint(this.viewBoxVals);
      if (this.panXResolver) {
        this.panXResolver();
        delete this.panXResolver;
      }
      if (this.panYResolver) {
        this.panYResolver();
        delete this.panYResolver;
      }
    }
    if (this.zoomResolve) {
      this.zoomResolve();
      delete this.zoomResolve;
    }
    this.disbleScrollEvent = false;
  };

  private onWheel = (event: WheelEvent) => {
    if (event.ctrlKey) {
      const clientRect = this.svgContainer.getBoundingClientRect();
      const targetX = event.clientX - clientRect.left;
      const targetY = event.clientY - clientRect.top;
      this.setZoom(
        this.zoom - event.deltaY * constant.SCROLL_TO_ZOOM_MULTIPLIER,
        targetX,
        targetY
      );
      event.preventDefault();
    }
  };

  private onTouchMove = (event: Event) => {
    // Don't move viewport when table is being moved
    if (!this.noneBlockingEvent(event)) event.preventDefault();
  };

  private onGesturestart = (event: GestureEvent) => {
    this.gestureStart = true;
    if (event.scale != null) {
      this.safariScale = event.scale;
    }
    event.preventDefault();
  };

  private onGesturechange = (event: GestureEvent) => {
    event.preventDefault();
    const clientRect = this.svgContainer.getBoundingClientRect();
    const targetX = event.clientX - clientRect.left;
    const targetY = event.clientY - clientRect.top;
    const scaleChange = event.scale - this.safariScale;
    this.setZoom(this.zoom + scaleChange, targetX, targetY);
    this.safariScale = event.scale;
  };

  private onGestureend = () => {
    this.gestureStart = false;
  };

  private prevMouseCordX!: number;
  private prevMouseCordY!: number;

  private onMouseMove = (event: MouseEvent) => {
    event.preventDefault();
    if (this.noneBlockingEvent(event)) {
      const deltaX = event.clientX - this.prevMouseCordX;
      const deltaY = event.clientY - this.prevMouseCordY;
      this.prevMouseCordY = event.clientY;
      this.prevMouseCordX = event.clientX;
      const originalScrollLeft = this.svgContainer.scrollLeft;
      this.svgContainer.scrollLeft -= deltaX;
      if (originalScrollLeft !== this.svgContainer.scrollLeft) {
        this.viewBoxVals.x -= deltaX;
      }
      const originalScrollTop = this.svgContainer.scrollTop;
      this.svgContainer.scrollTop -= deltaY;
      if (originalScrollTop !== this.svgContainer.scrollTop) {
        this.viewBoxVals.y -= deltaY;
      }
      this.minimap.setMinimapViewPoint(this.viewBoxVals);
    }
  };

  private onMousedown = (event: MouseEvent) => {
    if (event.button === 0 && this.noneBlockingEvent(event)) {
      this.svgElem.classList.add("pan");
      this.prevMouseCordX = event.clientX;
      this.prevMouseCordY = event.clientY;
      this.mainElem.addEventListener(
        "mousemove",
        this.onMouseMove as CommonEventListener
      );
    }
  };

  private onMouseup = () => {
    this.svgElem.classList.remove("pan");
    this.mainElem.removeEventListener(
      "mousemove",
      this.onMouseMove as CommonEventListener
    );
  };

  private evCache: PointerEvent[] = [];
  private prevDiff?: number;

  private onPointerdown = (event: PointerEvent) => {
    this.evCache.push(event);
  };

  private onPointermove = (event: PointerEvent) => {
    const index = this.evCache.findIndex(
      (item) => item.pointerId === event.pointerId
    );
    if (index !== -1) {
      this.evCache[index] = event;
    }
    if (this.evCache.length == 2) {
      this.gestureStart = true;
      // Calculate the distance between the two pointers
      const p1 = { x: this.evCache[0].clientX, y: this.evCache[0].clientY };
      const p2 = { x: this.evCache[1].clientX, y: this.evCache[1].clientY };
      const centerPoint = center(p1, p2);
      const curDiff = distance(p1, p2);
      if (this.prevDiff != null) {
        const delta = curDiff - this.prevDiff;
        event.preventDefault();
        this.setZoom(
          this.zoom + delta * constant.PINCH_TO_ZOOM_MULTIPLIER,
          centerPoint.x,
          centerPoint.y
        );
      }
      this.prevDiff = curDiff;
    }
  };

  private onPointer = (event: PointerEvent) => {
    // Remove this pointer from the cache and reset the target's
    // background and border
    const index = this.evCache.findIndex(
      (item) => item.pointerId === event.pointerId
    );
    if (index !== -1) this.evCache.splice(index, 1);

    // If the number of pointers down is less than two then reset diff tracker
    if (this.evCache.length < 2) {
      this.prevDiff = undefined;
      this.gestureStart = false;
    }
  };

  private onClick = (event: MouseEvent) => {
    const x = event.offsetX / this.zoom;
    const y = event.offsetY / this.zoom;
    this.callbacks?.viewportClick(x, y);
  };

  private setUpEvents(): void {
    window.addEventListener("resize", this.windowResizeEvent.bind(this));

    this.mainElem.addEventListener("touchmove", this.onTouchMove);

    this.container.addEventListener("mouseleave", () => {
      this.svgElem.classList.remove("pan");
      this.mainElem.removeEventListener(
        "mousemove",
        this.onMouseMove as CommonEventListener
      );
    });

    this.container.addEventListener("mousedown", this.onMousedown);

    this.mainElem.addEventListener("mouseup", this.onMouseup);

    this.container.addEventListener(
      "mouseleave",
      this.minimap.onContainerMouseLeave!
    );
    this.container.addEventListener(
      "mouseup",
      this.minimap.onContainerMouseUp!
    );

    if (this.tables) {
      this.tables.forEach((table) => {
        table.setMoveListener(this.onTableMove.bind(this));
      });
    }

    this.svgContainer.addEventListener("scroll", this.onScroll);

    this.svgContainer.addEventListener("click", this.onClick);

    this.container.addEventListener("wheel", this.onWheel);

    if (isSafari) {
      this.container.addEventListener(
        "gesturestart",
        this.onGesturestart as CommonEventListener
      );
      this.container.addEventListener(
        "gesturechange",
        this.onGesturechange as CommonEventListener,
        true
      );

      this.container.addEventListener("gestureend", this.onGestureend);
    } else {
      this.container.addEventListener("pointerdown", this.onPointerdown);
      this.container.addEventListener("pointermove", this.onPointermove);

      this.container.addEventListener("pointerup", this.onPointer, true);
      this.container.addEventListener("pointercancel", this.onPointer, true);
      this.container.addEventListener("pointerout", this.onPointer, true);
      this.container.addEventListener("pointerleave", this.onPointer, true);
    }
  }
}
