import {
  segmentIntersection
} from './util';
import constant from './const';

// export class MissingCountIndex extends Error {
//   constructor() {
//     super('toPathIndex and fromPathCount must be defined before calling render');
//   }
// }

const PATH_ARROW_LENGTH = 9;
const PATH_ARROW_HEIGHT = 4;
const PATH_START_PADDING = 7;
const PATH_START_LENGTH = 5;
const PATH_SELF_RELATION_LENGTH = 40;

export default class Relation {
  constructor({
    fromColumn,
    fromPathCount,
    fromPathIndex,
    fromTable,
    fromTablePathSide,
    toColumn,
    toPathCount,
    toPathIndex,
    toTable,
    toTablePathSide,
  }) {
    this.fromColumn = fromColumn;
    this.fromPathCount = fromPathCount;
    this.fromPathIndex = fromPathIndex;
    this.fromTable = fromTable;
    this.toColumn = toColumn;
    this.toPathCount = toPathCount;
    this.toPathIndex = toPathIndex;
    this.toTable = toTable;
  }

  update() {
    this._getTableRelationSide();
  }

  _getPosOnLine(pathIndex, pathCount, sideLength) {
    return (pathIndex + 1) * (sideLength / (pathCount + 1));
  }

  _getLeftSidePathCord(tableSides, pathIndex, pathCount) {
    const sideLength = tableSides.left.p2.y - tableSides.left.p1.y;
    const posOnLine = this._getPosOnLine(pathIndex, pathCount, sideLength);
    return {
      y: tableSides.left.p1.y + posOnLine,
      x: tableSides.left.p1.x
    };
  }

  _getRightSidePathCord(tableSides, pathIndex, pathCount) {
    const sideLength = tableSides.right.p2.y - tableSides.right.p1.y;
    const posOnLine = this._getPosOnLine(pathIndex, pathCount, sideLength);
    return {
      y: tableSides.right.p1.y + posOnLine,
      x: tableSides.right.p1.x
    };
  }

  _getTopSidePathCord(tableSides, pathIndex, pathCount) {
    const sideLength = tableSides.top.p2.x - tableSides.top.p1.x;
    const posOnLine = this._getPosOnLine(pathIndex, pathCount, sideLength);
    return {
      y: tableSides.top.p1.y,
      x: tableSides.top.p1.x + posOnLine
    };
  }

  _getBottomSidePathCord(tableSides, pathIndex, pathCount) {
    const sideLength = tableSides.bottom.p2.x - tableSides.bottom.p1.x;
    const posOnLine = this._getPosOnLine(pathIndex, pathCount, sideLength);
    return {
      y: tableSides.bottom.p1.y,
      x: tableSides.bottom.p1.x + posOnLine
    };
  }

  _get2LinePathFlatTop(start, end) {
    let dArrow1 = `M ${end.x} ${end.y} `;
    let dArrow2 = `M ${end.x} ${end.y} `;

    let dStartLine;

    if (start.y > end.y) {
      dStartLine = `M ${start.x - PATH_START_LENGTH} ${start.y - PATH_START_PADDING}
                    h ${2 * PATH_START_LENGTH}`;

      if (start.x > end.x) {
        dArrow1 += `l ${PATH_ARROW_LENGTH} `;
        dArrow2 += `l ${PATH_ARROW_LENGTH} `;
      } else {
        dArrow1 += `l ${-PATH_ARROW_LENGTH} `;
        dArrow2 += `l ${-PATH_ARROW_LENGTH} `;
      }

      dArrow1 += PATH_ARROW_HEIGHT;
      dArrow2 += -PATH_ARROW_HEIGHT;

      const tmp = start;
      start = end;
      end = tmp;
    } else {
      dArrow1 += `l ${PATH_ARROW_HEIGHT} ${-PATH_ARROW_LENGTH}`;
      dArrow2 += `l ${-PATH_ARROW_HEIGHT} ${-PATH_ARROW_LENGTH}`;

      if (start.x > end.x) {
        dStartLine = `M ${start.x - PATH_START_PADDING} `;
      } else {
        dStartLine = `M ${start.x + PATH_START_PADDING} `;
      }
      dStartLine += `${start.y - PATH_START_LENGTH} v ${2 * PATH_START_LENGTH}`;
    }

    const dPath = `M ${start.x} ${start.y} H ${end.x} V ${end.y}`;

    const d = `${dStartLine} ${dPath} ${dArrow1} ${dArrow2}`;

    const path = this._createPath(d);

    const highlight = this._createHighlightTrigger(dPath);

    return {
      path,
      highlight
    };
  }

  _get2LinePathFlatBottom(start, end) {
    let dArrow1 = `M ${end.x} ${end.y} `;
    let dArrow2 = `M ${end.x} ${end.y} `;

    let dStartLine;

    if (start.y > end.y) {
      dArrow1 += `l ${PATH_ARROW_HEIGHT} ${PATH_ARROW_LENGTH}`;
      dArrow2 += `l ${-PATH_ARROW_HEIGHT} ${PATH_ARROW_LENGTH}`;

      if (start.x > end.x) {
        dStartLine = `M ${start.x - PATH_START_PADDING} `;
      } else {
        dStartLine = `M ${start.x + PATH_START_PADDING} `;
      }

      dStartLine += `${start.y - PATH_START_LENGTH} `;

      dStartLine += `v ${PATH_START_LENGTH * 2}`;

      const tmp = start;
      start = end;
      end = tmp;
    } else {
      dStartLine = `M ${start.x - PATH_START_LENGTH} ${start.y + PATH_START_PADDING} h ${2 * PATH_START_LENGTH}`;

      if (start.x > end.x) {
        dArrow1 += `l ${PATH_ARROW_LENGTH} `;
        dArrow2 += `l ${PATH_ARROW_LENGTH} `;
      } else {
        dArrow1 += `l ${-PATH_ARROW_LENGTH} `;
        dArrow2 += `l ${-PATH_ARROW_LENGTH} `;
      }

      dArrow1 += PATH_ARROW_HEIGHT;
      dArrow2 += -PATH_ARROW_HEIGHT;
    }

    const dPath = `M ${start.x} ${start.y} V ${end.y} H ${end.x}`;

    const d = `${dStartLine} ${dPath} ${dArrow1} ${dArrow2}`;

    const path = this._createPath(d);

    const highlight = this._createHighlightTrigger(dPath);

    return {
      path,
      highlight
    };
  }

  _get3LinePathHoriz(start, end) {
    let dArrow1 = `M ${end.x} ${end.y} `;
    let dArrow2 = `M ${end.x} ${end.y} `;

    let dStartLine;

    if (start.x > end.x) {
      dArrow1 += `l ${PATH_ARROW_LENGTH} `;
      dArrow2 += `l ${PATH_ARROW_LENGTH} `;

      dStartLine = `M ${start.x - PATH_START_PADDING} ${start.y - PATH_START_LENGTH} v ${2* PATH_START_LENGTH}`;

      const tmp = start;
      start = end;
      end = tmp;
    } else {
      dArrow1 += `l ${-PATH_ARROW_LENGTH} `;
      dArrow2 += `l ${-PATH_ARROW_LENGTH} `;

      dStartLine = `M ${start.x + PATH_START_PADDING} ${start.y - PATH_START_LENGTH} v ${2* PATH_START_LENGTH}`;
    }

    dArrow1 += PATH_ARROW_HEIGHT;
    dArrow2 += -PATH_ARROW_HEIGHT;

    const p2X = start.x + (end.x - start.x) / 2;

    const dPath = `M ${start.x} ${start.y} H ${p2X} V ${end.y} H ${end.x}`;

    const d = `${dStartLine} ${dPath} ${dArrow1} ${dArrow2}`;
    const path = this._createPath(d);

    const highlight = this._createHighlightTrigger(dPath);

    return {
      path,
      highlight
    };
  }

  _get3LinePathVert(start, end) {
    let dArrow1 = `M ${end.x} ${end.y} l ${PATH_ARROW_HEIGHT} `;
    let dArrow2 = `M ${end.x} ${end.y} l ${-PATH_ARROW_HEIGHT} `;

    let dStartLine = `M ${start.x - PATH_START_LENGTH} `;

    if (start.y > end.y) {
      dArrow1 += PATH_ARROW_LENGTH;
      dArrow2 += PATH_ARROW_LENGTH;

      dStartLine += `${start.y - PATH_START_PADDING} h ${2* PATH_START_LENGTH}`;
    } else {
      dArrow1 += -PATH_ARROW_LENGTH;
      dArrow2 += -PATH_ARROW_LENGTH;

      dStartLine += `${start.y + PATH_START_PADDING} h ${2* PATH_START_LENGTH}`;
    }

    if (start.x > end.x) {
      const tmp = start;
      start = end;
      end = tmp;
    }

    const p2Y = start.y + (end.y - start.y) / 2;

    const dPath = `M ${start.x} ${start.y} V ${p2Y} H ${end.x} V ${end.y}`;

    const d = `${dStartLine} ${dPath} ${dArrow1} ${dArrow2}`;

    const path = this._createPath(d);

    const highlight = this._createHighlightTrigger(dPath);

    return {
      path,
      highlight
    };
  }

  removeHoverEffect() {
    this._onMouseLeave();
  }

  _onMouseEnter() {
    this.pathElem.classList.add('pathHover');
    this.fromTable.highlightFrom(this.fromColumn);
    this.toTable.highlightTo(this.toColumn);
  }

  _onMouseLeave() {
    if (this.pathElem) {
      this.pathElem.classList.remove('pathHover');
      this.fromTable.removeHighlightFrom(this.fromColumn);
      this.toTable.removeHighlightTo(this.toColumn);
    }
  }

  _setElems(elem, highlightTrigger) {
    this.pathElem = elem;
    this.highlightTrigger = highlightTrigger;
    highlightTrigger.onmouseenter = this._onMouseEnter.bind(this);
    highlightTrigger.onmouseleave = this._onMouseLeave.bind(this);
  }

  _createHighlightTrigger(d) {
    const path = document.createElementNS(constant.nsSvg, 'path');
    path.setAttributeNS(null, 'd', d);
    path.classList.add('highlight');

    return path;
  }

  _createPath(d) {
    const path = document.createElementNS(constant.nsSvg, 'path');

    path.setAttributeNS(null, 'd', d);

    return path;
  }

  render() {
    // if (this.toPathIndex == null || this.fromPathCount == null) throw new MissingCountIndex();

    const fromTableSides = this.fromTable.getSides();
    const toTableSides = this.toTable.getSides();

    switch (this.fromTablePathSide) {
      case constant.PATH_LEFT:
        {
          const start = this._getLeftSidePathCord(fromTableSides, this.fromPathIndex, this.fromPathCount);
          switch (this.toTablePathSide) {
            case constant.PATH_LEFT:
              {
                const end = this._getLeftSidePathCord(toTableSides, this.toPathIndex, this.toPathCount);

                const dStartLine = `M ${start.x - PATH_START_PADDING} ${start.y - PATH_START_LENGTH} v ${PATH_START_LENGTH * 2}`;

                const dPath = `M ${start.x} ${start.y} h ${-PATH_SELF_RELATION_LENGTH}
                                V ${end.y}
                                h ${PATH_SELF_RELATION_LENGTH}`;

                const dArrow = `M ${end.x} ${end.y} l ${-PATH_ARROW_LENGTH} ${-PATH_ARROW_HEIGHT}
                                M ${end.x} ${end.y} l ${-PATH_ARROW_LENGTH} ${PATH_ARROW_HEIGHT}`;

                const d = dStartLine + dPath + dArrow;

                const path = this._createPath(d);

                const highlightTrigger = this._createHighlightTrigger(dPath);

                this._setElems(path, highlightTrigger);
              }
              break;
            case constant.PATH_RIGHT:
              {
                const end = this._getRightSidePathCord(toTableSides, this.toPathIndex, this.toPathCount);

                const result = this._get3LinePathHoriz(start, end);
                this._setElems(result.path, result.highlight);
              }
              break;
            case constant.PATH_TOP:
              {
                const end = this._getTopSidePathCord(toTableSides, this.toPathIndex, this.toPathCount);

                const result = this._get2LinePathFlatTop(start, end);
                this._setElems(result.path, result.highlight);
              }
              break;
            case constant.PATH_BOTTOM:
              {
                const end = this._getBottomSidePathCord(toTableSides, this.toPathIndex, this.toPathCount);

                const result = this._get2LinePathFlatBottom(start, end);
                this._setElems(result.path, result.highlight);
              }
              break;
          }
        }
        break;
      case constant.PATH_RIGHT:
        {
          const start = this._getRightSidePathCord(fromTableSides, this.fromPathIndex, this.fromPathCount);

          switch (this.toTablePathSide) {
            case constant.PATH_LEFT:
              {
                const end = this._getLeftSidePathCord(toTableSides, this.toPathIndex, this.toPathCount);
                const result = this._get3LinePathHoriz(start, end);

                this._setElems(result.path, result.highlight);
              }
              break;
            case constant.PATH_RIGHT:
              {
                const end = this._getRightSidePathCord(toTableSides, this.toPathIndex, this.toPathCount);

                const dStartLine = `M ${start.x + PATH_START_PADDING} ${start.y - PATH_START_LENGTH} v ${PATH_START_LENGTH * 2}`;

                const dPath = `M ${start.x} ${start.y} h ${PATH_SELF_RELATION_LENGTH}
                                V ${end.y}
                                h ${-PATH_SELF_RELATION_LENGTH}`;

                const dArrow = `M ${end.x} ${end.y} l ${PATH_ARROW_LENGTH} ${-PATH_ARROW_HEIGHT}
                                M ${end.x} ${end.y} l ${PATH_ARROW_LENGTH} ${PATH_ARROW_HEIGHT}`;

                const d = dStartLine + dPath + dArrow;

                const path = this._createPath(d);

                const highlightTrigger = this._createHighlightTrigger(dPath);

                this._setElems(path, highlightTrigger);
              }
              break;
            case constant.PATH_TOP:
              {
                const end = this._getTopSidePathCord(toTableSides, this.toPathIndex, this.toPathCount);
                const result = this._get2LinePathFlatTop(start, end);
                this._setElems(result.path, result.highlight);
              }
              break;
            case constant.PATH_BOTTOM:
              {
                const end = this._getBottomSidePathCord(toTableSides, this.toPathIndex, this.toPathCount);
                const result = this._get2LinePathFlatBottom(start, end);
                this._setElems(result.path, result.highlight);
              }
              break;
          }
        }
        break;
      case constant.PATH_TOP:
        {
          const start = this._getTopSidePathCord(fromTableSides, this.fromPathIndex, this.fromPathCount);

          switch (this.toTablePathSide) {
            case constant.PATH_LEFT:
              {
                const end = this._getLeftSidePathCord(toTableSides, this.toPathIndex, this.toPathCount);
                const result = this._get2LinePathFlatTop(start, end);
                this._setElems(result.path, result.highlight);
              }
              break;
            case constant.PATH_RIGHT:
              {
                const end = this._getRightSidePathCord(toTableSides, this.toPathIndex, this.toPathCount);
                const result = this._get2LinePathFlatTop(start, end);
                this._setElems(result.path, result.highlight);
              }
              break;
            case constant.PATH_TOP:
              {
                const end = this._getTopSidePathCord(toTableSides, this.toPathIndex, this.toPathCount);

                const dStartLine = `M ${start.x - PATH_START_LENGTH} ${start.y - PATH_START_PADDING} h ${PATH_START_LENGTH * 2}`;

                const dPath = `M ${start.x} ${start.y} v ${-PATH_SELF_RELATION_LENGTH}
                                H ${end.x}
                                v ${PATH_SELF_RELATION_LENGTH}`;

                const dArrow = `M ${end.x} ${end.y} l ${-PATH_ARROW_HEIGHT} ${-PATH_ARROW_LENGTH}
                                M ${end.x} ${end.y} l ${PATH_ARROW_HEIGHT} ${-PATH_ARROW_LENGTH}`;

                const d = dStartLine + dPath + dArrow;

                const path = this._createPath(d);

                const highlightTrigger = this._createHighlightTrigger(dPath);

                this._setElems(path, highlightTrigger);
              }
              break;
            case constant.PATH_BOTTOM:
              {
                const end = this._getBottomSidePathCord(toTableSides, this.toPathIndex, this.toPathCount);
                const result = this._get3LinePathVert(start, end);
                this._setElems(result.path, result.highlight);
              }
              break;
          }
        }
        break;
      case constant.PATH_BOTTOM:
        {
          const start = this._getBottomSidePathCord(fromTableSides, this.fromPathIndex, this.fromPathCount);

          switch (this.toTablePathSide) {
            case constant.PATH_LEFT:
              {
                const end = this._getLeftSidePathCord(toTableSides, this.toPathIndex, this.toPathCount);
                const result = this._get2LinePathFlatBottom(start, end);
                this._setElems(result.path, result.highlight);
              }
              break;
            case constant.PATH_RIGHT:
              {
                const end = this._getRightSidePathCord(toTableSides, this.toPathIndex, this.toPathCount);
                const result = this._get2LinePathFlatBottom(start, end);
                this._setElems(result.path, result.highlight);
              }
              break;
            case constant.PATH_TOP:
              {
                const end = this._getTopSidePathCord(toTableSides, this.toPathIndex, this.toPathCount);
                const result = this._get3LinePathVert(start, end);
                this._setElems(result.path, result.highlight);
              }
              break;
            case constant.PATH_BOTTOM:
              {
                const end = this._getBottomSidePathCord(toTableSides, this.toPathIndex, this.toPathCount);

                const dStartLine = `M ${start.x - PATH_START_LENGTH} ${start.y + PATH_START_PADDING} h ${PATH_START_LENGTH * 2}`;

                const dPath = `M ${start.x} ${start.y} v ${PATH_SELF_RELATION_LENGTH}
                                H ${end.x}
                                v ${-PATH_SELF_RELATION_LENGTH}`;

                const dArrow = `M ${end.x} ${end.y} l ${-PATH_ARROW_HEIGHT} ${PATH_ARROW_LENGTH}
                                M ${end.x} ${end.y} l ${PATH_ARROW_HEIGHT} ${PATH_ARROW_LENGTH}`;

                const d = dStartLine + dPath + dArrow;

                const path = this._createPath(d);

                const highlightTrigger = this._createHighlightTrigger(dPath);

                this._setElems(path, highlightTrigger);
              }
              break;
          }
        }
        break;
    }
    if (!this.pathElem) return [];
    return [this.pathElem, this.highlightTrigger];
  }

  sameTableRelation() {
    return this.fromTable === this.toTable;
  }

  calcPathTableSides() {
    if (this.fromTable === this.toTable) {
      return this;
    }
    const fromTableCenter = this.fromTable.getCenter();
    const toTableCenter = this.toTable.getCenter();

    const fromTableSides = this.fromTable.getSides();

    const intersectFromTableRightSide = segmentIntersection(fromTableCenter, toTableCenter, fromTableSides.right.p1, fromTableSides.right.p2);
    if (intersectFromTableRightSide) {
      this.fromIntersectPoint = intersectFromTableRightSide;
      this.fromTablePathSide = constant.PATH_RIGHT;
    }
    const intersectFromTableLeftSide = segmentIntersection(fromTableCenter, toTableCenter, fromTableSides.left.p1, fromTableSides.left.p2);
    if (intersectFromTableLeftSide) {
      this.fromIntersectPoint = intersectFromTableLeftSide;
      this.fromTablePathSide = constant.PATH_LEFT;
    }
    const intersectFromTableTopSide = segmentIntersection(fromTableCenter, toTableCenter, fromTableSides.top.p1, fromTableSides.top.p2);
    if (intersectFromTableTopSide) {
      this.fromIntersectPoint = intersectFromTableTopSide;
      this.fromTablePathSide = constant.PATH_TOP;
    }
    const intersectFromTableBottomSide = segmentIntersection(fromTableCenter, toTableCenter, fromTableSides.bottom.p1, fromTableSides.bottom.p2);
    if (intersectFromTableBottomSide) {
      this.fromIntersectPoint = intersectFromTableBottomSide;
      this.fromTablePathSide = constant.PATH_BOTTOM;
    }

    const toTableSides = this.toTable.getSides();

    const intersectToTableRightSide = segmentIntersection(fromTableCenter, toTableCenter, toTableSides.right.p1, toTableSides.right.p2);
    if (intersectToTableRightSide) {
      this.toIntersectPoint = intersectToTableRightSide;
      this.toTablePathSide = constant.PATH_RIGHT;
    }
    const intersectToTableLeftSide = segmentIntersection(fromTableCenter, toTableCenter, toTableSides.left.p1, toTableSides.left.p2);
    if (intersectToTableLeftSide) {
      this.toIntersectPoint = intersectToTableLeftSide;
      this.toTablePathSide = constant.PATH_LEFT;
    }
    const intersectToTableTopSide = segmentIntersection(fromTableCenter, toTableCenter, toTableSides.top.p1, toTableSides.top.p2);
    if (intersectToTableTopSide) {
      this.toIntersectPoint = intersectToTableTopSide;
      this.toTablePathSide = constant.PATH_TOP;
    }
    const intersectToTableBottomSide = segmentIntersection(fromTableCenter, toTableCenter, toTableSides.bottom.p1, toTableSides.bottom.p2);
    if (intersectToTableBottomSide) {
      this.toIntersectPoint = intersectToTableBottomSide;
      this.toTablePathSide = constant.PATH_BOTTOM;
    }
  }

  getElems() {
    if (!this.pathElem) {
      return [];
    }
    return [this.pathElem, this.highlightTrigger];
  }

  static ySort(arr, table) {
    arr.sort((r1, r2) => {
      if (r1.fromIntersectPoint == null || r2.fromIntersectPoint == null) {
        return -1;
      }
      if (r1.fromTable === table) {
        if (r2.fromTable === table) {
          return r1.fromIntersectPoint.y - r2.fromIntersectPoint.y;
        }
        return r1.fromIntersectPoint.y - r2.toIntersectPoint.y;
      } else {
        if (r2.fromTable === table) {
          return r1.toIntersectPoint.y - r2.fromIntersectPoint.y;
        }
        return r1.toIntersectPoint.y - r2.toIntersectPoint.y;
      }
    });
  }

  static xSort(arr, table) {
    arr.sort((r1, r2) => {
      if (r1.fromIntersectPoint == null || r2.fromIntersectPoint == null) {
        return -1;
      }
      if (r1.fromTable === table) {
        if (r2.fromTable === table) {
          return r1.fromIntersectPoint.x - r2.fromIntersectPoint.x;
        }
        return r1.fromIntersectPoint.x - r2.toIntersectPoint.x;
      } else {
        if (r2.fromTable === table) {
          return r1.toIntersectPoint.x - r2.fromIntersectPoint.x;
        }
        return r1.toIntersectPoint.x - r2.toIntersectPoint.x;
      }
    });
  }
}