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
    this._browserZoom = 1;

    this._disableMovement = false;
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
      this._veiwer.tableDblClick(this.data());
    });
    this._elem.addEventListener('click', () => {
      this._veiwer.tableClick(this.data());
    });
    this._elem.addEventListener('contextmenu', () => {
      this._veiwer.tableContextMenu(this.data());
    });
  }

  _notAllowOutOfBound(x, y) {
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + this._table.offsetWidth > constant.VIEWER_PAN_WIDTH) {
      x = constant.VIEWER_PAN_WIDTH - this._table.offsetWidth;
    }
    if (y + this._table.offsetHeight > constant.VIEWER_PAN_HEIGHT) {
      y = constant.VIEWER_PAN_HEIGHT - this._table.offsetHeight;
    }
    return {x, y};
  }

  _moveEvents() {
    let mouseDownInitialElemX;
    let mouseDownInitialElemY;

    const mouseMove = (event) => {
      event.stopPropagation();
      const mousePos = this._veiwer.getMousePosRelativeContainer(event);

      const normalizedClientX = mousePos.x / this._veiwer.getZoom() + this._veiwer.getPan().x / this._veiwer.getZoom();
      const normalizedClientY = mousePos.y / this._veiwer.getZoom() + this._veiwer.getPan().y / this._veiwer.getZoom();
      const x = normalizedClientX - mouseDownInitialElemX;
      const y = normalizedClientY - mouseDownInitialElemY;

      this.setTablePos(x, y);
      this._onMove && this._onMove(this, this._pos.x, this._pos.y);
    };

    const mouseDown = (event) => {
      event.stopPropagation();
      if ((event.button === 0 || event.button == null) && this._disableMovement === false) {
        this._table.classList.add('move');
        const boundingRect = this._table.getBoundingClientRect();
        mouseDownInitialElemX = (event.clientX - boundingRect.left) / this._veiwer.getZoom();
        mouseDownInitialElemY = (event.clientY - boundingRect.top) / this._veiwer.getZoom();

        this._initialClientX = event.clientX;
        this._initialClientY = event.clientY;

        document.addEventListener('mousemove', mouseMove);

        this._moveToTop();

        const mouseUp = (event) => {
          if (this._initialClientX !== event.clientX || this._initialClientY !== event.clientY) {
            this._onMoveEnd && this._onMoveEnd(this);
          }
          this._table.classList.remove('move');
          document.removeEventListener('mouseup', mouseUp);
          document.removeEventListener('mousemove', mouseMove);
        };
        document.addEventListener('mouseup', mouseUp);
      }
    };

    this._elem.addEventListener('mousedown', mouseDown);
    this._elem.addEventListener('touchstart', mouseDown);
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

  setMoveEndListener(onMoveEnd) {
    this._onMoveEnd = onMoveEnd;
  }

  _normalizeX(num) {
    return to3FixedNumber(num / this._veiwer.getZoom() + this._veiwer.getPan().x);
  }

  _normalizeY(num) {
    return to3FixedNumber(num / this._veiwer.getZoom() + this._veiwer.getPan().y);
  }

  getCenter() {
    const bbox = this._elem.getBBox();

    const x = bbox.x + this._table.offsetWidth / 2;
    const y = bbox.y + this._table.offsetHeight / 2;
    return {
      x,
      y,
    };
  }

  getSides() {
    const bbox = this._table.getBBox();

    return {
      right: {
        p1: {
          x: this._pos.x + bbox.width,
          y: this._pos.y,
        },
        p2: {
          x: this._pos.x + bbox.width,
          y: this._pos.y + bbox.height,
        },
      },
      left: {
        p1: {
          x: this._pos.x,
          y: this._pos.y,
        },
        p2: {
          x: this._pos.x,
          y: this._pos.y + bbox.height,
        },
      },
      top: {
        p1: {
          x: this._pos.x,
          y: this._pos.y,
        },
        p2: {
          x: this._pos.x + bbox.width,
          y: this._pos.y,
        },
      },
      bottom: {
        p1: {
          x: this._pos.x,
          y: this._pos.y + bbox.height,
        },
        p2: {
          x: this._pos.x + bbox.width,
          y: this._pos.y + bbox.height,
        },
      },
    };
  }

  _getLine(x1, y1, x2, y2) {
    const line = document.createElementNS(constant.nsSvg, 'line');
    line.setAttributeNS(null, 'x1', x1);
    line.setAttributeNS(null, 'x2', x2);
    line.setAttributeNS(null, 'y1', y1);
    line.setAttributeNS(null, 'y2', y2);
    return line;
  }

  _getText(x, y, text, className) {
    const textRlem = document.createElementNS(constant.nsSvg, 'text');
    textRlem.setAttributeNS(null, 'x', x);
    textRlem.setAttributeNS(null, 'y', y);
    if (className) textRlem.classList.add(className);
    textRlem.innerHTML = text;
    return textRlem;
  }

  _getTableWidth() {
    return [...this.columns, this].reduce((length, column) => {
      const columnLength = column.name.length;
      if (columnLength > length) return columnLength;
      return length;
    }, -1);
  }

  _getTableHeight() {
    return this.columns.length + 1;
  }

  render() {
    this._elem = document.createElementNS(constant.nsSvg, 'g');
    this._table = document.createElementNS(constant.nsSvg, 'rect');
    const tableWidth = `${this._getTableWidth()}em`;
    this._table.setAttributeNS(null, 'width', tableWidth);
    const rowHeight = 1.8;
    this._table.setAttributeNS(null, 'height', `${this._getTableHeight() * rowHeight}em`);
    this._elem.appendChild(this._table);
    const rowHeightInEm = `${rowHeight}em`;
    const headingLine = this._getLine(0, rowHeightInEm, tableWidth, rowHeightInEm);
    this._elem.appendChild(headingLine);
    const TEXT_PADDING_LEFT = 5;
    const headingText = this._getText(TEXT_PADDING_LEFT, `${rowHeight - 0.7}em`, this._name, 'heading');
    this._elem.appendChild(headingText);

    this.columns.forEach((column, index) => {
      if (index === this.columns.length) return;
      const y = `${rowHeight * (index + 1)}em`;
      const rowSeperator = this._getLine(0, y, tableWidth, y);
      this._elem.appendChild(rowSeperator);
      const textY = `${(rowHeight * (index + 2)) - 0.5}em`;
      const textElem = this._getText(TEXT_PADDING_LEFT, textY, column.name);
      this._elem.appendChild(textElem);
    });

    // this.columns.forEach((column) => {
    //   const columnTr = document.createElementNS(constant.nsHtml, 'tr');
    //   column.elem = columnTr;
    //   this._table.appendChild(columnTr);

    //   const columnStatusTd = document.createElementNS(constant.nsHtml, 'td');
    //   if (column.pk) {
    //     const pdDiv = document.createElementNS(constant.nsHtml, 'div');
    //     pdDiv.classList.add('pk');
    //     columnStatusTd.appendChild(pdDiv);
    //     columnStatusTd.classList.add('status');
    //   } else if (column.fk) {
    //     const fkDiv = document.createElementNS(constant.nsHtml, 'div');
    //     fkDiv.classList.add('fk');
    //     columnStatusTd.appendChild(fkDiv);
    //     columnStatusTd.classList.add('status');
    //   }
    //   columnTr.appendChild(columnStatusTd);

    //   const columnNameTd = document.createElementNS(constant.nsHtml, 'td');
    //   columnNameTd.innerHTML = column.name;
    //   columnTr.appendChild(columnNameTd);

    //   const columnTypeTd = document.createElementNS(constant.nsHtml, 'td');
    //   if (column.fk) {
    //     columnTypeTd.innerHTML = column.fk.column.type;
    //   } else {
    //     columnTypeTd.innerHTML = column.type;
    //   }
    //   columnTr.appendChild(columnTypeTd);
    // });
    this._clickEvents();
    this._moveEvents();

    if (this._pos === 'center-viewport') {
      this.setTablePos(OUT_OF_VIEW_CORD, OUT_OF_VIEW_CORD, true);
      this._penddingCenter = true;
    } else {
      this.setTablePos(this._pos.x, this._pos.y);
    }

    // After render happened
    // setTimeout(() => {
      // let borderWidth = parseInt(getComputedStyle(this._table).borderWidth, 10);
      // borderWidth = isNaN(borderWidth)? 0: borderWidth;
      // this._fo.setAttributeNS(null, 'width', this._table.scrollWidth + borderWidth);
      // this._fo.setAttributeNS(null, 'height', this._table.scrollHeight + borderWidth);
    // });
    return this._elem;
  }

  postDraw() {
    if (this._penddingCenter) {
      this._center();
    }
  }

  setTablePos(x, y, disableOutOfBoundCheck) {
    if (!disableOutOfBoundCheck) {
      const result = this._notAllowOutOfBound(x, y);
      x = result.x;
      y = result.y;
    }
    this._pos = {
      x, y
    };
    this._elem.setAttributeNS(null, 'transform', `translate(${x}, ${y})`);
    this._onMove && this._onMove(this, x, y);
  }

  _center() {
    const viewport = this._veiwer.getViewPort();
    const x = viewport.x + viewport.width / 2 - this._table.offsetWidth / this._veiwer.getZoom() / 2;
    const y = viewport.y + viewport.height / 2 - this._table.offsetHeight / this._veiwer.getZoom() / 2;
    this.setTablePos(x, y);
  }

  data() {
    return {
      name: this._name,
      pos: this._pos,
      width: this._table.offsetWidth,
      height: this._table.offsetHeight
    };
  }

  setVeiwer(veiwer) {
    this._veiwer = veiwer;
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

  disableMovement(value) {
    this._disableMovement = value;
  }
}
