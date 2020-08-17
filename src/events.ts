import Point from "./types/Point";
import TableData from "./types/TableData";
import { RelationData } from "./realtion/Relation";

export class ViewportClickEvent extends CustomEvent<Point> {
  constructor(point: Point) {
    super("viewportClick", { detail: point });
  }
}

export class TableClickEvent extends CustomEvent<TableData> {
  constructor(tableData: TableData) {
    super("tableClick", { detail: tableData });
  }
}

export class TableDblClickEvent extends CustomEvent<TableData> {
  constructor(tableData: TableData) {
    super("tableDblClick", { detail: tableData });
  }
}

export class TableContextMenuEvent extends CustomEvent<TableData> {
  constructor(tableData: TableData) {
    super("tableContextMenu", { detail: tableData });
  }
}

export class TableMoveEvent extends CustomEvent<TableData> {
  constructor(tableData: TableData) {
    super("tableMove", { detail: tableData });
  }
}

export class TableMoveEndEvent extends CustomEvent<TableData> {
  constructor(tableData: TableData) {
    super("tableMoveEnd", { detail: tableData });
  }
}

export class RelationClickEvent extends CustomEvent<RelationData> {
  constructor(tableData: RelationData) {
    super("relationClick", { detail: tableData });
  }
}

export class RelationDblClickEvent extends CustomEvent<RelationData> {
  constructor(tableData: RelationData) {
    super("relationDblClick", { detail: tableData });
  }
}

export class RelationContextMenuEvent extends CustomEvent<RelationData> {
  constructor(tableData: RelationData) {
    super("relationContextMenu", { detail: tableData });
  }
}

export class ZoomInEvent extends CustomEvent<{ zoom: number }> {
  constructor(zoom: number) {
    super("zoomIn", {
      detail: {
        zoom,
      },
    });
  }
}

export class ZoomOutEvent extends CustomEvent<{ zoom: number }> {
  constructor(zoom: number) {
    super("zoomOut", {
      detail: {
        zoom,
      },
    });
  }
}

export class LoadEvent extends CustomEvent<void> {
  constructor() {
    super("load");
  }
}

export class ReadyEvent extends CustomEvent<void> {
  constructor() {
    super("ready");
  }
}

export interface DbViewerEventMap extends HTMLElementEventMap {
  ready: ReadyEvent;
  load: LoadEvent;
  viewportClick: ViewportClickEvent;
  tableClick: TableClickEvent;
  tableDblClick: TableDblClickEvent;
  tableContextMenu: TableContextMenuEvent;
  relationClick: RelationClickEvent;
  relationDblClick: RelationDblClickEvent;
  relationContextMenu: RelationContextMenuEvent;
  tableMove: TableMoveEvent;
  tableMoveEnd: TableMoveEndEvent;
  zoomIn: ZoomInEvent;
  zoomOut: ZoomOutEvent;
}
