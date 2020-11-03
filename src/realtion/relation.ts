import constant from "../const";
import { segmentIntersection } from "../math-util";
import Table from "../table";
import { Column } from "../types/column";
import Orientation from "../types/orientation";
import Vertices from "../types/vertices";
import Point from "../types/point";
import selfRelationLeft from "./self-relation-left";
import threeLinePathHoriz from "./three-line-path-horiz";
import twoLinePathFlatTop from "./two-line-path-flat-top";
import twoLinePathFlatBottom from "./two-line-path-flat-bottom";
import selfRelationRight from "./self-relation-right";
import selfRelationTop from "./self-relation-top";
import threeLinePathVert from "./three-line-path-vert";
import selfRelationBottom from "./self-relation-bottom";
import Viewer from "../viewer";

enum Axis {
  x = "x",
  y = "y",
}

interface BasicRelation {
  fromColumn: Column;
  fromTable: Table;
  toColumn: Column;
  toTable: Table;
}

export class RelationData {
  constructor(
    public fromTable: string,
    public toTable: string,
    public fromColumn: string,
    public toColumn: string
  ) {}
}

export default class Relation {
  static ySort(arr: Relation[], table: Table): void {
    Relation.sort(arr, table, Axis.y);
  }

  static xSort(arr: Relation[], table: Table): void {
    Relation.sort(arr, table, Axis.x);
  }

  private static sort(arr: Relation[], table: Table, axis: Axis): void {
    arr.sort((r1, r2) => {
      if (r1.fromIntersectPoint == null || r2.fromIntersectPoint == null) {
        return -1;
      }
      if (r1.fromTable === table) {
        if (r2.fromTable === table) {
          return r1.fromIntersectPoint[axis] - r2.fromIntersectPoint[axis];
        }
        return r1.fromIntersectPoint[axis] - r2.toIntersectPoint![axis];
      } else {
        if (r2.fromTable === table) {
          return r1.toIntersectPoint![axis] - r2.fromIntersectPoint[axis];
        }
        return r1.toIntersectPoint![axis] - r2.toIntersectPoint![axis];
      }
    });
  }
  private fromColumn: Column;
  private toColumn: Column;
  private pathElem?: SVGGraphicsElement;
  private fromIntersectPoint?: Point;
  private toIntersectPoint?: Point;
  private highlightTrigger?: SVGGraphicsElement;

  fromPathCount?: number;
  fromPathIndex?: number;
  fromTable: Table;
  toPathCount?: number;
  toPathIndex?: number;
  toTable: Table;
  fromTablePathSide?: Orientation;
  toTablePathSide?: Orientation;

  constructor(
    { fromColumn, fromTable, toColumn, toTable }: BasicRelation,
    private viewer: Viewer
  ) {
    this.fromColumn = fromColumn;
    this.fromTable = fromTable;
    this.toColumn = toColumn;
    this.toTable = toTable;
  }

  update(): void {
    this.getTableRelationSide();
  }

  removeHoverEffect(): void {
    this.onMouseLeave();
  }

  render(): [SVGGraphicsElement?, SVGGraphicsElement?] {
    const fromTableVertices = this.fromTable.getVertices();
    const toTableVertices = this.toTable.getVertices();

    const toMany = !this.toColumn.uq;

    type StartEndMethod = (
      tableVertices: Vertices,
      pathIndex: number,
      pathCount: number
    ) => Point;

    let startMethod: StartEndMethod;
    let endMethod: StartEndMethod;
    let resultMethod: (
      start: Point,
      end: Point,
      oneTo?: boolean,
      toMany?: boolean
    ) => string;

    switch (this.fromTablePathSide) {
      case Orientation.Left:
        {
          startMethod = this.getLeftSidePathCord;
          switch (this.toTablePathSide) {
            case Orientation.Left:
              endMethod = this.getLeftSidePathCord;
              resultMethod = selfRelationLeft;
              break;
            case Orientation.Right:
              endMethod = this.getRightSidePathCord;
              resultMethod = threeLinePathHoriz;
              break;
            case Orientation.Top:
              endMethod = this.getTopSidePathCord;
              resultMethod = twoLinePathFlatTop;
              break;
            case Orientation.Bottom:
              endMethod = this.getBottomSidePathCord;
              resultMethod = twoLinePathFlatBottom;
              break;
          }
        }
        break;
      case Orientation.Right:
        {
          startMethod = this.getRightSidePathCord;
          switch (this.toTablePathSide) {
            case Orientation.Left:
              endMethod = this.getLeftSidePathCord;
              resultMethod = threeLinePathHoriz;
              break;
            case Orientation.Right:
              endMethod = this.getRightSidePathCord;
              resultMethod = selfRelationRight;
              break;
            case Orientation.Top:
              endMethod = this.getTopSidePathCord;
              resultMethod = twoLinePathFlatTop;
              break;
            case Orientation.Bottom:
              endMethod = this.getBottomSidePathCord;
              resultMethod = twoLinePathFlatBottom;
              break;
          }
        }
        break;
      case Orientation.Top:
        {
          startMethod = this.getTopSidePathCord;
          switch (this.toTablePathSide) {
            case Orientation.Left:
              endMethod = this.getLeftSidePathCord;
              resultMethod = twoLinePathFlatTop;
              break;
            case Orientation.Right:
              endMethod = this.getRightSidePathCord;
              resultMethod = twoLinePathFlatTop;
              break;
            case Orientation.Top:
              endMethod = this.getTopSidePathCord;
              resultMethod = selfRelationTop;
              break;
            case Orientation.Bottom:
              endMethod = this.getBottomSidePathCord;
              resultMethod = threeLinePathVert;
              break;
          }
        }
        break;
      case Orientation.Bottom:
        {
          startMethod = this.getBottomSidePathCord;
          switch (this.toTablePathSide) {
            case Orientation.Left:
              endMethod = this.getLeftSidePathCord;
              resultMethod = twoLinePathFlatBottom;
              break;
            case Orientation.Right:
              endMethod = this.getRightSidePathCord;
              resultMethod = twoLinePathFlatBottom;
              break;
            case Orientation.Top:
              endMethod = this.getTopSidePathCord;
              resultMethod = threeLinePathVert;
              break;
            case Orientation.Bottom:
              endMethod = this.getBottomSidePathCord;
              resultMethod = selfRelationBottom;
              break;
          }
        }
        break;
    }

    // In case of tables overlapping there won't be any result
    if (startMethod! && endMethod!) {
      const start = startMethod!.call(
        this,
        fromTableVertices,
        this.fromPathIndex!,
        this.fromPathCount!
      );
      const end = endMethod!.call(
        this,
        toTableVertices,
        this.toPathIndex!,
        this.toPathCount!
      );
      const result = resultMethod!.call(
        this,
        start,
        end,
        this.toColumn.nn,
        toMany
      );
      const path = this.createPath(result);
      const highlight = this.createHighlightTrigger(result);
      this.setElems(path, highlight);
    }
    if (!this.pathElem) {
      return [];
    }
    return [this.highlightTrigger, this.pathElem];
  }

  sameTableRelation(): boolean {
    return this.fromTable === this.toTable;
  }

  calcPathTableSides(): boolean {
    if (this.fromTable === this.toTable) {
      return true;
    }
    const fromTableCenter = this.fromTable.getCenter();
    const toTableCenter = this.toTable.getCenter();

    const fromTableSides = this.fromTable.getVertices();

    const intersectFromTableRightSide = segmentIntersection(
      fromTableCenter,
      toTableCenter,
      fromTableSides.topRight,
      fromTableSides.bottomRight
    );
    if (intersectFromTableRightSide) {
      this.fromIntersectPoint = intersectFromTableRightSide;
      this.fromTablePathSide = Orientation.Right;
    }
    const intersectFromTableLeftSide = segmentIntersection(
      fromTableCenter,
      toTableCenter,
      fromTableSides.topLeft,
      fromTableSides.bottomLeft
    );
    if (intersectFromTableLeftSide) {
      this.fromIntersectPoint = intersectFromTableLeftSide;
      this.fromTablePathSide = Orientation.Left;
    }
    const intersectFromTableTopSide = segmentIntersection(
      fromTableCenter,
      toTableCenter,
      fromTableSides.topLeft,
      fromTableSides.topRight
    );
    if (intersectFromTableTopSide) {
      this.fromIntersectPoint = intersectFromTableTopSide;
      this.fromTablePathSide = Orientation.Top;
    }
    const intersectFromTableBottomSide = segmentIntersection(
      fromTableCenter,
      toTableCenter,
      fromTableSides.bottomLeft,
      fromTableSides.bottomRight
    );
    if (intersectFromTableBottomSide) {
      this.fromIntersectPoint = intersectFromTableBottomSide;
      this.fromTablePathSide = Orientation.Bottom;
    }

    const toTableSides = this.toTable.getVertices();

    const intersectToTableRightSide = segmentIntersection(
      fromTableCenter,
      toTableCenter,
      toTableSides.topRight,
      toTableSides.bottomRight
    );
    if (intersectToTableRightSide) {
      this.toIntersectPoint = intersectToTableRightSide;
      this.toTablePathSide = Orientation.Right;
    }
    const intersectToTableLeftSide = segmentIntersection(
      fromTableCenter,
      toTableCenter,
      toTableSides.topLeft,
      toTableSides.bottomLeft
    );
    if (intersectToTableLeftSide) {
      this.toIntersectPoint = intersectToTableLeftSide;
      this.toTablePathSide = Orientation.Left;
    }
    const intersectToTableTopSide = segmentIntersection(
      fromTableCenter,
      toTableCenter,
      toTableSides.topLeft,
      toTableSides.topRight
    );
    if (intersectToTableTopSide) {
      this.toIntersectPoint = intersectToTableTopSide;
      this.toTablePathSide = Orientation.Top;
    }
    const intersectToTableBottomSide = segmentIntersection(
      fromTableCenter,
      toTableCenter,
      toTableSides.bottomRight,
      toTableSides.bottomLeft
    );
    if (intersectToTableBottomSide) {
      this.toIntersectPoint = intersectToTableBottomSide;
      this.toTablePathSide = Orientation.Bottom;
    }
    return false;
  }

  getElems(): Element[] {
    if (!this.pathElem) {
      return [];
    }
    return [this.pathElem, this.highlightTrigger!];
  }

  private getTableRelationSide(): never {
    throw new Error("Method not implemented.");
  }

  private getPosOnLine(
    pathIndex: number,
    pathCount: number,
    sideLength: number
  ): number {
    return (pathIndex + 1) * (sideLength / (pathCount + 1));
  }

  private getLeftSidePathCord = (
    tableVertices: Vertices,
    pathIndex: number,
    pathCount: number
  ): Point => {
    const sideLength = tableVertices.bottomLeft.y - tableVertices.topLeft.y;
    const posOnLine = this.getPosOnLine(pathIndex, pathCount, sideLength);
    return {
      x: tableVertices.topLeft.x,
      y: tableVertices.topLeft.y + posOnLine,
    };
  };

  private getRightSidePathCord = (
    tableVertices: Vertices,
    pathIndex: number,
    pathCount: number
  ): Point => {
    const sideLength = tableVertices.bottomRight.y - tableVertices.topRight.y;
    const posOnLine = this.getPosOnLine(pathIndex, pathCount, sideLength);
    return {
      x: tableVertices.topRight.x,
      y: tableVertices.topRight.y + posOnLine,
    };
  };

  private getTopSidePathCord = (
    tableVertices: Vertices,
    pathIndex: number,
    pathCount: number
  ): Point => {
    const sideLength = tableVertices.topRight.x - tableVertices.topLeft.x;
    const posOnLine = this.getPosOnLine(pathIndex, pathCount, sideLength);
    return {
      x: tableVertices.topLeft.x + posOnLine,
      y: tableVertices.topLeft.y,
    };
  };

  private getBottomSidePathCord = (
    tableVertices: Vertices,
    pathIndex: number,
    pathCount: number
  ): Point => {
    const sideLength = tableVertices.bottomRight.x - tableVertices.bottomLeft.x;
    const posOnLine = this.getPosOnLine(pathIndex, pathCount, sideLength);
    return {
      x: tableVertices.bottomLeft.x + posOnLine,
      y: tableVertices.bottomLeft.y,
    };
  };

  private onMouseEnter = (): void => {
    this.pathElem!.classList.add("pathHover");
    this.fromTable.highlightFrom(this.fromColumn);
    this.toTable.highlightTo(this.toColumn);
  };

  private onMouseLeave = (): void => {
    if (this.pathElem) {
      this.pathElem.classList.remove("pathHover");
      this.fromTable.removeHighlightFrom(this.fromColumn);
      this.toTable.removeHighlightTo(this.toColumn);
    }
  };

  private createRelationInfo(): RelationData {
    return new RelationData(
      this.fromTable.name,
      this.toTable.name,
      this.fromColumn.name,
      this.toColumn.name
    );
  }

  private onClick = (): void => {
    this.viewer.relationClick(this.createRelationInfo());
  };

  private onDblClick = (): void => {
    this.viewer.relationDblClick(this.createRelationInfo());
  };

  private onContextMenu = (): void => {
    this.viewer.relationContextMenu(this.createRelationInfo());
  };

  private setElems(
    elem: SVGGraphicsElement,
    highlightTrigger: SVGGraphicsElement
  ): void {
    this.pathElem = elem;
    this.highlightTrigger = highlightTrigger;
    highlightTrigger.onmouseenter = this.onMouseEnter;
    highlightTrigger.onmouseleave = this.onMouseLeave;

    highlightTrigger.addEventListener("contextmenu", this.onContextMenu);
    highlightTrigger.addEventListener("dblclick", this.onDblClick);
    highlightTrigger.addEventListener("click", this.onClick);
    highlightTrigger.addEventListener("touch", this.onClick);
  }

  private createHighlightTrigger(d: string): SVGGraphicsElement {
    const path = document.createElementNS(
      constant.nsSvg,
      "path"
    ) as SVGGraphicsElement;
    path.setAttributeNS(null, "d", d);
    path.classList.add("highlight");

    return path;
  }

  private createPath(d: string): SVGGraphicsElement {
    const path = document.createElementNS(
      constant.nsSvg,
      "path"
    ) as SVGGraphicsElement;

    path.setAttributeNS(null, "d", d);

    return path;
  }
}
