import constant from './const';
import Orientation from './IOrientation';
import IPoint from './IPoint';
import {
  segmentIntersection,
} from './mathUtil';
import Table from './Table';

const PATH_ARROW_LENGTH = 9;
const PATH_ARROW_HEIGHT = 4;
const PATH_START = 5;
const PATH_SELF_RELATION_LENGTH = 40;

interface IPathHeighlight {
  path: SVGGraphicsElement;
  highlight: SVGGraphicsElement;
}

enum Axis {
  x = 'x',
  y = 'y',
}

export default class Relation {

  public static ySort(arr: Relation[], table: Table) {
    return Relation.sort(arr, table, Axis.y);
  }

  public static xSort(arr: Relation[], table: Table) {
    return Relation.sort(arr, table, Axis.x);
  }

  private static sort(arr: Relation[], table: Table, axis: Axis) {
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
  public fromColumn: any;
  public fromPathCount?: number;
  public fromPathIndex?: number;
  public fromTable: Table;
  public toColumn: any;
  public toPathCount?: number;
  public toPathIndex?: number;
  public toTable: Table;
  public pathElem?: SVGElement;
  public highlightTrigger?: SVGElement;
  public fromTablePathSide?: Orientation;
  public toTablePathSide?: Orientation;
  public fromIntersectPoint?: IPoint;
  public toIntersectPoint?: IPoint;

  constructor({
    fromColumn,
    fromTable,
    toColumn,
    toTable,
  }) {
    this.fromColumn = fromColumn;
    this.fromTable = fromTable;
    this.toColumn = toColumn;
    this.toTable = toTable;
  }

  public update() {
    this.getTableRelationSide();
  }

  public removeHoverEffect() {
    this.onMouseLeave();
  }

  public render() {
    const fromTableSides = this.fromTable.getSides();
    const toTableSides = this.toTable.getSides();

    const toMany = !this.fromColumn.uq;

    type StartEndMethod = (tableSides, pathIndex: number, pathCount: number) => IPoint;

    let startMethod: StartEndMethod;
    let endMethod: StartEndMethod;
    let resultMethod: (start: IPoint, end: IPoint, oneTo: boolean, toMany: boolean) => IPathHeighlight;

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
      const start = startMethod!.call(this, fromTableSides!, this.fromPathIndex!, this.fromPathCount!);
      const end = endMethod!.call(this, toTableSides!, this.toPathIndex!, this.toPathCount!);
      const result = resultMethod!.call(this, start, end, this.fromColumn.nn, toMany);
      this.setElems(result.path, result.highlight);
    }
    if (!this.pathElem) {
      return [];
    }
    return [this.highlightTrigger, this.pathElem];
  }

  public sameTableRelation() {
    return this.fromTable === this.toTable;
  }

  public calcPathTableSides(): boolean {
    if (this.fromTable === this.toTable) {
      return true;
    }
    const fromTableCenter = this.fromTable.getCenter();
    const toTableCenter = this.toTable.getCenter();

    const fromTableSides = this.fromTable.getSides();

    const intersectFromTableRightSide =
      segmentIntersection(fromTableCenter, toTableCenter, fromTableSides.right.p1, fromTableSides.right.p2);
    if (intersectFromTableRightSide) {
      this.fromIntersectPoint = intersectFromTableRightSide;
      this.fromTablePathSide = Orientation.Right;
    }
    const intersectFromTableLeftSide =
      segmentIntersection(fromTableCenter, toTableCenter, fromTableSides.left.p1, fromTableSides.left.p2);
    if (intersectFromTableLeftSide) {
      this.fromIntersectPoint = intersectFromTableLeftSide;
      this.fromTablePathSide = Orientation.Left;
    }
    const intersectFromTableTopSide =
      segmentIntersection(fromTableCenter, toTableCenter, fromTableSides.top.p1, fromTableSides.top.p2);
    if (intersectFromTableTopSide) {
      this.fromIntersectPoint = intersectFromTableTopSide;
      this.fromTablePathSide = Orientation.Top;
    }
    const intersectFromTableBottomSide =
      segmentIntersection(fromTableCenter, toTableCenter, fromTableSides.bottom.p1, fromTableSides.bottom.p2);
    if (intersectFromTableBottomSide) {
      this.fromIntersectPoint = intersectFromTableBottomSide;
      this.fromTablePathSide = Orientation.Bottom;
    }

    const toTableSides = this.toTable.getSides();

    const intersectToTableRightSide =
      segmentIntersection(fromTableCenter, toTableCenter, toTableSides.right.p1, toTableSides.right.p2);
    if (intersectToTableRightSide) {
      this.toIntersectPoint = intersectToTableRightSide;
      this.toTablePathSide = Orientation.Right;
    }
    const intersectToTableLeftSide =
      segmentIntersection(fromTableCenter, toTableCenter, toTableSides.left.p1, toTableSides.left.p2);
    if (intersectToTableLeftSide) {
      this.toIntersectPoint = intersectToTableLeftSide;
      this.toTablePathSide = Orientation.Left;
    }
    const intersectToTableTopSide =
      segmentIntersection(fromTableCenter, toTableCenter, toTableSides.top.p1, toTableSides.top.p2);
    if (intersectToTableTopSide) {
      this.toIntersectPoint = intersectToTableTopSide;
      this.toTablePathSide = Orientation.Top;
    }
    const intersectToTableBottomSide =
      segmentIntersection(fromTableCenter, toTableCenter, toTableSides.bottom.p1, toTableSides.bottom.p2);
    if (intersectToTableBottomSide) {
      this.toIntersectPoint = intersectToTableBottomSide;
      this.toTablePathSide = Orientation.Bottom;
    }
    return false;
  }

  public getElems() {
    if (!this.pathElem) {
      return [];
    }
    return [this.pathElem, this.highlightTrigger];
  }

  private getTableRelationSide() {
    throw new Error('Method not implemented.');
  }

  private getPosOnLine(pathIndex: number, pathCount: number, sideLength: number) {
    return (pathIndex + 1) * (sideLength / (pathCount + 1));
  }

  private getLeftSidePathCord(tableSides, pathIndex: number, pathCount: number): IPoint {
    const sideLength = tableSides.left.p2.y - tableSides.left.p1.y;
    const posOnLine = this.getPosOnLine(pathIndex, pathCount, sideLength);
    return {
      x: tableSides.left.p1.x,
      y: tableSides.left.p1.y + posOnLine,
    };
  }

  private getRightSidePathCord(tableSides, pathIndex: number, pathCount: number): IPoint {
    const sideLength = tableSides.right.p2.y - tableSides.right.p1.y;
    const posOnLine = this.getPosOnLine(pathIndex, pathCount, sideLength);
    return {
      x: tableSides.right.p1.x,
      y: tableSides.right.p1.y + posOnLine,
    };
  }

  private getTopSidePathCord(tableSides, pathIndex: number, pathCount: number): IPoint {
    const sideLength = tableSides.top.p2.x - tableSides.top.p1.x;
    const posOnLine = this.getPosOnLine(pathIndex, pathCount, sideLength);
    return {
      x: tableSides.top.p1.x + posOnLine,
      y: tableSides.top.p1.y,
    };
  }

  private getBottomSidePathCord(tableSides, pathIndex: number, pathCount: number): IPoint {
    const sideLength = tableSides.bottom.p2.x - tableSides.bottom.p1.x;
    const posOnLine = this.getPosOnLine(pathIndex, pathCount, sideLength);
    return {
      x: tableSides.bottom.p1.x + posOnLine,
      y: tableSides.bottom.p1.y,
    };
  }

  private get2LinePathFlatTop(start: IPoint, end: IPoint, oneTo: boolean, toMany: boolean): IPathHeighlight {
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

  private get2LinePathFlatBottom(start: IPoint, end: IPoint, oneTo: boolean, toMany: boolean): IPathHeighlight {
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

  private get3LinePathHoriz(start: IPoint, end: IPoint, oneTo: boolean, toMany: boolean): IPathHeighlight {
    let dStartLine: string;
    let dPath: string;
    const p2X = start.x + (end.x - start.x) / 2;
    let dArrow;
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

  private get3LinePathVert(start: IPoint, end: IPoint, oneTo: boolean, toMany: boolean): IPathHeighlight {
    let dStartLine = `M ${start.x - PATH_START} `;

    let dPath: string;
    const p2Y = start.y + (end.y - start.y) / 2;
    let dArrow;
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

  private getSelfRelationLeft(start: IPoint, end: IPoint, oneTo: boolean, toMany: boolean): IPathHeighlight {
    let dStartLine;
    let dPath;

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

  private getSelfRelationRight(start: IPoint, end: IPoint, oneTo: boolean, toMany: boolean): IPathHeighlight {
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

  private getSelfRelationTop(start: IPoint, end: IPoint, oneTo: boolean, toMany: boolean): IPathHeighlight {
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

  private getSelfRelationBottom(start: IPoint, end: IPoint, oneTo: boolean, toMany: boolean): IPathHeighlight {
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

  private getCirclePath(x: number, y: number) {
    return `M ${x - PATH_START} ${y}` +
          ` a 1,1 0 1,0 ${PATH_START * 2},0 a 1,1 0 1,0 ${-PATH_START * 2},0`;
  }

  private getArrow({x, y}: IPoint, toMany: boolean, orientation: Orientation) {
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

  private onMouseEnter() {
    this.pathElem!.classList.add('pathHover');
    this.fromTable.highlightFrom(this.fromColumn);
    this.toTable.highlightTo(this.toColumn);
  }

  private onMouseLeave() {
    if (this.pathElem) {
      this.pathElem.classList.remove('pathHover');
      this.fromTable.removeHighlightFrom(this.fromColumn);
      this.toTable.removeHighlightTo(this.toColumn);
    }
  }

  private setElems(elem: SVGGraphicsElement, highlightTrigger: SVGGraphicsElement) {
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
