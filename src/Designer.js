import Relation from './Relation.js';
import constant from './const.js';

export default class Designer {
  constructor(mainElem) {
    this.mainElem = mainElem;
    this._container = this.mainElem.getElementById('designer-container');
    this._svgElem = this.mainElem.getElementById('designer');
    this._minimap = this.mainElem.getElementById('minimap');
    this._viewpoint = this.mainElem.getElementById('viewpoint');
    this._btnZoomIn = this.mainElem.getElementById('btn-zoom-in');
    this._btnZoomOut = this.mainElem.getElementById('btn-zoom-out');

    this._designerWidth = this._svgElem.scrollWidth;
    this._designerHeight = this._svgElem.scrollHeight;

    this._viewBoxVals = {
      minX: 0,
      minY: 0,
      width: this._designerWidth,
      height: this._designerHeight,
    };

    this._minimap.style.width = constant.DESIGNER_PAN_WIDTH * parseInt(this._minimap.style.height, 10) / constant.DESIGNER_PAN_HEIGHT + 'px';

    this._svgElem.style['max-width'] = constant.DESIGNER_PAN_WIDTH;
    this._svgElem.style['max-height'] = constant.DESIGNER_PAN_HEIGHT;

    this._minimap.setAttribute('viewBox', `0 0 ${constant.DESIGNER_PAN_WIDTH} ${constant.DESIGNER_PAN_HEIGHT}`);

    this._setUpEvents();

    this._relationInfos = [];

    this._zoom = 1;

    this._tableMinimap = new Map();
  }

  load(tables) {
    this._relationInfos = [];
    this._svgElem.innerHTML = '';
    this.tables = tables;
    tables.forEach((table) => {
      table.setDesigner(this);
      table.setMoveListener(this.onTableMove.bind(this));
    });

    this.draw();
  }

  onTableMove(table, deltaX, deltaY) {
    this._drawRelations();

    const minimapTableElem = this._tableMinimap.get(table);

    minimapTableElem.setAttributeNS(null, 'transform', `translate(${deltaX},${deltaY})`);
  }

  _drawRelations() {
    this.tables.forEach((table) => {
      const tableRelations = this._getTableRelations(table);

      const pendingSelfRelations = tableRelations.filter((relation) => relation.calcPathTableSides());

      const leftRelations = tableRelations.filter((r) =>
        ((r.toTable === table && r.toTablePathSide === constant.PATH_LEFT) ||
          (r.fromTable === table && r.fromTablePathSide === constant.PATH_LEFT)) &&
        !r.sameTableRelation());
      const rightRelations = tableRelations.filter((r) =>
        ((r.toTable === table && r.toTablePathSide === constant.PATH_RIGHT) ||
          (r.fromTable === table && r.fromTablePathSide === constant.PATH_RIGHT)) &&
        !r.sameTableRelation());
      const topRelations = tableRelations.filter((r) =>
        ((r.toTable === table && r.toTablePathSide === constant.PATH_TOP) ||
          (r.fromTable === table && r.fromTablePathSide === constant.PATH_TOP)) &&
        !r.sameTableRelation());
      const bottomRelations = tableRelations.filter((r) =>
        ((r.toTable === table && r.toTablePathSide === constant.PATH_BOTTOM) ||
          (r.fromTable === table && r.fromTablePathSide === constant.PATH_BOTTOM)) &&
        !r.sameTableRelation());

      Relation.ySort(leftRelations, table);
      Relation.ySort(rightRelations, table);
      Relation.xSort(topRelations, table);
      Relation.xSort(bottomRelations, table);

      const sidesAndCount = [{
          side: 'left',
          order: 1,
          count: leftRelations.length,
        },
        {
          side: 'right',
          order: 2,
          count: rightRelations.length,
        },
        {
          side: 'top',
          order: 3,
          count: topRelations.length,
        },
        {
          side: 'bottom',
          order: 4,
          count: bottomRelations.length,
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
          case 'left':
            leftRelations.push(pendingSelfRelation);
            pendingSelfRelation.fromTablePathSide = constant.PATH_LEFT;
            pendingSelfRelation.toTablePathSide = constant.PATH_LEFT;
            break;
          case 'right':
            rightRelations.push(pendingSelfRelation);
            pendingSelfRelation.fromTablePathSide = constant.PATH_RIGHT;
            pendingSelfRelation.toTablePathSide = constant.PATH_RIGHT;
            break;
          case 'top':
            topRelations.push(pendingSelfRelation);
            pendingSelfRelation.fromTablePathSide = constant.PATH_TOP;
            pendingSelfRelation.toTablePathSide = constant.PATH_TOP;
            break;
          case 'bottom':
            bottomRelations.push(pendingSelfRelation);
            pendingSelfRelation.fromTablePathSide = constant.PATH_BOTTOM;
            pendingSelfRelation.toTablePathSide = constant.PATH_BOTTOM;
            break;
        }
        minPathSideCount.count += 2;
      });

      let pathIndex = 0;
      leftRelations.forEach((relation) => {
        const count = sidesAndCount.find((item) => item.side === 'left').count;
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

      pathIndex = 0;
      rightRelations.forEach((relation) => {
        const count = sidesAndCount.find((item) => item.side === 'right').count;
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

      pathIndex = 0;
      topRelations.forEach((relation) => {
        const count = sidesAndCount.find((item) => item.side === 'top').count;
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

      pathIndex = 0;
      bottomRelations.forEach((relation) => {
        const count = sidesAndCount.find((item) => item.side === 'bottom').count;
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
    });

    this._relationInfos.forEach((relation) => {
      relation.removeHoverEffect();
      relation.getElems().forEach((elem) => this._svgElem.removeChild(elem));
      const elems = relation.render();
      elems.forEach((elem) => this._svgElem.prepend(elem));
    });
  }

  draw() {
    let minX = Number.MAX_SAFE_INTEGER;
    let maxX = Number.MIN_SAFE_INTEGER;
    let minY = Number.MAX_SAFE_INTEGER;
    let maxY = Number.MIN_SAFE_INTEGER;

    this.tables.forEach((table, i) => {
      const tableElm = table.render();
      tableElm.setAttribute('id', i + 'table');
      this._svgElem.appendChild(tableElm);

      const sides = table.getSides();

      const tableMini = document.createElementNS(constant.nsSvg, 'rect');
      tableMini.setAttributeNS(null, 'class', 'mini_table');
      tableMini.setAttributeNS(null, 'transform', `translate(${sides.left.p1.x}, ${sides.left.p1.y})`);
      tableMini.setAttributeNS(null, 'width', sides.top.p2.x - sides.top.p1.x);
      tableMini.setAttributeNS(null, 'height', sides.left.p2.y - sides.left.p1.y);
      this._tableMinimap.set(table, tableMini);
      this._minimap.appendChild(tableMini);

      table.columns.forEach((column) => {
        if (column.fk) {
          let relationInfo = {
            fromTable: table,
            toTable: column.fk.table,
            fromColumn: column,
            toColumn: column.fk.column,
          };
          relationInfo = new Relation(relationInfo);
          this._relationInfos.push(relationInfo);
        }
      });

      const rightX = table.getSides().right.p1.x;
      if (rightX > maxX) {
        maxX = rightX;
      }

      const leftX = table.getSides().left.p1.x;
      if (leftX < minX) {
        minX = leftX;
      }

      const topY = table.getSides().top.p1.y;
      if (topY < minY) {
        minY = topY;
      }

      const bottomY = table.getSides().bottom.p1.y;
      if (bottomY > maxY) {
        maxY = bottomY;
      }
    });

    setTimeout(() => {
      this._windowResizeEvent();
      this._drawRelations();
    });

    // After draw happened
    setTimeout(() => {
      this.tables.forEach((table) => table.postDraw && table.postDraw());
    });
  }

  _getTableRelations(table) {
    return this._relationInfos.filter((relations) => {
      return relations.fromTable === table || relations.toTable === table;
    });
  }

  _setViewBox() {
    this._svgElem.setAttribute('viewBox',
      `${this._viewBoxVals.minX} ${this._viewBoxVals.minY} ${this._viewBoxVals.width} ${this._viewBoxVals.height}`);
    this._viewpoint.setAttributeNS(null, 'x', this._viewBoxVals.minX);
    this._viewpoint.setAttributeNS(null, 'y', this._viewBoxVals.minY);
    this._viewpoint.setAttributeNS(null, 'width', this._viewBoxVals.width);
    this._viewpoint.setAttributeNS(null, 'height', this._viewBoxVals.height);
  }

  getCords() {
    const bRect = this._svgElem.getBoundingClientRect();
    return {
      x: bRect.left,
      y: bRect.top,
    };
  }

  _viewportAddjustment() {
    const offsetWidth = this._viewBoxVals.width + this._viewBoxVals.minX - constant.DESIGNER_PAN_WIDTH;
    if (offsetWidth > 0) {
      this._viewBoxVals.minX -= offsetWidth;
    }

    const offsetHeight = this._viewBoxVals.height + this._viewBoxVals.minY - constant.DESIGNER_PAN_HEIGHT;
    if (offsetHeight > 0) {
      this._viewBoxVals.minY -= offsetHeight;
    }
  }

  _windowResizeEvent() {
    this._designerWidth = this._svgElem.scrollWidth;
    this._designerHeight = this._svgElem.scrollHeight;

    this._viewBoxVals.width = this._designerWidth / this._zoom;
    this._viewBoxVals.height = this._designerHeight / this._zoom;

    this._viewportAddjustment();

    this._setViewBox();
  }

  _setUpEvents() {
    const ZOOM = 1.2;

    window.addEventListener('resize', this._windowResizeEvent.bind(this));

    let prevMouseCordX;
    let prevMouseCordY;

    const mouseMove = (event) => {
      const deltaX = (event.clientX - prevMouseCordX) / this._zoom;
      const deltaY = (event.clientY - prevMouseCordY) / this._zoom;

      prevMouseCordY = event.clientY;
      prevMouseCordX = event.clientX;

      if (this._viewBoxVals.minX - deltaX + this._designerWidth / this._zoom < constant.DESIGNER_PAN_WIDTH &&
        this._viewBoxVals.minX - deltaX >= 0) {
        this._viewBoxVals.minX -= deltaX;
      }
      if (this._viewBoxVals.minY - deltaY + this._designerHeight / this._zoom < constant.DESIGNER_PAN_HEIGHT &&
        this._viewBoxVals.minY - deltaY >= 0) {
        this._viewBoxVals.minY -= deltaY;
      }
      this._setViewBox();
    };

    this._container.addEventListener('mouseleave', () => {
      this.mainElem.removeEventListener('mousemove', mouseMove);
    });

    this._container.addEventListener('mousedown', (event) => {
      prevMouseCordX = event.clientX;
      prevMouseCordY = event.clientY;
      this.mainElem.addEventListener('mousemove', mouseMove);
    });

    this.mainElem.addEventListener('mouseup', () => {
      this.mainElem.removeEventListener('mousemove', mouseMove);
    }, false);

    this._btnZoomIn.addEventListener('click', () => {
      this._viewBoxVals.width = this._viewBoxVals.width / ZOOM;
      this._viewBoxVals.height = this._viewBoxVals.height / ZOOM;
      this._setViewBox();
      this._zoom *= ZOOM;
    });

    this._btnZoomOut.addEventListener('click', () => {
      if (this._viewBoxVals.height * ZOOM <= constant.DESIGNER_PAN_HEIGHT &&
        this._viewBoxVals.width * ZOOM <= constant.DESIGNER_PAN_WIDTH) {
        this._viewBoxVals.width = this._viewBoxVals.width * ZOOM;
        this._viewBoxVals.height = this._viewBoxVals.height * ZOOM;

        this._viewportAddjustment();

        this._setViewBox();
        this._zoom /= ZOOM;
      }
    });

    if (this.tables) {
      this.tables.forEach((table) => {
        table.setMoveListener(this.onTableMove.bind(this));
      });
    }
  }

  getZoom() {
    return this._zoom;
  }

  getPan() {
    return {
      x: this._viewBoxVals.minX,
      y: this._viewBoxVals.minY,
    };
  }

  getMousePosRelativeContainer(event) {
    return {
      x: event.clientX - this._container.offsetLeft,
      y: event.clientY - this._container.offsetTop
    };
  }
}
