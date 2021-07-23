import TableData from "./table-data";
import { RelationData } from "../realtion/relation";
import { AnnotationSchema } from "./schema";

interface Callbacks {
  tableDblClick: (tableData: TableData) => void;
  tableClick: (tableData: TableData) => void;
  tableContextMenu: (tableData: TableData) => void;
  tableMove: (tableData: TableData) => void;
  annotationMove: (annotationData: AnnotationSchema) => void;
  tableMoveEnd: (tableData: TableData) => void;
  zoomIn: (zoom: number) => void;
  zoomOut: (zoom: number) => void;
  viewportClick: (x: number, y: number) => void;
  relationClick: (relationData: RelationData) => void;
  relationDblClick: (relationData: RelationData) => void;
  relationContextMenu: (relationData: RelationData) => void;
}

export default Callbacks;
