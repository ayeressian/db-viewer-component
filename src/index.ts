import schemaParser from './schemaParser';
import Table from './Table';
import template from './template';
import ISchema from './types/ISchema';
import ITableData from './types/ITableData';
import TableArrang from './types/TableArrang';
import validateJson from './validate-schema';
import Viewer from './Viewer';

const NO_TABLE = new Error('No table exist with the given name.');
const INVALID_SCHEMA = new Error('Invalid schema.');

class DbViewer extends HTMLElement {

  get scrollLeft(): number {
    return this.viewer!.getPan().x;
  }

  set scrollLeft(value: number) {
    this.viewer!.setPanX(value);
  }

  get scrollTop(): number {
    return this.viewer!.getPan().y;
  }

  set scrollTop(value: number) {
    this.viewer!.setPanY(value);
  }

  set src(src: string) {
    this.setAttribute('src', src);
  }

  static get observedAttributes(): string[] {
    return ['src', 'disable-table-movement'];
  }

  set schema(schema: ISchema | undefined) {
    this.readyPromise.then(() => {
      if (schema == null || !validateJson(schema)) {
        throw INVALID_SCHEMA;
      }
      this.notParsedSchema = JSON.parse(JSON.stringify(schema));
      const schemaObj = JSON.parse(JSON.stringify(schema));
      this.tables = schemaParser(schemaObj);
      this.viewer!.load(this.tables, schemaObj.viewport, schemaObj.arrangement);
    });
  }

  get schema(): ISchema | undefined {
    if (this.notParsedSchema != null) {
      this.notParsedSchema.tables.forEach((notParsedTable) => {
        notParsedTable.pos = this.tables!.find((table) => table.name === notParsedTable.name)!.pos;
      });
    }
    return this.notParsedSchema;
  }

  set disableTableMovement(value: boolean) {
    if (value) {
      this.setAttribute('disable-table-movement', '');
    } else {
      this.removeAttribute('disable-table-movement');
    }
  }

  get disableTableMovement(): boolean {
    return this.viewer!.isTableMovementDisabled;
  }
  private readyPromise: Promise<null>;
  private readyPromiseResolve?: () => void;
  private viewer?: Viewer;
  private tables?: Table[];
  private srcVal?: string;
  private notParsedSchema?: ISchema;

  constructor() {
    super();
    this.readyPromise = new Promise((resolve) => {
      this.readyPromiseResolve = resolve;
    });
    if (this.checkWindowLoaded()) {
      this.whenWindowLoaded();
    } else {
      window.addEventListener('load', this.whenWindowLoaded.bind(this));
    }
  }

  public getZoom(): number {
    return this.viewer!.getZoom()!;
  }

  public zoomIn() {
    this.viewer!.zoomIn();
  }

  public zoomOut() {
    this.viewer!.zoomOut();
  }

  public getTableInfo(name: string) {
    const table = this.tables!.find((tableItem) => tableItem.name === name);
    if (table == null) {
      throw NO_TABLE;
    }
    return table.data();
  }

  public setTablePos(name: string, xCord: number, yCord: number) {
    const table = this.tables!.find((tableItem) => tableItem.name === name);
    if (table == null) {
      throw NO_TABLE;
    }
    table.setTablePos(xCord, yCord);
  }

  // tslint:disable-next-line: variable-name
  public attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    switch (name) {
      case 'src':
      this.srcVal = newValue;
      this.readyPromise.then(() => {
        fetch(this.srcVal!).then((response) => response.json()).
        then((response) => {
          if (!validateJson(response)) {
            throw INVALID_SCHEMA;
          }
          this.notParsedSchema = JSON.parse(JSON.stringify(response));
          this.tables = schemaParser(response);

          let arrangement: TableArrang;
          if (!this.notParsedSchema!.arrangement) arrangement = TableArrang.default;
          else arrangement = TableArrang[this.notParsedSchema!.arrangement as keyof typeof TableArrang];

          this.viewer!.load(this.tables, response.viewport, arrangement);
          setTimeout(() => {
            this.dispatchEvent(new CustomEvent('load'));
          });
        });
      });
      break;
      case 'disable-table-movement':
        if (this.hasAttribute('disable-table-movement')) {
          this.readyPromise.then(() => this.viewer!.disableTableMovement(true));
        } else {
          this.readyPromise.then(() => this.viewer!.disableTableMovement(false));
        }
        break;
    }
  }
  private shadowDomLoaded(shadowDom: ShadowRoot) {
    return new Promise((resolve) => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes) {
            resolve();
          }
        });
      });
      observer.observe(shadowDom, { childList: true });
    });
  }

  private whenWindowLoaded() {
    const shadowDom = this.attachShadow({
      mode: 'open',
    });
    this.shadowDomLoaded(shadowDom).then(() => {
      this.viewer = new Viewer(shadowDom);
      this.viewer.setCallbacks({
        tableClick: this.onTableClick.bind(this),
        tableContextMenu: this.onTableContextMenu.bind(this),
        tableDblClick: this.onTableDblClick.bind(this),
        tableMove: this.onTableMove.bind(this),
        tableMoveEnd: this.onTableMoveEnd.bind(this),
        viewportClick: this.onViewportClick.bind(this),
        zoomIn: this.onZoomIn.bind(this),
        zoomOut: this.onZoomOut.bind(this),
      });
      this.readyPromiseResolve!();
      this.dispatchEvent(new CustomEvent('ready'));
    });
    shadowDom.innerHTML = template;
  }

  private checkWindowLoaded(): boolean {
    return document.readyState === 'complete';
  }

  private onViewportClick(x: number, y: number) {
    this.dispatchEvent(new CustomEvent('viewportClick', {detail: {x, y}}));
  }

  private onTableClick(tableData: ITableData) {
    this.dispatchEvent(new CustomEvent('tableClick', {detail: tableData}));
  }

  private onTableDblClick(tableData: ITableData) {
    this.dispatchEvent(new CustomEvent('tableDblClick', {detail: tableData}));
  }

  private onTableContextMenu(tableData: ITableData) {
    this.dispatchEvent(new CustomEvent('tableContextMenu', {detail: tableData}));
  }

  private onTableMove(tableData: ITableData) {
    this.dispatchEvent(new CustomEvent('tableMove', {detail: tableData}));
  }

  private onTableMoveEnd(tableData: ITableData) {
    this.dispatchEvent(new CustomEvent('tableMoveEnd', {detail: tableData}));
  }

  private onZoomIn(zoom: number) {
    this.dispatchEvent(new CustomEvent('zoomIn', {detail: {zoom}}));
  }

  private onZoomOut(zoom: number) {
    this.dispatchEvent(new CustomEvent('zoomOut', {detail: {zoom}}));
  }
}

customElements.define('db-viewer', DbViewer);
