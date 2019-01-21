import constant from './const.js';
import {
  to3FixedNumber
} from './mathUtil.js';

const OUT_OF_VIEW_CORD = -1000;

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
      this._veiwer.tableDblClick(this.formatData());
    });
    this._elem.addEventListener('click', () => {
      this._veiwer.tableClick(this.formatData());
    });
    this._elem.addEventListener('contextmenu', () => {
      this._veiwer.tableContextMenu(this.formatData());
    });
  }

  _moveEvents() {
    let mouseDownInitialElemX;
    let mouseDownInitialElemY;

    const mouseMove = (event) => {
      event.stopPropagation();
      const mousePos = this._veiwer.getMousePosRelativeContainer(event);

      const normalizedClientX = mousePos.x / this._veiwer.getZoom() + this._veiwer.getPan().x / this._veiwer.getZoom();
      const normalizedClientY = mousePos.y / this._veiwer.getZoom() + this._veiwer.getPan().y / this._veiwer.getZoom();
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
      if (event.button === 0) {
        event.stopPropagation();
        this._table.classList.add('move');
        const boundingRect = this._table.getBoundingClientRect();
        mouseDownInitialElemX = (event.clientX - boundingRect.left) / this._veiwer.getZoom();
        mouseDownInitialElemY = (event.clientY - boundingRect.top) / this._veiwer.getZoom();

        document.addEventListener('mousemove', mouseMove);

        this._moveToTop();
      }
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
    return to3FixedNumber(num / this._veiwer.getZoom() + this._veiwer.getPan().x);
  }

  _normalizeY(num) {
    return to3FixedNumber(num / this._veiwer.getZoom() + this._veiwer.getPan().y);
  }

  getCenter() {
    const veiwerCords = this._veiwer.getCords();
    const boundingRect = this._table.getBoundingClientRect();

    const x = this._normalizeX(boundingRect.left - veiwerCords.x) + to3FixedNumber(boundingRect.width / this._veiwer.getZoom()) / 2;
    const y = this._normalizeY(boundingRect.top - veiwerCords.y) + to3FixedNumber(boundingRect.height / this._veiwer.getZoom()) / 2;
    return {
      x,
      y,
    };
  }

  getSides() {
    const veiwerCords = this._veiwer.getCords();
    const boundingRect = this._table.getBoundingClientRect();
    return {
      right: {
        p1: {
          x: this._normalizeX(boundingRect.right - veiwerCords.x),
          y: this._normalizeY(boundingRect.top - veiwerCords.y),
        },
        p2: {
          x: this._normalizeX(boundingRect.right - veiwerCords.x),
          y: this._normalizeY(boundingRect.bottom - veiwerCords.y),
        },
      },
      left: {
        p1: {
          x: this._normalizeX(boundingRect.left - veiwerCords.x),
          y: this._normalizeY(boundingRect.top - veiwerCords.y),
        },
        p2: {
          x: this._normalizeX(boundingRect.left - veiwerCords.x),
          y: this._normalizeY(boundingRect.bottom - veiwerCords.y),
        },
      },
      top: {
        p1: {
          x: this._normalizeX(boundingRect.left - veiwerCords.x),
          y: this._normalizeY(boundingRect.top - veiwerCords.y),
        },
        p2: {
          x: this._normalizeX(boundingRect.right - veiwerCords.x),
          y: this._normalizeY(boundingRect.top - veiwerCords.y),
        },
      },
      bottom: {
        p1: {
          x: this._normalizeX(boundingRect.left - veiwerCords.x),
          y: this._normalizeY(boundingRect.bottom - veiwerCords.y),
        },
        p2: {
          x: this._normalizeX(boundingRect.right - veiwerCords.x),
          y: this._normalizeY(boundingRect.bottom - veiwerCords.y),
        },
      },
    };
  }

  render() {
    this._elem = document.createElementNS(constant.nsSvg, 'foreignObject');

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

    if (this._pos === 'center') {
      this._elem.setAttributeNS(null, 'x', OUT_OF_VIEW_CORD);
      this._elem.setAttributeNS(null, 'y', OUT_OF_VIEW_CORD);

      setTimeout(this._center.bind(this));
    } else {
      // TODO: change to transform when chrome new versions star have resolved the issue.
      // this._elem.setAttributeNS(null, 'transform', `translate(${this._pos.x},${this._pos.y})`);
      this._elem.setAttributeNS(null, 'x', this._pos.x);
      this._elem.setAttributeNS(null, 'y', this._pos.y);
    }

    return this._elem;
  }

  _center() {
    const boundingRect = this._elem.getBoundingClientRect();
    const viewPort = this._veiwer.getViewPort();
    this._pos = {
      x: (viewPort.x + viewPort.width) / 2 - boundingRect.width / 2,
      y: (viewPort.y + viewPort.height) / 2 - boundingRect.height / 2
    };
    this._elem.setAttributeNS(null, 'x', this._pos.x);
    this._elem.setAttributeNS(null, 'y', this._pos.y);
  }

  formatData() {
    const boundingRect = this._table.getBoundingClientRect();
    return {
      name: this._name,
      pos: this._pos,
      width: boundingRect.width,
      height: boundingRect.height
    };
  }

  setVeiwer(veiwer) {
    this._veiwer = veiwer;
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
