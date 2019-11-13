import CommonEventListener from './CommonEventListener';
import constant from './const';
import IColumn from './IColumn';
import IPoint from './IPoint';
import { IColumnSchema, ITableSchema } from './ISchema';
import ITableData from './ITableData';
import IVertices from './IVertices';
import Viewer from './Viewer';

const OUT_OF_VIEW_CORD = -1000;

type OnMove = (table: Table, x: number, y: number) => void;

type OnMoveEnd = (table: Table) => void;

export default class Table {

  get pos() {
    return this.posValue;
  }

  get name() {
    return this.nameValue;
  }
  private columns: IColumn[];
  private nameValue: string;
  private posValue: IPoint | string;
  private disableMovementValue: boolean;
  private elem?: SVGGraphicsElement;
  private veiwer?: Viewer;
  private table?: HTMLElement;
  private onMove?: OnMove;
  private initialClientX?: number;
  private initialClientY?: number;
  private onMoveEnd?: OnMoveEnd;
  private foreignObject?: Element;
  private penddingCenter?: boolean;

  constructor({
    name,
    columns = [],
    pos = {
      x: 0,
      y: 0,
    },
  }: ITableSchema) {
    this.columns = columns as IColumnSchema[];
    this.nameValue = name;
    this.posValue = pos;

    this.disableMovementValue = false;
  }

  public getColumns(): IColumn[] {
    return this.columns;
  }

  public setName(name: string) {
    this.nameValue = name;
  }

  public getName() {
    return this.nameValue;
  }

  public addColumn(column: IColumn) {
    this.columns.push(column);
  }

  public setMoveListener(onMove: OnMove) {
    this.onMove = onMove;
  }

  public setMoveEndListener(onMoveEnd: OnMoveEnd) {
    this.onMoveEnd = onMoveEnd;
  }

  public getCenter(): IPoint {
    const bbox = this.elem!.getBBox();

    const x = bbox.x + this.table!.offsetWidth / 2;
    const y = bbox.y + this.table!.offsetHeight / 2;
    return {
      x,
      y,
    };
  }

  public getVertices(): IVertices {
    const bbox = this.elem!.getBBox();
    return {
      bottomLeft: {
        x: bbox.x,
        y: bbox.y + this.table!.offsetHeight,
      },
      bottomRight: {
        x: bbox.x + this.table!.offsetWidth,
        y: bbox.y + this.table!.offsetHeight,
      },
      topLeft: {
        x: bbox.x,
        y: bbox.y,
      },
      topRight: {
        x: bbox.x + this.table!.offsetWidth,
        y: bbox.y,
      },
    };
  }

  public render() {
    this.elem = (document.createElementNS(constant.nsSvg, 'g') as SVGGraphicsElement);
    this.foreignObject = document.createElementNS(constant.nsSvg, 'foreignObject');
    this.elem.appendChild(this.foreignObject);

    this.table = (document.createElementNS(constant.nsHtml, 'table') as HTMLElement);
    this.table.className = 'table';
    const headingTr = document.createElementNS(constant.nsHtml, 'tr');
    this.table.appendChild(headingTr);
    const headingTh = document.createElementNS(constant.nsHtml, 'th');
    headingTh.setAttributeNS(null, 'colspan', 3 + '');
    headingTh.innerHTML = this.nameValue;
    headingTr.appendChild(headingTh);

    this.foreignObject.appendChild(this.table);

    this.columns.forEach((column) => {
      const columnTr = document.createElementNS(constant.nsHtml, 'tr') as HTMLTableRowElement;
      column.elem = columnTr;
      this.table!.appendChild(columnTr);

      const columnStatusTd = document.createElementNS(constant.nsHtml, 'td');
      if (column.pk) {
        const pdDiv = document.createElementNS(constant.nsHtml, 'div');
        pdDiv.classList.add('pk');
        columnStatusTd.appendChild(pdDiv);
        columnStatusTd.classList.add('status');
      } else if (column.fk) {
        const fkDiv = document.createElementNS(constant.nsHtml, 'div');
        fkDiv.classList.add('fk');
        columnStatusTd.appendChild(fkDiv);
        columnStatusTd.classList.add('status');
      }
      columnTr.appendChild(columnStatusTd);

      const columnNameTd = document.createElementNS(constant.nsHtml, 'td');
      columnNameTd.innerHTML = column.name;
      columnTr.appendChild(columnNameTd);

      const columnTypeTd = document.createElementNS(constant.nsHtml, 'td');
      if (column.fk) {
        columnTypeTd.innerHTML = column.fk.column.type;
      } else {
        columnTypeTd.innerHTML = column.type;
      }
      columnTr.appendChild(columnTypeTd);
    });
    this.clickEvents();
    this.moveEvents();

    if (this.posValue === 'center-viewport') {
      this.setTablePos(OUT_OF_VIEW_CORD, OUT_OF_VIEW_CORD, true);
      this.penddingCenter = true;
    } else {
      const point = this.posValue as IPoint;
      this.setTablePos(point.x, point.y);
    }

    // After render happened
    setTimeout(() => {
      let borderWidth = parseInt(getComputedStyle(this.table!).borderWidth!, 10);
      borderWidth = isNaN(borderWidth) ? 0 : borderWidth;
      this.foreignObject!.setAttributeNS(null, 'width', (this.table!.scrollWidth + borderWidth).toString());
      this.foreignObject!.setAttributeNS(null, 'height', (this.table!.scrollHeight + borderWidth).toString());
    });

    return this.elem;
  }

  public postDraw() {
    if (this.penddingCenter) {
      this.center();
    }
  }

  public setTablePos(x: number, y: number, disableOutOfBoundCheck = false) {
    if (!disableOutOfBoundCheck) {
      const result = this.notAllowOutOfBound(x, y);
      x = result.x;
      y = result.y;
    }
    this.posValue = {
      x, y,
    };
    this.foreignObject!.setAttributeNS(null, 'x', x.toString());
    this.foreignObject!.setAttributeNS(null, 'y', y.toString());
    if (this.onMove) this.onMove(this, x, y);
  }

  public data(): ITableData {
    return {
      height: this.table!.offsetHeight,
      name: this.nameValue,
      pos: this.posValue as IPoint,
      width: this.table!.offsetWidth,
    };
  }

  public setVeiwer(veiwer: Viewer) {
    this.veiwer = veiwer;
  }

  public highlightFrom(column: IColumn) {
    column.elem!.classList.add('fromRelation');
  }

  public removeHighlightFrom(column: IColumn) {
    column.elem!.classList.remove('fromRelation');
  }

  public highlightTo(column: IColumn) {
    column.elem!.classList.add('toRelation');
  }

  public removeHighlightTo(column: IColumn) {
    column.elem!.classList.remove('toRelation');
  }

  public disableMovement(value: boolean) {
    this.disableMovementValue = value;
  }

  private moveToTop() {
    const parentNode = this.elem!.parentNode;
    // The reason for not using append of this.elem instead of remaining element prepend
    // is to keep event concistency. The following code is for making click and and double click to work.
    Array.from(parentNode!.children).reverse().forEach((childElem) => {
      if (childElem !== this.elem) {
        parentNode!.prepend(childElem);
      }
    });
  }

  private clickEvents() {
    this.elem!.addEventListener('dblclick', () => {
      this.veiwer!.tableDblClick(this.data());
    });
    this.elem!.addEventListener('click', () => {
      this.veiwer!.tableClick(this.data());
    });
    this.elem!.addEventListener('contextmenu', () => {
      this.veiwer!.tableContextMenu(this.data());
    });
  }

  private notAllowOutOfBound(x: number, y: number) {
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + this.table!.offsetWidth > constant.VIEWER_PAN_WIDTH) {
      x = constant.VIEWER_PAN_WIDTH - this.table!.offsetWidth;
    }
    if (y + this.table!.offsetHeight > constant.VIEWER_PAN_HEIGHT) {
      y = constant.VIEWER_PAN_HEIGHT - this.table!.offsetHeight;
    }
    return {x, y};
  }

  private moveEvents() {
    let mouseDownInitialElemX: number;
    let mouseDownInitialElemY: number;

    const mouseMove = (event: MouseEvent) => {
      event.stopPropagation();
      const mousePos = this.veiwer!.getMousePosRelativeContainer(event);

      const normalizedClientX =
        mousePos.x / this.veiwer!.getZoom()! + this.veiwer!.getPan().x / this.veiwer!.getZoom()!;
      const normalizedClientY =
        mousePos.y / this.veiwer!.getZoom()! + this.veiwer!.getPan().y / this.veiwer!.getZoom()!;
      const x = normalizedClientX - mouseDownInitialElemX;
      const y = normalizedClientY - mouseDownInitialElemY;

      this.setTablePos(x, y);
      const pos = this.posValue as IPoint;
      if (this.onMove) this.onMove(this, pos.x, pos.y);
    };

    const mouseDown = (event: MouseEvent) => {
      event.stopPropagation();
      if ((event.button === 0 || event.button == null) && this.disableMovementValue === false) {
        this.table!.classList.add('move');
        const boundingRect = this.table!.getBoundingClientRect();
        mouseDownInitialElemX = (event.clientX - boundingRect.left) / this.veiwer!.getZoom()!;
        mouseDownInitialElemY = (event.clientY - boundingRect.top) / this.veiwer!.getZoom()!;

        this.initialClientX = event.clientX;
        this.initialClientY = event.clientY;

        document.addEventListener('mousemove', mouseMove as CommonEventListener);

        this.moveToTop();

        const mouseUp = (mouseUpEvent: MouseEvent) => {
          if (this.onMoveEnd
            && (this.initialClientX !== mouseUpEvent.clientX || this.initialClientY !== mouseUpEvent.clientY)) {
            this.onMoveEnd(this);
          }
          this.table!.classList.remove('move');
          document.removeEventListener('mouseup', mouseUp as CommonEventListener);
          document.removeEventListener('mousemove', mouseMove as CommonEventListener);
        };
        document.addEventListener('mouseup', mouseUp as CommonEventListener);
      }
    };

    this.elem!.addEventListener('mousedown', mouseDown as CommonEventListener);
    this.elem!.addEventListener('touchstart', mouseDown as CommonEventListener);
  }

  private center() {
    const viewport = this.veiwer!.getViewPort();
    const x = viewport.x + viewport.width / 2 - this.table!.offsetWidth / this.veiwer!.getZoom()! / 2;
    const y = viewport.y + viewport.height / 2 - this.table!.offsetHeight / this.veiwer!.getZoom()! / 2;
    this.setTablePos(x, y);
  }
}
