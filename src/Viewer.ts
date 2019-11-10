import constant from './const';
import ICallbacks from './ICallbacks';
import Orientation from './IOrientation';
import ITableData from './ITableData';
import Minimap from './Minimap';
import Relation from './Relation';
import SpiralArrange from './SpiralArrange';
import Table from './Table';

export default class Viewer {

  public isTableMovementDisabled: boolean;
  public tables?: Table[];
  private container: HTMLElement;
  private svgElem: SVGGraphicsElement;
  private svgContainer: HTMLElement;
  private minimap: Minimap;
  private disbleScrollEvent: boolean;
  private viewBoxVals: { x: number; y: number; width: any; height: any; };
  private zoom?: number;
  private callbacks?: ICallbacks;
  private relationInfos?: any[];
  private panXResolver?: () => void;
  private panYResolver?: () => void;
  private safariScale?: number;

  constructor(private mainElem: ShadowRoot) {
    this.container = this.mainElem.getElementById('veiwer-container')!;

    this.svgElem = this.mainElem.querySelector<SVGGraphicsElement>('#veiwer')!;
    this.svgContainer = this.mainElem.querySelector<HTMLElement>('.svg-container')!;

    this.minimap = new Minimap(mainElem, this, this.svgElem);

    this.setUpEvents();

    this.disbleScrollEvent = false;

    const width = this.svgContainer.clientWidth;
    const height = this.svgContainer.clientHeight;
    this.viewBoxVals = {
      height,
      width,
      x: 0,
      y: 0,
    };
    this.minimap.setMinimapViewPoint(this.viewBoxVals);

    this.svgContainer.addEventListener('click', (event: MouseEvent) => {
      const x = event.offsetX / this.zoom!;
      const y = event.offsetY / this.zoom!;
      this.callbacks!.viewportClick(x, y);
    });
    this.reset();

    this.isTableMovementDisabled = false;
  }

  public load(tables: Table[], viewport, tableArrang) {
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
      setTimeout(() => SpiralArrange.call(tables));
    }

    this.draw(viewport);
  }

  public onTableMove(table: Table, deltaX: number, deltaY: number) {
    this.drawRelations();

    this.minimap.onTableMove(table, deltaX, deltaY);

    this.callbacks!.tableMove(table.data());
  }

  public onTableMoveEnd(table: Table) {
    this.callbacks!.tableMoveEnd(table.data());
  }

  public draw(viewport) {
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

      table.getColumns().forEach((column) => {
        if (column.fk) {
          let relationInfo = {
            fromColumn: column,
            fromTable: table,
            toColumn: column.fk.column,
            toTable: column.fk.table,
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

  public getCords() {
    const bRect = this.svgElem.getBoundingClientRect();
    return {
      x: bRect.left + this.svgContainer.scrollLeft * this.zoom!,
      y: bRect.top + this.svgContainer.scrollTop * this.zoom!,
    };
  }

  public viewportAddjustment() {
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

  public zoomIn() {
    this.setZoom(this.zoom! * constant.ZOOM);
  }

  public zoomOut() {
    this.setZoom(this.zoom! / constant.ZOOM);
  }

  public getZoom() {
    return this.zoom;
  }

  public getTablePos(tableName: string) {
    return this.tables!.find((table) => table.name === tableName)!.pos;
  }

  public getPan() {
    return {
      x: this.svgContainer.scrollLeft,
      y: this.svgContainer.scrollTop,
    };
  }

  public getViewPort() {
    return this.viewBoxVals;
  }

  public setPanX(value: number) {
    this.viewBoxVals.x = value / this.zoom!;
    const originalScrollLeft = this.svgContainer.scrollLeft;
    this.svgContainer.scrollLeft = value;
    if (this.svgContainer.scrollLeft === originalScrollLeft) {
      return Promise.resolve();
    } else {
      return new Promise((resolve) => this.panXResolver = resolve);
    }
  }

  public setPanY(value: number) {
    this.viewBoxVals.y = value / this.zoom!;
    const originalScrollTop = this.svgContainer.scrollTop;
    this.svgContainer.scrollTop = value;
    if (this.svgContainer.scrollTop === originalScrollTop) {
      return Promise.resolve();
    } else {
      return new Promise((resolve) => this.panYResolver = resolve);
    }
  }

  public getMousePosRelativeContainer(event: MouseEvent) {
    return {
      x: event.clientX - this.container.getBoundingClientRect().left,
      y: event.clientY - this.container.getBoundingClientRect().top,
    };
  }

  public setCallbacks(callbacks: ICallbacks) {
    this.callbacks = callbacks;
  }

  public tableDblClick(table: ITableData) {
    this.callbacks!.tableDblClick(table);
  }

  public tableClick(table: ITableData) {
    this.callbacks!.tableClick(table);
  }

  public tableContextMenu(table: ITableData) {
    this.callbacks!.tableContextMenu(table);
  }

  public disableTableMovement(value: boolean) {
    this.isTableMovementDisabled = value;
    if (this.tables) {
      this.tables.forEach((table) => table.disableMovement(value));
    }
  }

  private reset() {
    this.zoom = 1;

    this.svgElem.style.height = constant.VIEWER_PAN_HEIGHT + 'px';
    this.svgElem.style.width = constant.VIEWER_PAN_WIDTH + 'px';
    this.svgElem.setAttribute('viewBox', `0 0 ${constant.VIEWER_PAN_WIDTH} ${constant.VIEWER_PAN_HEIGHT}`);

    this.relationInfos = [];

    this.minimap.reset();
  }

  private updatePathIndex(relations: Relation[], side: Orientation, sidesAndCount, table: Table) {
    let pathIndex = 0;
    relations.forEach((relation) => {
      const count = sidesAndCount.find((item) => item.side === side).count;
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
        ((r.toTable === table && r.toTablePathSide === Orientation.Left) ||
          (r.fromTable === table && r.fromTablePathSide === Orientation.Left)) &&
        !r.sameTableRelation());
      const rightRelations = tableRelations.filter((r) =>
        ((r.toTable === table && r.toTablePathSide === Orientation.Right) ||
          (r.fromTable === table && r.fromTablePathSide === Orientation.Right)) &&
        !r.sameTableRelation());
      const topRelations = tableRelations.filter((r) =>
        ((r.toTable === table && r.toTablePathSide === Orientation.Top) ||
          (r.fromTable === table && r.fromTablePathSide === Orientation.Top)) &&
        !r.sameTableRelation());
      const bottomRelations = tableRelations.filter((r) =>
        ((r.toTable === table && r.toTablePathSide === Orientation.Bottom) ||
          (r.fromTable === table && r.fromTablePathSide === Orientation.Bottom)) &&
        !r.sameTableRelation());

      Relation.ySort(leftRelations, table);
      Relation.ySort(rightRelations, table);
      Relation.xSort(topRelations, table);
      Relation.xSort(bottomRelations, table);

      const sidesAndCount = [{
          count: leftRelations.length,
          order: 1,
          side: Orientation.Left,
        },
        {
          count: rightRelations.length,
          order: 2,
          side: Orientation.Right,
        },
        {
          count: topRelations.length,
          order: 3,
          side: Orientation.Top,
        },
        {
          count: bottomRelations.length,
          order: 4,
          side: Orientation.Bottom,
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
          case Orientation.Left:
            leftRelations.push(pendingSelfRelation);
            pendingSelfRelation.fromTablePathSide = Orientation.Left;
            pendingSelfRelation.toTablePathSide = Orientation.Left;
            break;
          case Orientation.Right:
            rightRelations.push(pendingSelfRelation);
            pendingSelfRelation.fromTablePathSide = Orientation.Right;
            pendingSelfRelation.toTablePathSide = Orientation.Right;
            break;
          case Orientation.Top:
            topRelations.push(pendingSelfRelation);
            pendingSelfRelation.fromTablePathSide = Orientation.Top;
            pendingSelfRelation.toTablePathSide = Orientation.Top;
            break;
          case Orientation.Bottom:
            bottomRelations.push(pendingSelfRelation);
            pendingSelfRelation.fromTablePathSide = Orientation.Bottom;
            pendingSelfRelation.toTablePathSide = Orientation.Bottom;
            break;
        }
        minPathSideCount.count += 2;
      });

      this.updatePathIndex(leftRelations, Orientation.Left, sidesAndCount, table);
      this.updatePathIndex(rightRelations, Orientation.Right, sidesAndCount, table);
      this.updatePathIndex(topRelations, Orientation.Top, sidesAndCount, table);
      this.updatePathIndex(bottomRelations, Orientation.Bottom, sidesAndCount, table);
    });

    this.relationInfos!.forEach((relation) => {
      relation.removeHoverEffect();
      relation.getElems().forEach((elem) => this.svgElem.removeChild(elem));
      const elems = relation.render();
      elems.forEach((elem) => this.svgElem.prepend(elem));
    });
  }

  private setViewPort(type) {
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

  private getTableRelations(table: Table): Relation[] {
    return this.relationInfos!.filter((relations) => {
      return relations.fromTable === table || relations.toTable === table;
    });
  }

  private windowResizeEvent() {
    this.viewBoxVals.width = this.svgContainer.clientWidth / this.zoom!;
    this.viewBoxVals.height = this.svgContainer.clientHeight / this.zoom!;

    this.viewportAddjustment();

    this.minimap.setMinimapViewPoint(this.viewBoxVals);
  }

  private setZoom(
    zoom: number,
    targetX = this.svgContainer.clientWidth / 2,
    targetY = this.svgContainer.clientHeight / 2) {
    let minZoomValue: number;
    if (this.svgContainer.offsetWidth > this.svgContainer.offsetHeight) {
      minZoomValue = this.svgContainer.clientWidth / constant.VIEWER_PAN_WIDTH;
    } else {
      minZoomValue = this.svgContainer.clientHeight / constant.VIEWER_PAN_HEIGHT;
    }
    if (minZoomValue > zoom) {
      zoom = minZoomValue;
    }

    if (zoom > constant.MAXZOOM_VALUE) {
      zoom = constant.MAXZOOM_VALUE;
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

      this.viewportAddjustment();

      this.disbleScrollEvent = true;
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

  private setUpEvents() {
    window.addEventListener('resize', this.windowResizeEvent.bind(this));

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
      this.mainElem.removeEventListener('mousemove', mouseMove);
    });

    this.container.addEventListener('mousedown', (event: MouseEvent) => {
      if (event.button === 0) {
        this.svgElem.classList.add('pan');
        prevMouseCordX = event.clientX;
        prevMouseCordY = event.clientY;
        this.mainElem.addEventListener('mousemove', mouseMove);
      }
    });

    this.mainElem.addEventListener('mouseup', () => {
      this.svgElem.classList.remove('pan');
      this.mainElem.removeEventListener('mousemove', mouseMove);
    });

    this.container.addEventListener('mouseleave', this.minimap.onContainerMouseLeave!);
    this.container.addEventListener('mouseup', this.minimap.onContainerMouseUp);

    if (this.tables) {
      this.tables.forEach((table) => {
        table.setMoveListener(this.onTableMove.bind(this));
      });
    }

    this.svgContainer.addEventListener('scroll', () => {
      if (!this.disbleScrollEvent) {
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
      this.disbleScrollEvent = false;
    });

    this.container.addEventListener('wheel', (event: MouseWheelEvent) => {
      if (event.ctrlKey) {
        const clientRect = this.svgContainer.getBoundingClientRect();
        const targetX = event.clientX - clientRect.left;
        const targetY = event.clientY - clientRect.top;
        this.setZoom(this.zoom! - event.deltaY * constant.PINCH_TOZOOM_MULTIPLIER, targetX, targetY);
        event.preventDefault();
      }
    });

    interface IGestureEvent extends MouseEvent {
      scale: number;
    }

    // safari
    this.container.addEventListener('gesturestart', (event: IGestureEvent) => {
      if (event.scale != null) {
        this.safariScale = event.scale;
      }
      event.preventDefault();
    });
    this.container.addEventListener('gesturechange', (event: IGestureEvent) => {
      event.preventDefault();
      const clientRect = this.svgContainer.getBoundingClientRect();
      const targetX = event.clientX - clientRect.left;
      const targetY = event.clientY - clientRect.top;
      const scaleChange = event.scale - this.safariScale!;
      this.setZoom(this.zoom! + scaleChange, targetX, targetY);
      this.safariScale = event.scale;
    }, true);
  }
}
