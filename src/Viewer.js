import Relation from './Relation.js';
import constant from './const.js';
import Minimap from './Minimap.js';

export default class Viewer {
  constructor(mainElem) {
    this._mainElem = mainElem;
    this._container = this._mainElem.getElementById('veiwer-container');

    this._svgElem = this._mainElem.getElementById('veiwer');
    this._svgContainer = this._mainElem.querySelector('.svg-container');

    this._minimap = new Minimap(mainElem, this, this._svgElem);

    this._setUpEvents();

    this._ZOOM = 1.2;
    this._PINCH_TO_ZOOM_MULTIPLIER = 0.01;
    this._SAFARI_PINCH_TO_ZOOM_MULTIPLIER = 50;
    this._SAFARI_PINCH_TO_ZOOM_OUT_FINGER_DISTANCE = 1;
    this._MAX_ZOOM_VALUE = 2;

    this._disble_scroll_event = false;

    const width = this._svgContainer.clientWidth;
    const height = this._svgContainer.clientHeight;
    this._viewBoxVals = {
      x: 0,
      y: 0,
      width,
      height
    };
    this._minimap.setMinimapViewPoint(this._viewBoxVals);

    this._svgContainer.addEventListener('click', (event) => {
      const x = event.offsetX / this._zoom;
      const y = event.offsetY / this._zoom;
      this._callbacks.viewportClick(x, y);
    });
    this._reset();
  }

  _reset() {
    this._zoom = 1;

    this._svgElem.style.height = constant.VIEWER_PAN_HEIGHT + 'px';
    this._svgElem.style.width = constant.VIEWER_PAN_WIDTH + 'px';
    this._svgElem.setAttribute('viewBox', `0 0 ${constant.VIEWER_PAN_WIDTH} ${constant.VIEWER_PAN_HEIGHT}`);

    this._tableMinimap = new Map();
    this._relationInfos = [];

    this._minimap.reset();
  }

  _arrangTablesSpiral(tables) {
    let currentX = constant.VIEWER_PAN_WIDTH / 2;
    let currentY = constant.VIEWER_PAN_HEIGHT / 2;
    tables[0].setTablePos(currentX, currentY);
    let direction = 0;
    let index = 1;
    let numOfTablesTillDirectionChange = 1;
    let countBeforeDirChange = 0;
    while (index < tables.length) {
      if (countBeforeDirChange === 2) {
        ++numOfTablesTillDirectionChange;
        countBeforeDirChange = 0;
      } else {
        ++countBeforeDirChange;
      }
      const lastIndex = index + numOfTablesTillDirectionChange;
      const tablesWithDirection = tables.slice(index, lastIndex);
      tablesWithDirection.forEach((table) => {
        switch (direction) {
          case 0: // right
          currentX += constant.SPIRAL_ARRANGE_DIST_X;
          break;
          case 1: // down
          currentY += constant.SPIRAL_ARRANGE_DIST_Y;
          break;
          case 2: // left
          currentX -= constant.SPIRAL_ARRANGE_DIST_X;
          break;
          case 3: // up
          currentY -= constant.SPIRAL_ARRANGE_DIST_Y;
          break;
        }
        table.setTablePos(currentX, currentY);
      });
      direction = (direction + 1) % 4;
      index = lastIndex;
    }
    return tables;
  }

  load(tables, viewport, tableArrang) {
    this._relationInfos = [];
    this._svgElem.innerHTML = '';
    this.tables = tables;
    tables.forEach((table) => {
      table.setVeiwer(this);
      table.setMoveListener(this.onTableMove.bind(this));
      table.setMoveEndListener(this.onTableMoveEnd.bind(this));
    });

    if (tableArrang === 'spiral') {
      // wait for table render to happen
      setTimeout(() => this._arrangTablesSpiral(tables));
    }

    this.draw(viewport);
  }

  onTableMove(table, deltaX, deltaY) {
    this._drawRelations();

    this._minimap.onTableMove(table, deltaX, deltaY);

    this._callbacks.tableMove(table.data());
  }

  onTableMoveEnd(table) {
    this._callbacks.tableMoveEnd(table.data());
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

  draw(viewport) {
    let minX = Number.MAX_SAFE_INTEGER;
    let maxX = Number.MIN_SAFE_INTEGER;
    let minY = Number.MAX_SAFE_INTEGER;
    let maxY = Number.MIN_SAFE_INTEGER;

    this._tableMinimap = new Map();

    this._minimap.removeTables();

    this.tables.forEach((table, i) => {
      this._minimap.createTable(table);

      const tableElm = table.render();
      tableElm.setAttribute('id', i + 'table');
      this._svgElem.appendChild(tableElm);

      const sides = table.getSides();

      this._minimap.setTableDim(table, sides.top.p2.x - sides.top.p1.x, sides.left.p2.y - sides.left.p1.y);

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

    // After draw happened
    setTimeout(() => {
      this._drawRelations();
      this._setViewPort(viewport).then(() => this.tables.forEach((table) => table.postDraw && table.postDraw()));
    });
  }

  _setViewPort(type) {
    let viewportX;
    let viewportY;
    switch (type) {
      case 'noChange':
      break;
      case 'centerTablesWeight':
      {
        let totalX = 0;
        let totalY = 0;
        this.tables.forEach((table) => {
          const data = table.data();
          totalX += data.pos.x + data.width / 2;
          totalY += data.pos.y + data.height / 2;
        });
        const centerX = totalX / this.tables.length;
        const centerY = totalY / this.tables.length;
        viewportX = centerX - this._viewBoxVals.width / 2;
        viewportY = centerY - this._viewBoxVals.height / 2;
      }
      break;
      case 'center':
      {
        const width = this._svgContainer.clientWidth;
        const height = this._svgContainer.clientHeight;
        viewportX = constant.VIEWER_PAN_WIDTH / 2 - width / 2;
        viewportY = constant.VIEWER_PAN_HEIGHT / 2 - height / 2;
      }
      break;
      default: // centerTables
      {
        if (this.tables.length === 0) {
          return this._setViewPort('center');
        }
        let minX = Number.MAX_SAFE_INTEGER;
        let minY = Number.MAX_SAFE_INTEGER;
        let maxX = Number.MIN_SAFE_INTEGER;
        let maxY = Number.MIN_SAFE_INTEGER;
        this.tables.forEach((table) => {
          const data = table.data();
          if (data.pos.x < minX) minX = data.pos.x;
          if (data.pos.y < minY) minY = data.pos.y;
          if (data.pos.x + data.width > maxX) maxX = data.pos.x + data.width;
          if (data.pos.y + data.height > maxY) maxY = data.pos.y + data.height;
        });
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        viewportX = centerX - this._viewBoxVals.width / 2;
        viewportY = centerY - this._viewBoxVals.height / 2;
      }
      break;
    }
    return Promise.all([this.setPanX(viewportX), this.setPanY(viewportY)]);
  }

  _getTableRelations(table) {
    return this._relationInfos.filter((relations) => {
      return relations.fromTable === table || relations.toTable === table;
    });
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

    this._minimap.setMinimapViewPoint(this._viewBoxVals);
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

      const dividerX = this._svgContainer.clientWidth / targetX;
      const dividerY = this._svgContainer.clientHeight / targetY;

      this._viewBoxVals.width = newWidth;
      this._viewBoxVals.height = newHeight;

      this._viewBoxVals.x -= resizeWidth / dividerX;
      this._viewBoxVals.y -= resizeHeight / dividerY;

      this._viewportAddjustment();

      this._disble_scroll_event = true;
      this._svgContainer.scrollLeft = this._viewBoxVals.x * zoom;
      this._svgContainer.scrollTop = this._viewBoxVals.y * zoom;

      this._minimap.setMinimapViewPoint(this._viewBoxVals);

      if (this._zoom < zoom) {
        this._callbacks.zoomIn(zoom);
      } else {
        this._callbacks.zoomOut(zoom);
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
      const deltaX = (event.clientX - prevMouseCordX);
      const deltaY = (event.clientY - prevMouseCordY);
      prevMouseCordY = event.clientY;
      prevMouseCordX = event.clientX;
      const originalScrollLeft = this._svgContainer.scrollLeft;
      this._svgContainer.scrollLeft -= deltaX;
      if (originalScrollLeft !== this._svgContainer.scrollLeft) {
        this._viewBoxVals.x -= deltaX;
      }
      const originalScrollTop = this._svgContainer.scrollTop;
      this._svgContainer.scrollTop -= deltaY;
      if (originalScrollTop !== this._svgContainer.scrollTop) {
        this._viewBoxVals.y -= deltaY;
      }
      this._minimap.setMinimapViewPoint(this._viewBoxVals);
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

    this._container.addEventListener('mouseleave', this._minimap.onContainerMouseLeave);
    this._container.addEventListener('mouseup', this._minimap.onContainerMouseUp);

    if (this.tables) {
      this.tables.forEach((table) => {
        table.setMoveListener(this.onTableMove.bind(this));
      });
    }

    this._svgContainer.addEventListener('scroll', (event) => {
      if (!this._disble_scroll_event) {
        this._viewBoxVals.x = this._svgContainer.scrollLeft / this._zoom;
        this._viewBoxVals.y = this._svgContainer.scrollTop / this._zoom;
        this._minimap.setMinimapViewPoint(this._viewBoxVals);
        if (this._panXResolver) {
          this._panXResolver();
          delete this._panXResolver;
        }
        if (this._panYResolver) {
          this._panYResolver();
          delete this._panYResolver;
        }
      }
      this._disble_scroll_event = false;
    });

    this._container.addEventListener('wheel', (event) => {
      if (event.ctrlKey) {
        const clientRect = this._svgContainer.getBoundingClientRect();
        const targetX = event.clientX - clientRect.left;
        const targetY = event.clientY - clientRect.top;
        this._setZoom(this._zoom - event.deltaY * this._PINCH_TO_ZOOM_MULTIPLIER, targetX, targetY);
        event.preventDefault();
      }
    });

    // safari
    this._container.addEventListener('gesturestart', (event) => {
      if (event.scale != null) {
        this._safariScale = event.scale;
      }
      event.preventDefault();
    });
    this._container.addEventListener('gesturechange', (event) => {
      event.preventDefault();
      const clientRect = this._svgContainer.getBoundingClientRect();
      const targetX = event.clientX - clientRect.left;
      const targetY = event.clientY - clientRect.top;
      const scaleChange = event.scale - this._safariScale;
      this._setZoom(this._zoom + scaleChange, targetX, targetY);
      this._safariScale = event.scale;
    }, true);
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
    this._viewBoxVals.x = value / this._zoom;
    this._svgContainer.scrollLeft = value;
    return new Promise((resolve) => this._panXResolver = resolve);
  }

  setPanY(value) {
    this._viewBoxVals.y = value / this._zoom;
    this._svgContainer.scrollTop = value;
    return new Promise((resolve) => this._panYResolver = resolve);
  }

  getMousePosRelativeContainer(event) {
    return {
      x: event.clientX - this._container.getBoundingClientRect().x,
      y: event.clientY - this._container.getBoundingClientRect().y
    };
  }

  setCallbacks(callbacks) {
    this._callbacks = callbacks;
  }

  tableDblClick(table) {
    this._callbacks.tableDblClick(table);
  }

  tableClick(table) {
    this._callbacks.tableClick(table);
  }

  tableContextMenu(table) {
    this._callbacks.tableContextMenu(table);
  }

  disableTableMovement(value) {
    this.tables.forEach((table) => table.disableMovement(value));
  }
}
