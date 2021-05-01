import constant from "./const";
import Minimap from "./minimap";
import Relation, { RelationData } from "./realtion/relation";
import spiralArrange from "./spiral-arrange";
import Table from "./table";
import { isColumnFk } from "./types/column";
import Callbacks from "./types/callbacks";
import Orientation from "./types/orientation";
import TableData from "./types/table-data";
import ViewBoxVals from "./types/view-box-vals";
import Point from "./types/point";
import { normalizeEvent } from "./util";
import { TableArrang, Viewport } from "./types/schema";
import ViewerEvents from "./viewer-events";

type SidesAndCount = { [K in Orientation]: number };

export default class Viewer {
  isTableMovementDisabled = false;
  tables: Table[] = [];
  private container: HTMLElement;
  private svgElem: SVGGraphicsElement;
  private svgContainer: HTMLElement;
  private minimap: Minimap;
  private disbleScrollEvent: boolean;
  private viewBoxVals: ViewBoxVals;
  private zoom!: number;
  private callbacks!: Callbacks;
  private relationInfos!: Relation[];
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
      this,
      this.minimap,
      this.svgElem,
      this.mainElem,
      this.container,
      this.tables,
      this.callbacks,
      this.setZoom.bind(this),
      this.onTableMove
    );

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
    viewport: Viewport = Viewport.centerByTables,
    tableArrang: TableArrang = TableArrang.default,
    viewWidth = constant.VIEW_WIDTH,
    viewHeight = constant.VIEW_HEIGHT
  ): Promise<void> {
    this.relationInfos = [];
    this.svgElem.innerHTML = "";
    this.tables = tables;
    tables.forEach((table) => {
      table.setVeiwer(this);
      table.setMoveListener(this.onTableMove);
      table.setMoveEndListener(this.onTableMoveEnd);
      table.disableMovement(this.isTableMovementDisabled);
    });
    this.tableArrang = tableArrang;
    await this.draw(viewport);

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

  private onTableMove = (
    table: Table,
    deltaX: number,
    deltaY: number,
    cordinatesChanged: boolean
  ): void => {
    if (this.tablesLoaded) this.drawRelations();

    this.minimap.onTableMove(table, deltaX, deltaY);

    if (cordinatesChanged) this.callbacks?.tableMove(table.data());
  };

  onTableMoveEnd = (table: Table): void => {
    this.callbacks?.tableMoveEnd(table.data());
  };

  async draw(viewport: Viewport): Promise<void> {
    this.tablesLoaded = false;
    let minX = Number.MAX_SAFE_INTEGER;
    let maxX = Number.MIN_SAFE_INTEGER;
    let minY = Number.MAX_SAFE_INTEGER;
    let maxY = Number.MIN_SAFE_INTEGER;

    this.minimap.removeTables();

    let i = 0;
    for (const table of this.tables) {
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
      ++i;
    }

    if (this.tableArrang === TableArrang.spiral) {
      spiralArrange(this.tables, this.viewWidth, this.viewHeight);
    }

    this.drawRelations();
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
    count: number,
    table: Table
  ): void {
    let pathIndex = 0;
    relations.forEach((relation) => {
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

  private getTableRelationsByOrientation(
    table: Table,
    tableRelations: Relation[]
  ): {
    leftRelations: Relation[];
    rightRelations: Relation[];
    topRelations: Relation[];
    bottomRelations: Relation[];
  } {
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

    return { leftRelations, rightRelations, topRelations, bottomRelations };
  }

  private minSide(sidesAndCount: SidesAndCount): Orientation {
    const [side] = Object.entries(sidesAndCount).reduce(
      (
        [minOrientation, minCount],
        [orientationString, count]
      ): [Orientation, number] => {
        const orientation = parseInt(orientationString) as Orientation;
        if (count < minCount) return [orientation, count];
        return [minOrientation, minCount];
      },
      [Orientation.Left, Number.MAX_SAFE_INTEGER] as [Orientation, number]
    );
    return side;
  }

  private drawRelations(): void {
    this.tables.forEach((table) => {
      const tableRelations = this.getTableRelations(table);
      const pendingSelfRelations = tableRelations.filter((relation) =>
        relation.calcPathTableSides()
      );
      const {
        leftRelations,
        rightRelations,
        topRelations,
        bottomRelations,
      } = this.getTableRelationsByOrientation(table, tableRelations);

      const sidesAndCount: SidesAndCount = {
        [Orientation.Left]: leftRelations.length,
        [Orientation.Right]: rightRelations.length,
        [Orientation.Top]: topRelations.length,
        [Orientation.Bottom]: bottomRelations.length,
      };

      pendingSelfRelations.forEach((pendingSelfRelation) => {
        const minSide = this.minSide(sidesAndCount);

        switch (minSide) {
          case Orientation.Left:
            leftRelations.push(pendingSelfRelation);
            break;
          case Orientation.Right:
            rightRelations.push(pendingSelfRelation);
            break;
          case Orientation.Top:
            topRelations.push(pendingSelfRelation);
            break;
          case Orientation.Bottom:
            bottomRelations.push(pendingSelfRelation);
            break;
        }
        pendingSelfRelation.fromTablePathSide = minSide;
        pendingSelfRelation.toTablePathSide = minSide;
        sidesAndCount[minSide] += 2;
      });
      this.updatePathIndex(
        leftRelations,
        sidesAndCount[Orientation.Left],
        table
      );
      this.updatePathIndex(
        rightRelations,
        sidesAndCount[Orientation.Right],
        table
      );
      this.updatePathIndex(topRelations, sidesAndCount[Orientation.Top], table);
      this.updatePathIndex(
        bottomRelations,
        sidesAndCount[Orientation.Bottom],
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

  private getTableRelations(table: Table): Relation[] {
    return this.relationInfos.filter((relations) => {
      return relations.fromTable === table || relations.toTable === table;
    });
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
