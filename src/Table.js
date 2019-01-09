import constant from './const.js';
import {
  to3FixedNumber
} from './mathUtil.js';

export default class Table {
  constructor({
    name,
    columns = [],
    pos = {
      x: 0,
      y: 0
    }
  }) {
    this.columns = columns;
    this._name = name;
    this._pos = pos;
  }

  get pos() {
    return this._pos;
  }

  get name() {
    return this._name;
  }

  _moveToTop() {
    const parentNode = this._elem.parentNode;
    // The reason for not using append of this._elem instead of remaining element prepend
    // is to keep event concistency. The following code is for making click and and double click to work.
    Array.from(parentNode.children).reverse().forEach((childElem) => {
      if (childElem !== this._elem) {
        parentNode.prepend(childElem);
      }
    });
  }

  _clickEvents() {
    this._elem.addEventListener('dblclick', () => {
      this._designer.tableDblClick(Table.tableDataCreator(this));
    });
    this._elem.addEventListener('click', () => {
      this._designer.tableClick(Table.tableDataCreator(this));
    });
  }

  _moveEvents() {
    let mouseDownInitialElemX;
    let mouseDownInitialElemY;

    const mouseMove = (event) => {
      event.stopPropagation();
      const mousePos = this._designer.getMousePosRelativeContainer(event);

      const normalizedClientX = mousePos.x / this._designer.getZoom() + this._designer.getPan().x / this._designer.getZoom();
      const normalizedClientY = mousePos.y / this._designer.getZoom() + this._designer.getPan().y / this._designer.getZoom();
      const deltaX = normalizedClientX - mouseDownInitialElemX;
      const deltaY = normalizedClientY - mouseDownInitialElemY;
      // TODO: change to transform when chrome new versions star have resolved the issue.
      // this._elem.setAttributeNS(null, 'transform', `translate(${deltaX},${deltaY})`);
      this._elem.setAttributeNS(null, 'x', deltaX);
      this._elem.setAttributeNS(null, 'y', deltaY);
      this._pos.x = deltaX;
      this._pos.y = deltaY;
      this._onMove && this._onMove(this, deltaX, deltaY);
    };

    this._elem.addEventListener('mousedown', (event) => {
      event.stopPropagation();
      this._table.classList.add('move');
      const boundingRect = this._table.getBoundingClientRect();
      mouseDownInitialElemX = (event.clientX - boundingRect.left) / this._designer.getZoom();
      mouseDownInitialElemY = (event.clientY - boundingRect.top) / this._designer.getZoom();

      document.addEventListener('mousemove', mouseMove);

      this._moveToTop();
    });
    document.addEventListener('mouseup', () => {
      this._table.classList.remove('move');
      document.removeEventListener('mousemove', mouseMove);
    });
  }

  setName(name) {
    this._name = name;
  }

  getName() {
    return this._name;
  }

  addColumn(column) {
    this.columns.push(column);
  }

  setMoveListener(onMove) {
    this._onMove = onMove;
  }

  _normalizeX(num) {
    return to3FixedNumber(num / this._designer.getZoom() + this._designer.getPan().x);
  }

  _normalizeY(num) {
    return to3FixedNumber(num / this._designer.getZoom() + this._designer.getPan().y);
  }

  getCenter() {
    const designerCords = this._designer.getCords();
    const boundingRect = this._table.getBoundingClientRect();

    const x = this._normalizeX(boundingRect.left - designerCords.x) + to3FixedNumber(boundingRect.width / this._designer.getZoom()) / 2;
    const y = this._normalizeY(boundingRect.top - designerCords.y) + to3FixedNumber(boundingRect.height / this._designer.getZoom()) / 2;
    return {
      x,
      y,
    };
  }

  getSides() {
    const designerCords = this._designer.getCords();
    const boundingRect = this._table.getBoundingClientRect();
    return {
      right: {
        p1: {
          x: this._normalizeX(boundingRect.right - designerCords.x),
          y: this._normalizeY(boundingRect.top - designerCords.y),
        },
        p2: {
          x: this._normalizeX(boundingRect.right - designerCords.x),
          y: this._normalizeY(boundingRect.bottom - designerCords.y),
        },
      },
      left: {
        p1: {
          x: this._normalizeX(boundingRect.left - designerCords.x),
          y: this._normalizeY(boundingRect.top - designerCords.y),
        },
        p2: {
          x: this._normalizeX(boundingRect.left - designerCords.x),
          y: this._normalizeY(boundingRect.bottom - designerCords.y),
        },
      },
      top: {
        p1: {
          x: this._normalizeX(boundingRect.left - designerCords.x),
          y: this._normalizeY(boundingRect.top - designerCords.y),
        },
        p2: {
          x: this._normalizeX(boundingRect.right - designerCords.x),
          y: this._normalizeY(boundingRect.top - designerCords.y),
        },
      },
      bottom: {
        p1: {
          x: this._normalizeX(boundingRect.left - designerCords.x),
          y: this._normalizeY(boundingRect.bottom - designerCords.y),
        },
        p2: {
          x: this._normalizeX(boundingRect.right - designerCords.x),
          y: this._normalizeY(boundingRect.bottom - designerCords.y),
        },
      },
    };
  }

  render() {
    this._elem = document.createElementNS(constant.nsSvg, 'foreignObject');
    // TODO: change to transform when chrome new versions star have resolved the issue.
    // this._elem.setAttributeNS(null, 'transform', `translate(${this._pos.x},${this._pos.y})`);
    this._elem.setAttributeNS(null, 'x', this._pos.x);
    this._elem.setAttributeNS(null, 'y', this._pos.y);

    setTimeout(() => {
      let borderWidth = parseInt(getComputedStyle(this._table).borderWidth, 10);
      borderWidth = isNaN(borderWidth)? 0: borderWidth;
      this._elem.setAttributeNS(null, 'width', this._table.scrollWidth + borderWidth);
      this._elem.setAttributeNS(null, 'height', this._table.scrollHeight + borderWidth);
    });

    this._table = document.createElementNS(constant.nsHtml, 'table');
    this._table.className = 'table';
    const headingTr = document.createElementNS(constant.nsHtml, 'tr');
    this._table.appendChild(headingTr);
    const headingTh = document.createElementNS(constant.nsHtml, 'th');
    headingTh.setAttributeNS(null, 'colspan', 2);
    headingTh.innerHTML = this._name;
    headingTr.appendChild(headingTh);

    this._elem.appendChild(this._table);

    this.columns.forEach((column) => {
      const columnTr = document.createElementNS(constant.nsHtml, 'tr');
      column.elem = columnTr;
      this._table.appendChild(columnTr);

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
    this._clickEvents();
    this._moveEvents();

    return this._elem;
  }

  static tableDataCreator(table) {
    return {
      name: table._name,
      pos: table._pos
    };
  }

  setDesigner(designer) {
    this._designer = designer;
  }

  getElement() {
    return this._elem;
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
}
