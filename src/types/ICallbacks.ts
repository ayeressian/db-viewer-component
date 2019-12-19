import ITableData from './ITableData';

export default interface ICallbacks {
  tableDblClick: (tableData: ITableData) => void;
  tableClick: (tableData: ITableData) => void;
  tableContextMenu: (tableData: ITableData) => void;
  tableMove: (tableData: ITableData) => void;
  tableMoveEnd: (tableData: ITableData) => void;
  zoomIn: (zoom: number) => void;
  zoomOut: (zoom: number) => void;
  viewportClick: (x: number, y: number) => void;
}
