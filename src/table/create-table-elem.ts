import constant from "../const";
import gWithFo from "../create-g-with-fo";
import { Column, ColumnFk, isColumnFk } from "../types/column";

function createTable(): HTMLTableElement {
  const table = document.createElementNS(
    constant.nsHtml,
    "table"
  ) as HTMLTableElement;
  table.className = "table";
  return table;
}

function createTableHead(name: string): HTMLTableHeaderCellElement {
  const thead = document.createElementNS(
    constant.nsHtml,
    "thead"
  ) as HTMLTableHeaderCellElement;
  const headingTr = document.createElementNS(constant.nsHtml, "tr");
  const headingTh = document.createElementNS(constant.nsHtml, "th");
  headingTh.setAttributeNS(null, "colspan", `${3}`);
  headingTh.innerHTML = name;
  headingTr.appendChild(headingTh);
  thead.appendChild(headingTr);
  return thead;
}

function createTr(column: Column): HTMLTableRowElement {
  const columnTr = document.createElementNS(
    constant.nsHtml,
    "tr"
  ) as HTMLTableRowElement;
  column.elem = columnTr;
  return columnTr;
}

function addPkStatus(columnStatusTd: HTMLTableDataCellElement) {
  const pdDiv = document.createElementNS(constant.nsHtml, "div");
  pdDiv.classList.add("pk");
  columnStatusTd.appendChild(pdDiv);
  columnStatusTd.classList.add("status");
}

function addFkStatus(columnStatusTd: HTMLTableDataCellElement) {
  const fkDiv = document.createElementNS(constant.nsHtml, "div");
  fkDiv.classList.add("fk");
  columnStatusTd.appendChild(fkDiv);
  columnStatusTd.classList.add("status");
}

function addColumnTypeTd(column: Column, columnTr: HTMLTableRowElement) {
  const columnTypeTd = document.createElementNS(constant.nsHtml, "td");
  if (isColumnFk(column)) {
    columnTypeTd.innerHTML = column.fk!.column.type;
  } else {
    columnTypeTd.innerHTML = column.type;
  }
  columnTr.appendChild(columnTypeTd);
}

function addStatusTd(column: Column, columnTr: HTMLTableRowElement) {
  const columnStatusTd = document.createElementNS(
    constant.nsHtml,
    "td"
  ) as HTMLTableDataCellElement;
  if (column.pk) {
    addPkStatus(columnStatusTd);
  } else if ((column as ColumnFk).fk) {
    addFkStatus(columnStatusTd);
  }
  columnTr.appendChild(columnStatusTd);
}

function addNameTd(name: string, columnTr: HTMLTableRowElement) {
  const columnNameTd = document.createElementNS(constant.nsHtml, "td");
  columnNameTd.innerHTML = name;
  columnTr.appendChild(columnNameTd);
}

function createColumns(tbody: Element, columns: Column[]): void {
  columns.forEach((column) => {
    const columnTr = createTr(column);

    addStatusTd(column, columnTr);
    addNameTd(column.name, columnTr);
    addColumnTypeTd(column, columnTr);

    tbody.appendChild(columnTr);
  });
}

export function createTableElem(
  name: string,
  columns: Column[]
): {
  table: HTMLTableElement;
  g: SVGGElement;
  foreignObject: SVGForeignObjectElement;
} {
  const { g, foreignObject } = gWithFo();
  g.classList.add("table");
  const table = createTable();
  const thead = createTableHead(name);

  table.appendChild(thead);

  foreignObject.appendChild(table);

  const tbody = document.createElementNS(constant.nsHtml, "tbody");

  createColumns(tbody, columns);
  table.appendChild(tbody);

  return { table, g, foreignObject };
}
