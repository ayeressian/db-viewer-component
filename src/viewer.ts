import constant from "./const";
import Minimap from "./minimap";
import Relation, { RelationData } from "./realtion/relation";
import spiralArrange from "./spiral-arrange";
import Table from "./table/table";
import { isColumnFk } from "./types/column";
import Callbacks from "./types/callbacks";
import TableData from "./types/table-data";
import ViewBoxVals from "./types/view-box-vals";
import Point from "./types/point";
import { insertAfter, normalizeEvent } from "./util";
import { TableArrang, Viewport } from "./types/schema";
import Annotation from "./annotation";
import Relations from "./realtion/relations";
import ViewerEvents from "./viewer-events";

export default class Viewer {
  private isTableMovementDisabled = false;
  private annotations: Annotation[] = [];
  private tables: Table[] = [];
  private container: HTMLElement;
  private svgElem: SVGGraphicsElement;
  private svgContainer: HTMLElement;
  private minimap: Minimap;
  private disbleScrollEvent: boolean;
  private viewBoxVals: ViewBoxVals;
  private zoom!: number;
  private callbacks!: Callbacks;
  private tablesLoaded = false;
  private viewLoaded: Promise<void>;
  private viewerEvents: ViewerEvents;

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

    this.disbleScrollEvent = false;

    const width = this.svgContainer.clientWidth;
    const height = this.svgContainer.clientHeight;
    this.viewBoxVals = {
      height,
      width,
      x: 0,
      y: 0,
    };

    this.viewerEvents = new ViewerEvents(
      this.svgContainer,
      this.viewBoxVals,
      this.minimap,
      this.svgElem,
      this.mainElem,
      this.container,
      this.tables,
      (x: number, y: number) => this.callbacks.viewportClick(x, y),
      this.setZoom.bind(this),
      this.getZoom.bind(this),
      this.viewportAddjustment.bind(this)
    );

    this.minimap.setMinimapViewPoint(this.viewBoxVals);

    this.viewLoaded = this.reset().then(() => {
      void this.setViewport(Viewport.center);
    });
  }

  private addToViewer = (elem: SVGElement): void => {
    const annotations = this.svgElem.querySelectorAll("g.annotation");
    const lastAnnotation = annotations[annotations.length - 1];
    if (lastAnnotation) insertAfter(elem, lastAnnotation);
    else this.svgElem.prepend(elem);
  };

  private relations = new Relations(this.addToViewer);

  getTableMovementDisabled(): boolean {
    return this.isTableMovementDisabled;
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
    this.relations.removeAll();
    this.svgElem.innerHTML = "";
    this.tables = tables;
    this.annotations = annotations;
    annotations.forEach((annotation) => {
      annotation.setViewer(this, this.annotationMove, this.annotationResize);
    });
    tables.forEach((table) => {
      table.setViewer(this, {
        tableDblClick: this.tableDblClick,
        tableClick: this.tableClick,
        tableContextMenu: this.tableContextMenu,
        tableMove: this.tableMove,
        tableMoveEnd: this.tableMoveEnd,
      });
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

  private tableMove = (
    table: Table,
    deltaX: number,
    deltaY: number,
    cordinatesChanged: boolean
  ): void => {
    if (this.tablesLoaded) this.relations.draw(this.tables);

    this.minimap.onTableMove(table, deltaX, deltaY);

    if (cordinatesChanged) this.callbacks?.tableMove(table.data());
  };

  private annotationMove = (
    annotation: Annotation,
    deltaX: number,
    deltaY: number,
    cordinatesChanged: boolean
  ): void => {
    this.minimap.onAnnotationMove(annotation, deltaX, deltaY);
    if (cordinatesChanged) this.callbacks?.annotationMove(annotation.data());
  };

  private annotationResize = (
    annotation: Annotation,
    width: number,
    height: number
  ): void => {
    this.minimap.setAnnotationDim(annotation, width, height);
  };

  private tableMoveEnd = (table: Table): void => {
    this.callbacks?.tableMoveEnd(table.data());
  };

  async render(viewport: Viewport): Promise<void> {
    this.tablesLoaded = false;
    let minX = Number.MAX_SAFE_INTEGER;
    let maxX = Number.MIN_SAFE_INTEGER;
    let minY = Number.MAX_SAFE_INTEGER;
    let maxY = Number.MIN_SAFE_INTEGER;

    this.minimap.removeTables();

    for (const annotation of this.annotations) {
      this.minimap.createAnnotation(annotation);
      const annotationElem = annotation.render();

      this.svgElem.appendChild(annotationElem);

      const vertices = annotation.getVertices();

      this.minimap.setAnnotationDim(
        annotation,
        vertices.topRight.x - vertices.topLeft.x,
        vertices.bottomLeft.y - vertices.topLeft.y
      );
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
          const relation = new Relation(relationInfo, {
            relationClick: this.relationClick,
            relationContextMenu: this.relationContextMenu,
            relationDblClick: this.relationDblClick,
          });
          this.relations.addRelation(relation);
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

    this.relations.draw(this.tables);
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

  private viewportAddjustment(): void {
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
    return this.viewerEvents.getGestureStart();
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
      return new Promise((resolve) =>
        this.viewerEvents.setPanXResolver(resolve)
      );
    }
  }

  setPanY(value: number): Promise<void> {
    this.viewBoxVals.y = value / this.zoom;
    const originalScrollTop = this.svgContainer.scrollTop;
    this.svgContainer.scrollTop = value;
    if (this.svgContainer.scrollTop === originalScrollTop) {
      return Promise.resolve();
    } else {
      return new Promise((resolve) =>
        this.viewerEvents.setPanYResolver(resolve)
      );
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

  private tableDblClick = (table: TableData): void => {
    this.callbacks?.tableDblClick(table);
  };

  private tableClick = (table: TableData): void => {
    this.callbacks?.tableClick(table);
  };

  private tableContextMenu = (table: TableData): void => {
    this.callbacks?.tableContextMenu(table);
  };

  private relationClick = (relationData: RelationData): void => {
    this.callbacks?.relationClick(relationData);
  };

  private relationDblClick = (relationData: RelationData): void => {
    this.callbacks?.relationDblClick(relationData);
  };

  private relationContextMenu = (relationData: RelationData): void => {
    this.callbacks?.relationContextMenu(relationData);
  };

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
    this.relations.removeAll();
  }

  private setViewportCenterByTableWeight(): {
    viewportX: number;
    viewportY: number;
  } {
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
    const viewportX = centerX - this.viewBoxVals.width / 2;
    const viewportY = centerY - this.viewBoxVals.height / 2;
    return { viewportX, viewportY };
  }

  private setViewportCenter(): { viewportX: number; viewportY: number } {
    const width = this.svgContainer.clientWidth;
    const height = this.svgContainer.clientHeight;
    const viewportX = this.viewWidth / 2 - width / 2;
    const viewportY = this.viewHeight / 2 - height / 2;
    return { viewportX, viewportY };
  }

  private setViewportCenterByTables(): {
    viewportX: number;
    viewportY: number;
  } {
    if (this.tables.length === 0) {
      return this.setViewportCenter();
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
        if (data.pos.x + data.width > maxX) maxX = data.pos.x + data.width;
        if (data.pos.y + data.height > maxY) maxY = data.pos.y + data.height;
      }
    });
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    let viewportX = centerX - this.viewBoxVals.width / 2;
    let viewportY = centerY - this.viewBoxVals.height / 2;
    if (viewportX < 0) viewportX = 0;
    if (viewportY < 0) viewportY = 0;
    return { viewportX, viewportY };
  }

  setViewport(type = Viewport.noChange): Promise<[void, void]> {
    let viewportX;
    let viewportY;
    console.log(type);

    switch (type) {
      case Viewport.noChange:
        return Promise.resolve([undefined, undefined]);
      case Viewport.centerByTablesWeight:
        ({ viewportX, viewportY } = this.setViewportCenterByTableWeight());
        break;
      case Viewport.center:
        ({ viewportX, viewportY } = this.setViewportCenter());
        break;
      default:
        // centerByTables
        ({ viewportX, viewportY } = this.setViewportCenterByTables());
        break;
    }
    return Promise.all([this.setPanX(viewportX), this.setPanY(viewportY)]);
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
      return new Promise((resolve) =>
        this.viewerEvents.setZoomResolver(resolve)
      );
    } else {
      return Promise.resolve();
    }
  }
}
