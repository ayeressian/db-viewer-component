import Relation from './Relation.js';
import constant from './const.js';

export default class Viewer {
  constructor(mainElem) {
    this._mainElem = mainElem;
    this._container = this._mainElem.getElementById('veiwer-container');

    this._svgElem = this._mainElem.getElementById('veiwer');
    this._minimap = this._mainElem.getElementById('minimap');
    this._viewpoint = this._mainElem.getElementById('viewpoint');
    this._btnZoomIn = this._mainElem.getElementById('btn-zoom-in');
    this._btnZoomOut = this._mainElem.getElementById('btn-zoom-out');
    this._svgContainer = this._mainElem.querySelector('.svg-container');

    this._setUpEvents();

    this._ZOOM = 1.2;
    this._PINCH_TO_ZOOM_MULTIPLIER = 0.01;
    this._MAX_ZOOM_VALUE = 2;

    this._disble_scroll_event = false;

    this._reset();
  }

  _reset() {
    this._zoom = 1;

    this._svgElem.style.height = constant.VIEWER_PAN_HEIGHT + 'px';
    this._svgElem.style.width = constant.VIEWER_PAN_WIDTH + 'px';
    this._svgElem.setAttribute('viewBox', `0 0 ${constant.VIEWER_PAN_WIDTH} ${constant.VIEWER_PAN_HEIGHT}`);

    this._tableMinimap = new Map();
    this._relationInfos = [];

    this._minimap.setAttribute('viewBox', `0 0 ${constant.VIEWER_PAN_WIDTH} ${constant.VIEWER_PAN_HEIGHT}`);

    this._minimap.querySelectorAll('.mini_table').forEach((miniTable) => miniTable.remove());

    this._viewBoxVals = {
      x: 0,
      y: 0,
      width: this._svgContainer.clientWidth,
      height: this._svgContainer.clientHeight,
    };
    this._setMinimapViewPoint();
  }

  load(tables) {
    this._relationInfos = [];
    this._svgElem.innerHTML = '';
    this.tables = tables;
    tables.forEach((table) => {
      table.setVeiwer(this);
      table.setMoveListener(this.onTableMove.bind(this));
    });

    this._reset();

    this.draw();
  }

  onTableMove(table, deltaX, deltaY) {
    this._drawRelations();

    const minimapTableElem = this._tableMinimap.get(table);

    minimapTableElem.setAttributeNS(null, 'x', deltaX);
    minimapTableElem.setAttributeNS(null, 'y', deltaY);

    if (this._tableMoveCallback) {
      this._tableMoveCallback(table.formatData());
    }
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

    this._tableMinimap = new Map();

    this.tables.forEach((table, i) => {
      const tableMini = document.createElementNS(constant.nsSvg, 'rect');
      tableMini.setAttributeNS(null, 'class', 'mini_table');
      this._tableMinimap.set(table, tableMini);
      this._minimap.appendChild(tableMini);

      const tableElm = table.render();
      tableElm.setAttribute('id', i + 'table');
      this._svgElem.appendChild(tableElm);

      const sides = table.getSides();

      tableMini.setAttributeNS(null, 'width', sides.top.p2.x - sides.top.p1.x);
      tableMini.setAttributeNS(null, 'height', sides.left.p2.y - sides.left.p1.y);

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
      // this._windowResizeEvent();
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

  _setMinimapViewPoint() {
    this._viewpoint.setAttributeNS(null, 'x', this._viewBoxVals.x);
    this._viewpoint.setAttributeNS(null, 'y', this._viewBoxVals.y);
    this._viewpoint.setAttributeNS(null, 'width', this._viewBoxVals.width);
    this._viewpoint.setAttributeNS(null, 'height', this._viewBoxVals.height);
  }

  getCords() {
    const bRect = this._svgElem.getBoundingClientRect();
    return {
      x: bRect.left + this._svgContainer.scrollLeft * this._zoom,
      y: bRect.top + this._svgContainer.scrollTop * this._zoom,
    };
  }

  _viewportAddjustment() {
    if (this._viewBoxVals.x < 0) {
      this._viewBoxVals.x = 0;
    } else {
      const offsetWidth = this._viewBoxVals.width + this._viewBoxVals.x - constant.VIEWER_PAN_WIDTH;
      if (offsetWidth > 0) {
        this._viewBoxVals.x -= offsetWidth;
      }
    }

    if (this._viewBoxVals.y < 0) {
      this._viewBoxVals.y = 0;
    } else {
      const offsetHeight = this._viewBoxVals.height + this._viewBoxVals.y - constant.VIEWER_PAN_HEIGHT;
      if (offsetHeight > 0) {
        this._viewBoxVals.y -= offsetHeight;
      }
    }
  }

  _windowResizeEvent() {
    this._viewBoxVals.width = this._svgContainer.clientWidth / this._zoom;
    this._viewBoxVals.height = this._svgContainer.clientHeight / this._zoom;

    this._viewportAddjustment();

    this._setMinimapViewPoint();
  }

  _setZoom(zoom, targetX, targetY) {
    let minZoomValue;
    if (this._svgContainer.offsetWidth > this._svgContainer.offsetHeight) {
      minZoomValue = this._svgContainer.clientWidth / constant.VIEWER_PAN_WIDTH;
    } else {
      minZoomValue = this._svgContainer.clientHeight / constant.VIEWER_PAN_HEIGHT;
    }
    if (minZoomValue != null && minZoomValue > zoom) {
      zoom = minZoomValue;
    }

    if (zoom > this._MAX_ZOOM_VALUE) {
      zoom = this._MAX_ZOOM_VALUE;
    }

    if (zoom !== this._zoom) {
      if (targetX == null) targetX = this._svgContainer.clientWidth / 2;
      if (targetY == null) targetY = this._svgContainer.clientHeight / 2;

      this._svgElem.style.height = constant.VIEWER_PAN_HEIGHT * zoom + 'px';
      this._svgElem.style.width = constant.VIEWER_PAN_WIDTH * zoom + 'px';

      const newWidth = this._svgContainer.clientWidth / zoom;
      const newHeight = this._svgContainer.clientHeight / zoom;

      const resizeWidth = newWidth - this._viewBoxVals.width;
      const resizeHeight = newHeight - this._viewBoxVals.height;

      const shiftX = this._svgContainer.clientWidth / targetX;
      const shiftY = this._svgContainer.clientHeight / targetY;

      this._viewBoxVals.width = newWidth;
      this._viewBoxVals.height = newHeight;

      this._viewBoxVals.x -= resizeWidth / shiftX;
      if (this._viewBoxVals.x < 0) this._viewBoxVals.x = 0;
      this._viewBoxVals.y -= resizeHeight / shiftY;
      if (this._viewBoxVals.y < 0) this._viewBoxVals.y = 0;

      this._disble_scroll_event = true;
      this._svgContainer.scrollLeft = this._viewBoxVals.x * zoom;
      this._svgContainer.scrollTop = this._viewBoxVals.y * zoom;

      this._setMinimapViewPoint();

      if (this._zoom < zoom && this._zoomInCallback) {
        this._zoomInCallback(zoom);
      } else if (this._zoomOutCallback) {
        this._zoomOutCallback(zoom);
      }
      this._zoom = zoom;
    }
  }

  zoomIn() {
    this._setZoom(this._zoom * this._ZOOM);
  }

  zoomOut() {
    this._setZoom(this._zoom / this._ZOOM);
  }

  _setUpEvents() {
    window.addEventListener('resize', this._windowResizeEvent.bind(this));

    let prevMouseCordX;
    let prevMouseCordY;

    const mouseMove = (event) => {
      console.log('hit');
      const deltaX = (event.clientX - prevMouseCordX) / this._zoom;
      const deltaY = (event.clientY - prevMouseCordY) / this._zoom;

      prevMouseCordY = event.clientY;
      prevMouseCordX = event.clientX;

      if (this._svgContainer.scrollLeft - deltaX + this._svgContainer.clientWidth / this._zoom < constant.VIEWER_PAN_WIDTH &&
        this._svgContainer.scrollLeft - deltaX >= 0) {
        this._viewBoxVals.x -= deltaX;
        this._svgContainer.scrollLeft -= deltaX;
      }
      if (this._svgContainer.scrollTop - deltaY + this._svgContainer.clientHeight / this._zoom < constant.VIEWER_PAN_HEIGHT &&
        this._svgContainer.scrollTop - deltaY >= 0) {
        this._viewBoxVals.y -= deltaY;
        this._svgContainer.scrollTop -= deltaY;
      }
      this._setMinimapViewPoint();
    };

    this._container.addEventListener('mouseleave', () => {
      this._svgElem.classList.remove('pan');
      this._mainElem.removeEventListener('mousemove', mouseMove);
    });

    this._container.addEventListener('mousedown', (event) => {
      if (event.button === 0) {
        this._svgElem.classList.add('pan');
        prevMouseCordX = event.clientX;
        prevMouseCordY = event.clientY;
        this._mainElem.addEventListener('mousemove', mouseMove);
      }
    });

    this._mainElem.addEventListener('mouseup', () => {
      this._svgElem.classList.remove('pan');
      this._mainElem.removeEventListener('mousemove', mouseMove);
    });

    this._btnZoomIn.addEventListener('click', this.zoomIn.bind(this));

    this._btnZoomOut.addEventListener('click', this.zoomOut.bind(this));

    if (this.tables) {
      this.tables.forEach((table) => {
        table.setMoveListener(this.onTableMove.bind(this));
      });
    }

    this._svgContainer.addEventListener('scroll', (event) => {
      if (!this._disble_scroll_event) {
        this._viewBoxVals.x = this._svgContainer.scrollLeft / this._zoom;
        this._viewBoxVals.y = this._svgContainer.scrollTop / this._zoom;
        this._setMinimapViewPoint();
      }
      this._disble_scroll_event = false;
    });

    const minimapMouseMove = this._minimapPositionFromMouse.bind(this);

    this._minimap.addEventListener('mousedown', (event) => {
      if (event.button === 0) {
        this._minimapPositionFromMouse(event);
        this._minimap.addEventListener('mousemove', minimapMouseMove);
      }
    });
    this._container.addEventListener('mouseleave', () => {
      this._minimap.removeEventListener('mousemove', minimapMouseMove);
    });
    this._container.addEventListener('mouseup', () => {
      this._minimap.removeEventListener('mousemove', minimapMouseMove);
    });

    this._container.addEventListener('wheel', (event) => {
      if (event.ctrlKey) {
        this._setZoom(this._zoom - event.deltaY * this._PINCH_TO_ZOOM_MULTIPLIER, event.offsetX, event.offsetY);
        event.preventDefault();
      }
    });
  }

  _minimapPositionFromMouse(event) {
    event.stopPropagation();
    const minimapBoundingClientRect = this._minimap.getBoundingClientRect();
    const x = event.clientX - minimapBoundingClientRect.x;
    const y = event.clientY - minimapBoundingClientRect.y;
    const svgElemBoundingClientRect = this._svgElem.getBoundingClientRect();
    const ratioX = svgElemBoundingClientRect.width / minimapBoundingClientRect.width;
    const ratioY = svgElemBoundingClientRect.height / minimapBoundingClientRect.height;
    const _viewpointBoundingClientRect = this._viewpoint.getBoundingClientRect();
    this._viewBoxVals.x = (x - _viewpointBoundingClientRect.width / 2) * ratioX;
    this._viewBoxVals.y = (y - _viewpointBoundingClientRect.height / 2) * ratioY;
    this._viewportAddjustment();
    console.log('hit2');
    this._svgContainer.scrollLeft = this._viewBoxVals.x;
    this._svgContainer.scrollTop = this._viewBoxVals.y;
  }

  getZoom() {
    return this._zoom;
  }

  getTablePos(tableName) {
    return this.tables.find((table) => table.name === tableName).pos;
  }

  getPan() {
    return {
      x: this._svgContainer.scrollLeft,
      y: this._svgContainer.scrollTop,
    };
  }

  getViewPort() {
    return this._viewBoxVals;
  }

  setPanX(value) {
    this._svgContainer.scrollLeft = value;
  }

  setPanY(value) {
    this._svgContainer.scrollTop = value;
  }

  getMousePosRelativeContainer(event) {
    return {
      x: event.clientX - this._container.offsetLeft,
      y: event.clientY - this._container.offsetTop
    };
  }

  setTableDblClickCallback(callback) {
    this._tableDblClickCallback = callback;
  }

  setTableClickCallback(callback) {
    this._tableClickCallback = callback;
  }

  setTableContextMenuCallback(callback) {
    this._tableContextMenuCallback = callback;
  }

  setTableMoveCallback(callback) {
    this._tableMoveCallback = callback;
  }

  setZoomInCallback(callback) {
    this._zoomInCallback = callback;
  }

  setZoomOutCallback(callback) {
    this._zoomOutCallback = callback;
  }

  tableDblClick(table) {
    if (this._tableDblClickCallback) {
      this._tableDblClickCallback(table);
    }
  }

  tableClick(table) {
    if (this._tableClickCallback) {
      this._tableClickCallback(table);
    }
  }

  tableContextMenu(table) {
    if (this._tableContextMenuCallback) {
      this._tableContextMenuCallback(table);
    }
  }
}
