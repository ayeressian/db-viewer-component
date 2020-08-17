import TableData from "./TableData";
import { RelationData } from "../realtion/Relation";

export default interface Callbacks {
  tableDblClick: (tableData: TableData) => void;
  tableClick: (tableData: TableData) => void;
  tableContextMenu: (tableData: TableData) => void;
  tableMove: (tableData: TableData) => void;
  tableMoveEnd: (tableData: TableData) => void;
  zoomIn: (zoom: number) => void;
  zoomOut: (zoom: number) => void;
  viewportClick: (x: number, y: number) => void;
  relationClick: (relationData: RelationData) => void;
  relationDblClick: (relationData: RelationData) => void;
  relationContextMenu: (relationData: RelationData) => void;
  // eslint-disable-next-line semi
}
