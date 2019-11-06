import constant from './const.js';
import {
  to3FixedNumber
} from './mathUtil';
import Viewer from './Viewer';
import { Point } from './Point.js';

const OUT_OF_VIEW_CORD = -1000;

interface OnMove {
  (table: Table, x: number, y: number): void;
}

interface OnMoveEnd {
  (Table): void;
}

export default class Table {
  private columns;
  private nameValue: string;
  private posValue;
  private disableMovementValue: boolean;
  private elem: SVGGraphicsElement;
  private veiwer: Viewer;
  private table: HTMLElement;
  private onMove: OnMove;
  private initialClientX: number;
  private initialClientY: number;
  private onMoveEnd: OnMoveEnd;
  private foreignObject: Element;
  private penddingCenter: boolean;

  constructor({
    name,
    columns = [],
    pos = {
      x: 0,
      y: 0
    }
  }) {
    this.columns = columns;
    this.nameValue = name;
    this.posValue = pos;

    this.disableMovementValue = false;
  }

  get pos() {
    return this.posValue;
  }

  get name() {
    return this.nameValue;
  }

  private moveToTop() {
    const parentNode = this.elem.parentNode;
    // The reason for not using append of this.elem instead of remaining element prepend
    // is to keep event concistency. The following code is for making click and and double click to work.
    Array.from(parentNode.children).reverse().forEach((childElem) => {
      if (childElem !== this.elem) {
        parentNode.prepend(childElem);
      }
    });
  }

  private clickEvents() {
    this.elem.addEventListener('dblclick', () => {
      this.veiwer.tableDblClick(this.data());
    });
    this.elem.addEventListener('click', () => {
      this.veiwer.tableClick(this.data());
    });
    this.elem.addEventListener('contextmenu', () => {
      this.veiwer.tableContextMenu(this.data());
    });
  }

  private notAllowOutOfBound(x: number, y: number) {
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + this.table.offsetWidth > constant.VIEWER_PAN_WIDTH) {
      x = constant.VIEWER_PAN_WIDTH - this.table.offsetWidth;
    }
    if (y + this.table.offsetHeight > constant.VIEWER_PAN_HEIGHT) {
      y = constant.VIEWER_PAN_HEIGHT - this.table.offsetHeight;
    }
    return {x, y};
  }

  private moveEvents() {
    let mouseDownInitialElemX;
    let mouseDownInitialElemY;

    const mouseMove = (event: MouseEvent) => {
      event.stopPropagation();
      const mousePos = this.veiwer.getMousePosRelativeContainer(event);

      const normalizedClientX = mousePos.x / this.veiwer.getZoom() + this.veiwer.getPan().x / this.veiwer.getZoom();
      const normalizedClientY = mousePos.y / this.veiwer.getZoom() + this.veiwer.getPan().y / this.veiwer.getZoom();
      const x = normalizedClientX - mouseDownInitialElemX;
      const y = normalizedClientY - mouseDownInitialElemY;

      this.setTablePos(x, y);
      this.onMove && this.onMove(this, this.posValue.x, this.posValue.y);
    };

    const mouseDown = (event: MouseEvent) => {
      event.stopPropagation();
      if ((event.button === 0 || event.button == null) && this.disableMovementValue === false) {
        this.table.classList.add('move');
        const boundingRect = this.table.getBoundingClientRect();
        mouseDownInitialElemX = (event.clientX - boundingRect.left) / this.veiwer.getZoom();
        mouseDownInitialElemY = (event.clientY - boundingRect.top) / this.veiwer.getZoom();

        this.initialClientX = event.clientX;
        this.initialClientY = event.clientY;

        document.addEventListener('mousemove', mouseMove);

        this.moveToTop();

        const mouseUp = (event: MouseEvent) => {
          if (this.initialClientX !== event.clientX || this.initialClientY !== event.clientY) {
            this.onMoveEnd && this.onMoveEnd(this);
          }
          this.table.classList.remove('move');
          document.removeEventListener('mouseup', mouseUp);
          document.removeEventListener('mousemove', mouseMove);
        };
        document.addEventListener('mouseup', mouseUp);
      }
    };

    this.elem.addEventListener('mousedown', mouseDown);
    this.elem.addEventListener('touchstart', mouseDown);
  }

  setName(name: string) {
    this.nameValue = name;
  }

  getName() {
    return this.nameValue;
  }

  addColumn(column) {
    this.columns.push(column);
  }

  setMoveListener(onMove: OnMove) {
    this.onMove = onMove;
  }

  setMoveEndListener(onMoveEnd: OnMoveEnd) {
    this.onMoveEnd = onMoveEnd;
  }

  private normalizeX(num: number): number {
    return to3FixedNumber(num / this.veiwer.getZoom() + this.veiwer.getPan().x);
  }

  private normalizeY(num: number): number {
    return to3FixedNumber(num / this.veiwer.getZoom() + this.veiwer.getPan().y);
  }

  getCenter(): Point {
    const bbox = this.elem.getBBox();

    const x = bbox.x + this.table.offsetWidth / 2;
    const y = bbox.y + this.table.offsetHeight / 2;
    return {
      x,
      y,
    };
  }

  getSides() {
    const bbox = this.elem.getBBox();

    return {
      right: {
        p1: {
          x: bbox.x + this.table.offsetWidth,
          y: bbox.y,
        },
        p2: {
          x: bbox.x + this.table.offsetWidth,
          y: bbox.y + this.table.offsetHeight,
        },
      },
      left: {
        p1: {
          x: bbox.x,
          y: bbox.y,
        },
        p2: {
          x: bbox.x,
          y: bbox.y + this.table.offsetHeight,
        },
      },
      top: {
        p1: {
          x: bbox.x,
          y: bbox.y,
        },
        p2: {
          x: bbox.x + this.table.offsetWidth,
          y: bbox.y,
        },
      },
      bottom: {
        p1: {
          x: bbox.x,
          y: bbox.y + this.table.offsetHeight,
        },
        p2: {
          x: bbox.x + this.table.offsetWidth,
          y: bbox.y + this.table.offsetHeight,
        },
      },
    };
  }

  render() {
    this.elem = <SVGGraphicsElement> document.createElementNS(constant.nsSvg, 'g');
    this.foreignObject = document.createElementNS(constant.nsSvg, 'foreignObject');
    this.elem.appendChild(this.foreignObject);

    this.table = <HTMLElement> document.createElementNS(constant.nsHtml, 'table');
    this.table.className = 'table';
    const headingTr = document.createElementNS(constant.nsHtml, 'tr');
    this.table.appendChild(headingTr);
    const headingTh = document.createElementNS(constant.nsHtml, 'th');
    headingTh.setAttributeNS(null, 'colspan', 3 + '');
    headingTh.innerHTML = this.nameValue;
    headingTr.appendChild(headingTh);

    this.foreignObject.appendChild(this.table);

    this.columns.forEach((column) => {
      const columnTr = document.createElementNS(constant.nsHtml, 'tr');
      column.elem = columnTr;
      this.table.appendChild(columnTr);

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
      this.setTablePos(this.posValue.x, this.posValue.y);
    }

    // After render happened
    setTimeout(() => {
      let borderWidth = parseInt(getComputedStyle(this.table).borderWidth, 10);
      borderWidth = isNaN(borderWidth)? 0: borderWidth;
      this.foreignObject.setAttributeNS(null, 'width', (this.table.scrollWidth + borderWidth).toString());
      this.foreignObject.setAttributeNS(null, 'height', (this.table.scrollHeight + borderWidth).toString());
    });

    return this.elem;
  }

  postDraw() {
    if (this.penddingCenter) {
      this.center();
    }
  }

  setTablePos(x: number, y: number, disableOutOfBoundCheck = false) {
    if (!disableOutOfBoundCheck) {
      const result = this.notAllowOutOfBound(x, y);
      x = result.x;
      y = result.y;
    }
    this.posValue = {
      x, y
    };
    this.foreignObject.setAttributeNS(null, 'x', x.toString());
    this.foreignObject.setAttributeNS(null, 'y', y.toString());
    this.onMove && this.onMove(this, x, y);
  }

  private center() {
    const viewport = this.veiwer.getViewPort();
    const x = viewport.x + viewport.width / 2 - this.table.offsetWidth / this.veiwer.getZoom() / 2;
    const y = viewport.y + viewport.height / 2 - this.table.offsetHeight / this.veiwer.getZoom() / 2;
    this.setTablePos(x, y);
  }

  data() {
    return {
      name: this.nameValue,
      pos: this.posValue,
      width: this.table.offsetWidth,
      height: this.table.offsetHeight
    };
  }

  setVeiwer(veiwer: Viewer) {
    this.veiwer = veiwer;
  }

  highlightFrom(column) {
    column.elem.classList.add('fromRelation');
  }

  removeHighlightFrom(column) {
    column.elem.classList.remove('fromRelation');
  }

  highlightTo(column) {
    column.elem.classList.add('toRelation');
  }

  removeHighlightTo(column) {
    column.elem.classList.remove('toRelation');
  }

  disableMovement(value: boolean) {
    this.disableMovementValue = value;
  }
}
