import constant from './const';
import {
  segmentIntersection,
} from './mathUtil';
import Table from './Table';
import { Column } from './types/Column';
import Orientation from './types/Orientation';
import Vertices from './types/Vertices';
import Point from './types/Point';

const PATH_ARROW_LENGTH = 9;
const PATH_ARROW_HEIGHT = 4;
const PATH_START = 5;
const PATH_SELF_RELATION_LENGTH = 40;

interface PathHeighlight {
  path: SVGGraphicsElement;
  highlight: SVGGraphicsElement;
}

enum Axis {
  x = 'x',
  y = 'y',
}

interface BasicRelation {
  fromColumn: Column;
  fromTable: Table;
  toColumn: Column;
  toTable: Table;
}
export default class Relation {

  public static ySort(arr: Relation[], table: Table): void {
    Relation.sort(arr, table, Axis.y);
  }

  public static xSort(arr: Relation[], table: Table): void {
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
  public fromColumn: Column;
  public fromPathCount?: number;
  public fromPathIndex?: number;
  public fromTable: Table;
  public toColumn: Column;
  public toPathCount?: number;
  public toPathIndex?: number;
  public toTable: Table;
  public pathElem?: SVGGraphicsElement;
  public highlightTrigger?: SVGGraphicsElement;
  public fromTablePathSide?: Orientation;
  public toTablePathSide?: Orientation;
  public fromIntersectPoint?: Point;
  public toIntersectPoint?: Point;

  constructor({
    fromColumn,
    fromTable,
    toColumn,
    toTable,
  }: BasicRelation) {
    this.fromColumn = fromColumn;
    this.fromTable = fromTable;
    this.toColumn = toColumn;
    this.toTable = toTable;
  }

  public update(): void {
    this.getTableRelationSide();
  }

  public removeHoverEffect(): void {
    this.onMouseLeave();
  }

  public render(): [SVGGraphicsElement?, SVGGraphicsElement?] {
    const fromTableVertices = this.fromTable.getVertices();
    const toTableVertices = this.toTable.getVertices();

    const toMany = !this.fromColumn.uq;

    type StartEndMethod = (tableVertices: Vertices, pathIndex: number, pathCount: number) => Point;

    let startMethod: StartEndMethod;
    let endMethod: StartEndMethod;
    let resultMethod: (start: Point, end: Point, oneTo?: boolean, toMany?: boolean) => PathHeighlight;

    switch (this.fromTablePathSide) {
      case Orientation.Left:
        {
          startMethod = this.getLeftSidePathCord;
          switch (this.toTablePathSide) {
            case Orientation.Left:
              endMethod = this.getLeftSidePathCord;
              resultMethod = this.getSelfRelationLeft;
              break;
            case Orientation.Right:
              endMethod = this.getRightSidePathCord;
              resultMethod = this.get3LinePathHoriz;
              break;
            case Orientation.Top:
              endMethod = this.getTopSidePathCord;
              resultMethod = this.get2LinePathFlatTop;
              break;
            case Orientation.Bottom:
              endMethod = this.getBottomSidePathCord;
              resultMethod = this.get2LinePathFlatBottom;
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
              resultMethod = this.get3LinePathHoriz;
              break;
            case Orientation.Right:
              endMethod = this.getRightSidePathCord;
              resultMethod = this.getSelfRelationRight;
              break;
            case Orientation.Top:
              endMethod = this.getTopSidePathCord;
              resultMethod = this.get2LinePathFlatTop;
              break;
            case Orientation.Bottom:
              endMethod = this.getBottomSidePathCord;
              resultMethod = this.get2LinePathFlatBottom;
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
              resultMethod = this.get2LinePathFlatTop;
              break;
            case Orientation.Right:
              endMethod = this.getRightSidePathCord;
              resultMethod = this.get2LinePathFlatTop;
              break;
            case Orientation.Top:
              endMethod = this.getTopSidePathCord;
              resultMethod = this.getSelfRelationTop;
              break;
            case Orientation.Bottom:
              endMethod = this.getBottomSidePathCord;
              resultMethod = this.get3LinePathVert;
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
              resultMethod = this.get2LinePathFlatBottom;
              break;
            case Orientation.Right:
              endMethod = this.getRightSidePathCord;
              resultMethod = this.get2LinePathFlatBottom;
              break;
            case Orientation.Top:
              endMethod = this.getTopSidePathCord;
              resultMethod = this.get3LinePathVert;
              break;
            case Orientation.Bottom:
              endMethod = this.getBottomSidePathCord;
              resultMethod = this.getSelfRelationBottom;
              break;
          }
        }
        break;
    }

    // In case of tables overlapping there won't be any result
    if (startMethod! && endMethod!) {
      const start = startMethod!.call(this, fromTableVertices, this.fromPathIndex!, this.fromPathCount!);
      const end = endMethod!.call(this, toTableVertices, this.toPathIndex!, this.toPathCount!);
      const result = resultMethod!.call(this, start, end, this.fromColumn.nn, toMany);
      this.setElems(result.path, result.highlight);
    }
    if (!this.pathElem) {
      return [];
    }
    return [this.highlightTrigger, this.pathElem];
  }

  public sameTableRelation(): boolean {
    return this.fromTable === this.toTable;
  }

  public calcPathTableSides(): boolean {
    if (this.fromTable === this.toTable) {
      return true;
    }
    const fromTableCenter = this.fromTable.getCenter();
    const toTableCenter = this.toTable.getCenter();

    const fromTableSides = this.fromTable.getVertices();

    const intersectFromTableRightSide =
      segmentIntersection(fromTableCenter, toTableCenter, fromTableSides.topRight, fromTableSides.bottomRight);
    if (intersectFromTableRightSide) {
      this.fromIntersectPoint = intersectFromTableRightSide;
      this.fromTablePathSide = Orientation.Right;
    }
    const intersectFromTableLeftSide =
      segmentIntersection(fromTableCenter, toTableCenter, fromTableSides.topLeft, fromTableSides.bottomLeft);
    if (intersectFromTableLeftSide) {
      this.fromIntersectPoint = intersectFromTableLeftSide;
      this.fromTablePathSide = Orientation.Left;
    }
    const intersectFromTableTopSide =
      segmentIntersection(fromTableCenter, toTableCenter, fromTableSides.topLeft, fromTableSides.topRight);
    if (intersectFromTableTopSide) {
      this.fromIntersectPoint = intersectFromTableTopSide;
      this.fromTablePathSide = Orientation.Top;
    }
    const intersectFromTableBottomSide =
      segmentIntersection(fromTableCenter, toTableCenter, fromTableSides.bottomLeft, fromTableSides.bottomRight);
    if (intersectFromTableBottomSide) {
      this.fromIntersectPoint = intersectFromTableBottomSide;
      this.fromTablePathSide = Orientation.Bottom;
    }

    const toTableSides = this.toTable.getVertices();

    const intersectToTableRightSide =
      segmentIntersection(fromTableCenter, toTableCenter, toTableSides.topRight, toTableSides.bottomRight);
    if (intersectToTableRightSide) {
      this.toIntersectPoint = intersectToTableRightSide;
      this.toTablePathSide = Orientation.Right;
    }
    const intersectToTableLeftSide =
      segmentIntersection(fromTableCenter, toTableCenter, toTableSides.topLeft, toTableSides.bottomLeft);
    if (intersectToTableLeftSide) {
      this.toIntersectPoint = intersectToTableLeftSide;
      this.toTablePathSide = Orientation.Left;
    }
    const intersectToTableTopSide =
      segmentIntersection(fromTableCenter, toTableCenter, toTableSides.topLeft, toTableSides.topRight);
    if (intersectToTableTopSide) {
      this.toIntersectPoint = intersectToTableTopSide;
      this.toTablePathSide = Orientation.Top;
    }
    const intersectToTableBottomSide =
      segmentIntersection(fromTableCenter, toTableCenter, toTableSides.bottomRight, toTableSides.bottomLeft);
    if (intersectToTableBottomSide) {
      this.toIntersectPoint = intersectToTableBottomSide;
      this.toTablePathSide = Orientation.Bottom;
    }
    return false;
  }

  public getElems(): Element[] {
    if (!this.pathElem) {
      return [];
    }
    return [this.pathElem, this.highlightTrigger!];
  }

  private getTableRelationSide(): never {
    throw new Error('Method not implemented.');
  }

  private getPosOnLine(pathIndex: number, pathCount: number, sideLength: number): number {
    return (pathIndex + 1) * (sideLength / (pathCount + 1));
  }

  private getLeftSidePathCord = (tableVertices: Vertices, pathIndex: number, pathCount: number): Point => {
    const sideLength = tableVertices.bottomLeft.y - tableVertices.topLeft.y;
    const posOnLine = this.getPosOnLine(pathIndex, pathCount, sideLength);
    return {
      x: tableVertices.topLeft.x,
      y: tableVertices.topLeft.y + posOnLine,
    };
  }

  private getRightSidePathCord = (tableVertices: Vertices, pathIndex: number, pathCount: number): Point => {
    const sideLength = tableVertices.bottomRight.y - tableVertices.topRight.y;
    const posOnLine = this.getPosOnLine(pathIndex, pathCount, sideLength);
    return {
      x: tableVertices.topRight.x,
      y: tableVertices.topRight.y + posOnLine,
    };
  }

  private getTopSidePathCord = (tableVertices: Vertices, pathIndex: number, pathCount: number): Point => {
    const sideLength = tableVertices.topRight.x - tableVertices.topLeft.x;
    const posOnLine = this.getPosOnLine(pathIndex, pathCount, sideLength);
    return {
      x: tableVertices.topLeft.x + posOnLine,
      y: tableVertices.topLeft.y,
    };
  }

  private getBottomSidePathCord = (tableVertices: Vertices, pathIndex: number, pathCount: number): Point => {
    const sideLength = tableVertices.bottomRight.x - tableVertices.bottomLeft.x;
    const posOnLine = this.getPosOnLine(pathIndex, pathCount, sideLength);
    return {
      x: tableVertices.bottomLeft.x + posOnLine,
      y: tableVertices.bottomLeft.y,
    };
  }

  private get2LinePathFlatTop = (start: Point, end: Point, oneTo?: boolean, toMany?: boolean): PathHeighlight => {
    let dArrow: string;
    let dStartLine: string;
    let dPath: string;

    if (start.y > end.y) {
      if (oneTo) {
        dStartLine = `M ${start.x - PATH_START} ${start.y - PATH_START}
                      h ${2 * PATH_START}`;
        dPath = `M ${start.x} ${start.y}`;
      } else { // zero to
        dStartLine = this.getCirclePath(start.x, start.y - PATH_START);
        dPath = `M ${start.x} ${start.y - PATH_START * 2}`;
      }
      dPath += ` V ${end.y} H ${end.x}`;

      if (start.x > end.x) {
        dArrow = this.getArrow(end, toMany, Orientation.Left);
      } else {
        dArrow = this.getArrow(end, toMany, Orientation.Right);
      }
    } else {
      if (oneTo) {
        if (start.x > end.x) {
          dStartLine = `M ${start.x - PATH_START} `;
        } else {
          dStartLine = `M ${start.x + PATH_START} `;
        }
        dStartLine += `${start.y - PATH_START} v ${2 * PATH_START}`;
        dPath = `M ${start.x} ${start.y} H ${end.x} V ${end.y}`;
      } else { // zero to
        if (start.x > end.x) {
          dStartLine = this.getCirclePath(start.x - PATH_START, start.y);
        } else {
          dStartLine = this.getCirclePath(start.x + PATH_START, start.y);
        }
        if (start.x > end.x) {
          dPath = `M ${start.x - PATH_START * 2}`;
        } else {
          dPath = `M ${start.x + PATH_START * 2}`;
        }
        dPath += ` ${start.y} H ${end.x} V ${end.y}`;
      }
      dArrow = this.getArrow(end, toMany, Orientation.Bottom);
    }

    const d = `${dStartLine} ${dPath} ${dArrow}`;
    const path = this.createPath(d);

    const highlight = this.createHighlightTrigger(d);

    return {
      highlight,
      path,
    };
  }

  private get2LinePathFlatBottom = (start: Point, end: Point, oneTo?: boolean, toMany?: boolean): PathHeighlight => {
    let dArrow: string;
    let dStartLine: string;
    let dPath: string;

    if (start.y > end.y) {
      if (oneTo) {
        if (start.x > end.x) {
          dStartLine = `M ${start.x - PATH_START} `;
        } else {
          dStartLine = `M ${start.x + PATH_START} `;
        }
        dStartLine += `${start.y - PATH_START} v ${PATH_START * 2}`;
        dPath = `M ${start.x} ${start.y} H ${end.x} V ${end.y}`;
      } else { // zero to
        if (start.x > end.x) {
          dStartLine = this.getCirclePath(start.x - PATH_START, start.y);
          dPath = `M ${start.x - PATH_START * 2} ${start.y} H ${end.x} V ${end.y}`;
        } else {
          dStartLine = this.getCirclePath(start.x + PATH_START, start.y);
          dPath = `M ${start.x + PATH_START * 2} ${start.y} H ${end.x} V ${end.y}`;
        }
      }
      dArrow = this.getArrow(end, toMany, Orientation.Top);
    } else {
      if (oneTo) {
        dStartLine = `M ${start.x - PATH_START} ${start.y + PATH_START} h ${2 * PATH_START}`;
        dPath = `M ${start.x} ${start.y} V ${end.y} H ${end.x}`;
      } else { // zero to
        dStartLine = this.getCirclePath(start.x, start.y + PATH_START);
        dPath = `M ${start.x} ${start.y + PATH_START * 2} V ${end.y} H ${end.x}`;
      }
      if (start.x > end.x) {
        dArrow = this.getArrow(end, toMany, Orientation.Left);
      } else {
        dArrow = this.getArrow(end, toMany, Orientation.Right);
      }
    }

    const d = `${dStartLine} ${dPath} ${dArrow}`;

    const path = this.createPath(d);

    const highlight = this.createHighlightTrigger(d);

    return {
      highlight,
      path,
    };
  }

  private get3LinePathHoriz = (start: Point, end: Point, oneTo?: boolean, toMany?: boolean): PathHeighlight => {
    let dStartLine: string;
    let dPath: string;
    const p2X = start.x + (end.x - start.x) / 2;
    let dArrow: string;
    if (start.x > end.x) {
      dArrow = this.getArrow(end, toMany, Orientation.Left);
      dPath = `M ${start.x} ${start.y}`;
      if (oneTo) {
        dStartLine = `M ${start.x - PATH_START} ${start.y - PATH_START} v ${2 * PATH_START}`;
        dPath += `H ${p2X}`;
      } else { // zero to
        dStartLine = this.getCirclePath(start.x - PATH_START, start.y);
        dPath += `m ${-PATH_START * 2} 0 H ${p2X}`;
      }
    } else {
      dArrow = this.getArrow(end, toMany, Orientation.Right);
      dPath = `M ${start.x} ${start.y} `;
      if (oneTo) {
        dStartLine = `M ${start.x + PATH_START} ${start.y - PATH_START} v ${2 * PATH_START}`;
        dPath += `H ${p2X}`;
      } else { // zero to
        dStartLine = this.getCirclePath(start.x + PATH_START, start.y);
        dPath += `m ${PATH_START * 2} 0 H ${p2X}`;
      }
    }

    dPath += `V ${end.y} H ${end.x}`;

    const d = `${dStartLine} ${dPath} ${dArrow}`;
    const path = this.createPath(d);

    const highlight = this.createHighlightTrigger(d);

    return {
      highlight,
      path,
    };
  }

  private get3LinePathVert = (start: Point, end: Point, oneTo?: boolean, toMany?: boolean): PathHeighlight => {
    let dStartLine = `M ${start.x - PATH_START} `;

    let dPath: string;
    const p2Y = start.y + (end.y - start.y) / 2;
    let dArrow: string;
    if (start.y > end.y) {
      dArrow = this.getArrow(end, toMany, Orientation.Top);
      if (oneTo) {
        dStartLine += `${start.y - PATH_START} h ${2 * PATH_START}`;
        dPath = `M ${start.x} ${start.y} V ${p2Y} H ${end.x} V ${end.y}`;
      } else { // zero to
        dStartLine = this.getCirclePath(start.x, start.y - PATH_START);
        dPath = `M ${start.x} ${start.y - PATH_START * 2} V ${p2Y} H ${end.x} V ${end.y}`;
      }
    } else {
      dArrow = this.getArrow(end, toMany, Orientation.Bottom);
      dStartLine += `${start.y + PATH_START} h ${2 * PATH_START}`;
      if (oneTo) {
        dPath = `M ${start.x} ${start.y} V ${p2Y} H ${end.x} V ${end.y}`;
      } else { // zero to
        dStartLine = this.getCirclePath(start.x, start.y + PATH_START);
        dPath = `M ${start.x} ${start.y + PATH_START * 2} V ${p2Y} H ${end.x} V ${end.y}`;
      }
    }

    const d = `${dStartLine} ${dPath} ${dArrow}`;

    const path = this.createPath(d);

    const highlight = this.createHighlightTrigger(d);

    return {
      highlight,
      path,
    };
  }

  private getSelfRelationLeft = (start: Point, end: Point, oneTo?: boolean, toMany?: boolean): PathHeighlight => {
    let dStartLine: string;
    let dPath: string;

    if (oneTo) {
      dStartLine = `M ${start.x - PATH_START} ${start.y - PATH_START} v ${PATH_START * 2}`;
      dPath = `M ${start.x} ${start.y} h ${-PATH_SELF_RELATION_LENGTH} V ${end.y} h ${PATH_SELF_RELATION_LENGTH}`;
    } else {
      dStartLine = this.getCirclePath(start.x - PATH_START, start.y);
      dPath = `M ${start.x - PATH_START * 2} ${start.y} h ${-PATH_SELF_RELATION_LENGTH + PATH_START * 2} V ${end.y} h ${PATH_SELF_RELATION_LENGTH}`;
    }

    const dArrow = this.getArrow(end, toMany, Orientation.Right);

    const d = `${dStartLine} ${dPath} ${dArrow}`;

    const path = this.createPath(d);

    const highlight = this.createHighlightTrigger(d);

    return {
      highlight,
      path,
    };
  }

  private getSelfRelationRight = (start: Point, end: Point, oneTo?: boolean, toMany?: boolean): PathHeighlight => {
    let dStartLine: string;
    let dPath: string;

    if (oneTo) {
      dStartLine = `M ${start.x + PATH_START} ${start.y - PATH_START} v ${PATH_START * 2}`;
      dPath = `M ${start.x} ${start.y} h ${PATH_SELF_RELATION_LENGTH} V ${end.y} h ${-PATH_SELF_RELATION_LENGTH}`;
    } else {
      dStartLine = this.getCirclePath(start.x + PATH_START, start.y);
      dPath = `M ${start.x + PATH_START * 2} ${start.y} h ${PATH_SELF_RELATION_LENGTH - PATH_START * 2} V ${end.y} h ${-PATH_SELF_RELATION_LENGTH}`;
    }

    const dArrow = this.getArrow(end, toMany, Orientation.Left);

    const d = `${dStartLine} ${dPath} ${dArrow}`;

    const path = this.createPath(d);

    const highlight = this.createHighlightTrigger(d);

    return {
      highlight,
      path,
    };
  }

  private getSelfRelationTop = (start: Point, end: Point, oneTo?: boolean, toMany?: boolean): PathHeighlight => {
    let dStartLine: string;
    let dPath: string;

    if (oneTo) {
      dStartLine = `M ${start.x - PATH_START} ${start.y - PATH_START} h ${PATH_START * 2}`;
      dPath = `M ${start.x} ${start.y} v ${-PATH_SELF_RELATION_LENGTH} H ${end.x} v ${PATH_SELF_RELATION_LENGTH}`;
    } else {
      dStartLine = this.getCirclePath(start.x, start.y - PATH_START);
      dPath = `M ${start.x} ${start.y - PATH_START * 2} v ${-PATH_SELF_RELATION_LENGTH + PATH_START * 2} H ${end.x} v ${PATH_SELF_RELATION_LENGTH}`;
    }

    const dArrow = this.getArrow(end, toMany, Orientation.Bottom);

    const d = `${dStartLine} ${dPath} ${dArrow}`;

    const path = this.createPath(d);

    const highlight = this.createHighlightTrigger(d);

    return {
      highlight,
      path,
    };
  }

  private getSelfRelationBottom = (start: Point, end: Point, oneTo?: boolean, toMany?: boolean): PathHeighlight => {
    let dStartLine: string;
    let dPath: string;
    if (oneTo) {
      dPath = `M ${start.x} ${start.y} v ${PATH_SELF_RELATION_LENGTH} H ${end.x} v ${-PATH_SELF_RELATION_LENGTH}`;
      dStartLine = `M ${start.x - PATH_START} ${start.y + PATH_START} h ${PATH_START * 2}`;
    } else {
      dStartLine = this.getCirclePath(start.x, start.y + PATH_START);
      dPath = `M ${start.x} ${start.y + PATH_START * 2} v ${PATH_SELF_RELATION_LENGTH - PATH_START * 2} H ${end.x} v ${-PATH_SELF_RELATION_LENGTH}`;
    }

    const dArrow = this.getArrow(end, toMany, Orientation.Top);

    const d = `${dStartLine} ${dPath} ${dArrow}`;

    const path = this.createPath(d);

    const highlight = this.createHighlightTrigger(d);

    return {
      highlight,
      path,
    };
  }

  private getCirclePath(x: number, y: number): string {
    return `M ${x - PATH_START} ${y}` +
          ` a 1,1 0 1,0 ${PATH_START * 2},0 a 1,1 0 1,0 ${-PATH_START * 2},0`;
  }

  private getArrow({x, y}: Point, toMany: boolean | undefined, orientation: Orientation): string {
    switch (orientation) {
      case Orientation.Top:
      if (toMany) {
        return `M ${x} ${y + PATH_ARROW_LENGTH} l ${PATH_ARROW_HEIGHT} ${-PATH_ARROW_LENGTH} ` +
          `M ${x} ${y + PATH_ARROW_LENGTH} l ${-PATH_ARROW_HEIGHT} ${-PATH_ARROW_LENGTH}`;
      } else {
        return `M ${x} ${y} l ${PATH_ARROW_HEIGHT} ${PATH_ARROW_LENGTH} ` +
          `M ${x} ${y} l ${-PATH_ARROW_HEIGHT} ${PATH_ARROW_LENGTH}`;
      }
      case Orientation.Bottom:
      if (toMany) {
        return `M ${x} ${y - PATH_ARROW_LENGTH} l ${PATH_ARROW_HEIGHT} ${PATH_ARROW_LENGTH} ` +
          `M ${x} ${y - PATH_ARROW_LENGTH} l ${-PATH_ARROW_HEIGHT} ${PATH_ARROW_LENGTH}`;
      } else {
        return `M ${x} ${y} l ${PATH_ARROW_HEIGHT} ${-PATH_ARROW_LENGTH} ` +
          `M ${x} ${y} l ${-PATH_ARROW_HEIGHT} ${-PATH_ARROW_LENGTH}`;
      }
      case Orientation.Left:
      if (toMany) {
        return `M ${x + PATH_ARROW_LENGTH} ${y} l ${-PATH_ARROW_LENGTH} ${PATH_ARROW_HEIGHT} ` +
          `M ${x + PATH_ARROW_LENGTH} ${y} l ${-PATH_ARROW_LENGTH} ${-PATH_ARROW_HEIGHT}`;
      } else {
        return `M ${x} ${y} l ${PATH_ARROW_LENGTH} ${PATH_ARROW_HEIGHT} ` +
          `M ${x} ${y} l ${PATH_ARROW_LENGTH} ${-PATH_ARROW_HEIGHT}`;
      }
      case Orientation.Right:
      if (toMany) {
        return `M ${x - PATH_ARROW_LENGTH} ${y} l ${PATH_ARROW_LENGTH} ${PATH_ARROW_HEIGHT} ` +
          `M ${x - PATH_ARROW_LENGTH} ${y} l ${PATH_ARROW_LENGTH} ${-PATH_ARROW_HEIGHT}`;
      } else {
        return `M ${x} ${y} l ${-PATH_ARROW_LENGTH} ${PATH_ARROW_HEIGHT} ` +
          `M ${x} ${y} l ${-PATH_ARROW_LENGTH} ${-PATH_ARROW_HEIGHT}`;
      }
    }
  }

  private onMouseEnter(): void {
    this.pathElem!.classList.add('pathHover');
    this.fromTable.highlightFrom(this.fromColumn);
    this.toTable.highlightTo(this.toColumn);
  }

  private onMouseLeave(): void {
    if (this.pathElem) {
      this.pathElem.classList.remove('pathHover');
      this.fromTable.removeHighlightFrom(this.fromColumn);
      this.toTable.removeHighlightTo(this.toColumn);
    }
  }

  private setElems(elem: SVGGraphicsElement, highlightTrigger: SVGGraphicsElement): void {
    this.pathElem = elem;
    this.highlightTrigger = highlightTrigger;
    highlightTrigger.onmouseenter = this.onMouseEnter.bind(this);
    highlightTrigger.onmouseleave = this.onMouseLeave.bind(this);
  }

  private createHighlightTrigger(d: string): SVGGraphicsElement {
    const path = document.createElementNS(constant.nsSvg, 'path') as SVGGraphicsElement;
    path.setAttributeNS(null, 'd', d);
    path.classList.add('highlight');

    return path;
  }

  private createPath(d: string): SVGGraphicsElement {
    const path = document.createElementNS(constant.nsSvg, 'path') as SVGGraphicsElement;

    path.setAttributeNS(null, 'd', d);

    return path;
  }
}
