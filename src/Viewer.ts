import Relation from './Relation';
import constant from './const';
import Minimap from './Minimap';
import { ViewBoxVals } from './ViewBoxVals';
import Table from './Table';

interface Callbacks {
  viewportClick: (x: number, y: number) => void,
  tableMove: (tableData: Object) => void,
  tableMoveEnd: (tableData: Object) => void,
  zoomIn: (zoom: number) => void,
  zoomOut: (zoom: number) => void,
  tableDblClick: (table: Table) => void,
  tableClick: (table: Table) => void,
  tableContextMenu: (table: Table) => void,
}

export default class Viewer {
  private readonly ZOOM = 1.2;
  private readonly PINCH_TO_ZOOM_MULTIPLIER = 0.01;
  private readonly MAX_ZOOM_VALUE = 2;

  private mainElem: ShadowRoot;
  private container: HTMLElement;
  private svgElem: HTMLElement;
  private svgContainer: HTMLElement;
  private minimap: Minimap;
  private disble_scroll_event: boolean;
  private viewBoxVals: ViewBoxVals;
  private zoom?: number;
  private isTableMovementDisabled: boolean;
  private relationInfos?: Array<Relation>;
  private tables?: Array<Table>;
  private panXResolver?: Function;
  private panYResolver?: Function;
  private safariScale?: number;
  private callbacks?: Callbacks;

  constructor(mainElem: ShadowRoot) {
    this.mainElem = mainElem;
    this.container = this.mainElem.getElementById('veiwer-container')!;

    this.svgElem = <HTMLElement>this.mainElem.getElementById('veiwer')!;
    this.svgContainer = <HTMLElement>this.mainElem.querySelector('.svg-container')!;

    this.minimap = new Minimap(mainElem, this, this.svgElem);

    this._setUpEvents();

    this.disble_scroll_event = false;

    const width = this.svgContainer.clientWidth;
    const height = this.svgContainer.clientHeight;
    this.viewBoxVals = {
      x: 0,
      y: 0,
      width,
      height
    };
    this.minimap.setMinimapViewPoint(this.viewBoxVals);

    this.svgContainer.addEventListener('click', (event: MouseEvent) => {
      const x = event.offsetX / this.zoom!;
      const y = event.offsetY / this.zoom!;
      this.callbacks!.viewportClick(x, y);
    });
    this._reset();

    this.isTableMovementDisabled = false;
  }

  _reset() {
    this.zoom = 1;

    this.svgElem.style.height = constant.VIEWER_PAN_HEIGHT + 'px';
    this.svgElem.style.width = constant.VIEWER_PAN_WIDTH + 'px';
    this.svgElem.setAttribute('viewBox', `0 0 ${constant.VIEWER_PAN_WIDTH} ${constant.VIEWER_PAN_HEIGHT}`);

    this.relationInfos = [];

    this.minimap.reset();
  }

  _arrangTablesSpiral(tables: Array<Table>) {
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

  load(tables: Array<Table>, viewport: string, tableArrang: string) {
    this.relationInfos = [];
    this.svgElem.innerHTML = '';
    this.tables = tables;
    tables.forEach((table) => {
      table.setVeiwer(this);
      table.setMoveListener(this.onTableMove.bind(this));
      table.setMoveEndListener(this.onTableMoveEnd.bind(this));
      table.disableMovement(this.isTableMovementDisabled);
    });

    if (tableArrang === 'spiral') {
      // wait for table render to happen
      setTimeout(() => this._arrangTablesSpiral(tables));
    }

    this.draw(viewport);
  }

  onTableMove(table: Table, deltaX: number, deltaY: number) {
    this.drawRelations();

    this.minimap.onTableMove(table, deltaX, deltaY);

    this.callbacks!.tableMove(table.data());
  }

  onTableMoveEnd(table: Table) {
    this.callbacks!.tableMoveEnd(table.data());
  }

  private updatePathIndex(relations: Array<Relation>, side: string, sidesAndCount: Array<{
    side: string,
    order: number,
    count: number,
  }>, table: Table) {
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

  private drawRelations() {
    this.tables!.forEach((table) => {
      const tableRelations = this.getTableRelations(table);

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

      this.updatePathIndex(leftRelations, 'left', sidesAndCount, table);
      this.updatePathIndex(rightRelations, 'right', sidesAndCount, table);
      this.updatePathIndex(topRelations, 'top', sidesAndCount, table);
      this.updatePathIndex(bottomRelations, 'bottom', sidesAndCount, table);
    });

    this.relationInfos!.forEach((relation) => {
      relation.removeHoverEffect();
      relation.getElems().forEach((elem) => this.svgElem.removeChild(elem));
      const elems = relation.render();
      elems.forEach((elem) => this.svgElem.prepend(elem));
    });
  }

  draw(viewport: string) {
    let minX = Number.MAX_SAFE_INTEGER;
    let maxX = Number.MIN_SAFE_INTEGER;
    let minY = Number.MAX_SAFE_INTEGER;
    let maxY = Number.MIN_SAFE_INTEGER;

    this.minimap.removeTables();

    this.tables!.forEach((table, i) => {
      this.minimap.createTable(table);

      const tableElm = table.render();
      tableElm.setAttribute('id', i + 'table');
      this.svgElem.appendChild(tableElm);

      const sides = table.getSides();

      this.minimap.setTableDim(table, sides.top.p2.x - sides.top.p1.x, sides.left.p2.y - sides.left.p1.y);

      table.columns.forEach((column) => {
        if (column.fk) {
          let relationInfo = {
            fromTable: table,
            toTable: column.fk.table,
            fromColumn: column,
            toColumn: column.fk.column,
          };
          relationInfo = new Relation(relationInfo);
          this.relationInfos!.push(relationInfo);
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
      this.drawRelations();
      this.setViewPort(viewport).then(() => this.tables!.forEach((table) => table.postDraw && table.postDraw()));
    });
  }

  private setViewPort(type: string): Promise<any> {
    let viewportX: number;
    let viewportY: number;
    switch (type) {
      case 'noChange':
        break;
      case 'centerByTablesWeight':
        {
          let totalX = 0;
          let totalY = 0;
          const filteredTables = this.tables!.filter((table) => {
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
      case 'center':
        {
          const width = this.svgContainer.clientWidth;
          const height = this.svgContainer.clientHeight;
          viewportX = constant.VIEWER_PAN_WIDTH / 2 - width / 2;
          viewportY = constant.VIEWER_PAN_HEIGHT / 2 - height / 2;
        }
        break;
      default: // centerByTables
        {
          if (this.tables!.length === 0) {
            return this.setViewPort('center');
          }
          let minX = Number.MAX_SAFE_INTEGER;
          let minY = Number.MAX_SAFE_INTEGER;
          let maxX = Number.MIN_SAFE_INTEGER;
          let maxY = Number.MIN_SAFE_INTEGER;
          this.tables!.forEach((table) => {
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
          viewportX = centerX - this.viewBoxVals.width / 2;
          viewportY = centerY - this.viewBoxVals.height / 2;
          if (viewportX < 0) viewportX = 0;
          if (viewportY < 0) viewportY = 0;
        }
        break;
    }
    return Promise.all([this.setPanX(viewportX!), this.setPanY(viewportY!)]);
  }

  private getTableRelations(table: Table): Array<Relation> {
    return this.relationInfos!.filter((relations) => {
      return relations.fromTable === table || relations.toTable === table;
    });
  }

  getCords() {
    const bRect = this.svgElem.getBoundingClientRect();
    return {
      x: bRect.left + this.svgContainer.scrollLeft * this.zoom!,
      y: bRect.top + this.svgContainer.scrollTop * this.zoom!,
    };
  }

  _viewportAddjustment() {
    if (this.viewBoxVals.x < 0) {
      this.viewBoxVals.x = 0;
    } else {
      const offsetWidth = this.viewBoxVals.width + this.viewBoxVals.x - constant.VIEWER_PAN_WIDTH;
      if (offsetWidth > 0) {
        this.viewBoxVals.x -= offsetWidth;
      }
    }

    if (this.viewBoxVals.y < 0) {
      this.viewBoxVals.y = 0;
    } else {
      const offsetHeight = this.viewBoxVals.height + this.viewBoxVals.y - constant.VIEWER_PAN_HEIGHT;
      if (offsetHeight > 0) {
        this.viewBoxVals.y -= offsetHeight;
      }
    }
  }

  _windowResizeEvent() {
    this.viewBoxVals.width = this.svgContainer.clientWidth / this.zoom!;
    this.viewBoxVals.height = this.svgContainer.clientHeight / this.zoom!;

    this._viewportAddjustment();

    this.minimap.setMinimapViewPoint(this.viewBoxVals);
  }

  private setZoom(zoom: number, targetX?: number, targetY?: number) {
    let minZoomValue;
    if (this.svgContainer.offsetWidth > this.svgContainer.offsetHeight) {
      minZoomValue = this.svgContainer.clientWidth / constant.VIEWER_PAN_WIDTH;
    } else {
      minZoomValue = this.svgContainer.clientHeight / constant.VIEWER_PAN_HEIGHT;
    }
    if (minZoomValue != null && minZoomValue > zoom) {
      zoom = minZoomValue;
    }

    if (zoom > this.MAX_ZOOM_VALUE) {
      zoom = this.MAX_ZOOM_VALUE;
    }

    if (zoom !== this.zoom) {
      if (targetX == null) targetX = this.svgContainer.clientWidth / 2;
      if (targetY == null) targetY = this.svgContainer.clientHeight / 2;

      this.svgElem.style.height = constant.VIEWER_PAN_HEIGHT * zoom + 'px';
      this.svgElem.style.width = constant.VIEWER_PAN_WIDTH * zoom + 'px';

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

      this._viewportAddjustment();

      this.disble_scroll_event = true;
      this.svgContainer.scrollLeft = this.viewBoxVals.x * zoom;
      this.svgContainer.scrollTop = this.viewBoxVals.y * zoom;

      this.minimap.setMinimapViewPoint(this.viewBoxVals);

      if (this.zoom! < zoom) {
        this.callbacks!.zoomIn(zoom);
      } else {
        this.callbacks!.zoomOut(zoom);
      }
      this.zoom = zoom;
    }
  }

  zoomIn() {
    this.setZoom(this.zoom! * this.ZOOM);
  }

  zoomOut() {
    this.setZoom(this.zoom! / this.ZOOM);
  }

  _setUpEvents() {
    window.addEventListener('resize', this._windowResizeEvent.bind(this));

    let prevMouseCordX: number;
    let prevMouseCordY: number;

    const mouseMove = (event: MouseEvent) => {
      const deltaX = (event.clientX - prevMouseCordX);
      const deltaY = (event.clientY - prevMouseCordY);
      prevMouseCordY = event.clientY;
      prevMouseCordX = event.clientX;
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
    };

    this.container.addEventListener('mouseleave', () => {
      this.svgElem.classList.remove('pan');
      this.mainElem.removeEventListener('mousemove', <EventListener>mouseMove);
    });

    this.container.addEventListener('mousedown', (event: MouseEvent) => {
      if (event.button === 0) {
        this.svgElem.classList.add('pan');
        prevMouseCordX = event.clientX;
        prevMouseCordY = event.clientY;
        this.mainElem.addEventListener('mousemove', <EventListener>mouseMove);
      }
    });

    this.mainElem.addEventListener('mouseup', () => {
      this.svgElem.classList.remove('pan');
      this.mainElem.removeEventListener('mousemove', <EventListener>mouseMove);
    });

    this.container.addEventListener('mouseleave', <EventListener>this.minimap.onContainerMouseLeave);
    this.container.addEventListener('mouseup', <EventListener>this.minimap.onContainerMouseUp);

    if (this.tables) {
      this.tables.forEach((table) => {
        table.setMoveListener(this.onTableMove.bind(this));
      });
    }

    this.svgContainer.addEventListener('scroll', () => {
      if (!this.disble_scroll_event) {
        this.viewBoxVals.x = this.svgContainer.scrollLeft / this.zoom!;
        this.viewBoxVals.y = this.svgContainer.scrollTop / this.zoom!;
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
      this.disble_scroll_event = false;
    });

    this.container.addEventListener('wheel', (event) => {
      if (event.ctrlKey) {
        const clientRect = this.svgContainer.getBoundingClientRect();
        const targetX = event.clientX - clientRect.left;
        const targetY = event.clientY - clientRect.top;
        this.setZoom(this.zoom! - event.deltaY * this.PINCH_TO_ZOOM_MULTIPLIER, targetX, targetY);
        event.preventDefault();
      }
    });

    // safari
    this.container.addEventListener('gesturestart', (event) => {
      if (event.scale != null) {
        this.safariScale = event.scale;
      }
      event.preventDefault();
    });
    this.container.addEventListener('gesturechange', (event) => {
      event.preventDefault();
      const clientRect = this.svgContainer.getBoundingClientRect();
      const targetX = event.clientX - clientRect.left;
      const targetY = event.clientY - clientRect.top;
      const scaleChange = event.scale - this.safariScale!;
      this.setZoom(this.zoom! + scaleChange, targetX, targetY);
      this.safariScale = event.scale;
    }, true);
  }

  getZoom() {
    return this.zoom;
  }

  getTablePos(tableName: string) {
    return this.tables!.find((table) => table.name === tableName)!.pos;
  }

  getPan() {
    return {
      x: this.svgContainer.scrollLeft,
      y: this.svgContainer.scrollTop,
    };
  }

  getViewPort() {
    return this.viewBoxVals;
  }

  setPanX(value: number) {
    this.viewBoxVals.x = value / this.zoom!;
    const originalScrollLeft = this.svgContainer.scrollLeft;
    this.svgContainer.scrollLeft = value;
    if (this.svgContainer.scrollLeft === originalScrollLeft) {
      return Promise.resolve();
    } else {
      return new Promise((resolve) => this.panXResolver = resolve);
    }
  }

  setPanY(value: number) {
    this.viewBoxVals.y = value / this.zoom!;
    const originalScrollTop = this.svgContainer.scrollTop;
    this.svgContainer.scrollTop = value;
    if (this.svgContainer.scrollTop === originalScrollTop) {
      return Promise.resolve();
    } else {
      return new Promise((resolve) => this.panYResolver = resolve);
    }
  }

  getMousePosRelativeContainer(event: MouseEvent) {
    return {
      x: event.clientX - this.container.getBoundingClientRect().left,
      y: event.clientY - this.container.getBoundingClientRect().top
    };
  }

  setCallbacks(callbacks: Callbacks) {
    this.callbacks! = callbacks;
  }

  tableDblClick(table: Table) {
    this.callbacks!.tableDblClick(table);
  }

  tableClick(table: Table) {
    this.callbacks!.tableClick(table);
  }

  tableContextMenu(table: Table) {
    this.callbacks!.tableContextMenu(table);
  }

  disableTableMovement(value: boolean) {
    this.isTableMovementDisabled = value;
    if (this.tables) {
      this.tables.forEach((table) => table.disableMovement(value));
    }
  }
}
