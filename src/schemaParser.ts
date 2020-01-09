import Table from './Table';
import { IColumnFk } from './types/Column';
import ISchema, { IColumnFkSchema, ITableSchema } from './types/ISchema';

export default function schemaParser(schema: ISchema): Table[] {
  const tablesFk = new Map();
  const tables: Table[] = [];
  schema.tables.forEach((table: ITableSchema) => {
    const fks = table.columns.filter((column) => (column as IColumnFkSchema).fk);
    tablesFk.set(table, fks);
    for (let i = 0; i < table.columns.length;) {
      if ((table.columns[i] as IColumnFkSchema).fk) {
        table.columns.splice(i, 1);
      } else {
        ++i;
      }
    }
    tables.push(new Table(table));
  });

  schema.tables.forEach((sTable) => {
    const fks = tablesFk.get(sTable);
    fks.forEach((sFkColumn: IColumnFkSchema) => {
      const fkTable = tables.find((table) => table.getName() === sFkColumn.fk!.table)!;
      const fkColumn = fkTable!.getColumns().find((column) => column.name === sFkColumn.fk!.column);
      tables.find((table) => sTable.name === table.getName())!.addColumn(
        ({
          ...sFkColumn,
          fk: {
            column: fkColumn,
            table: fkTable,
          },
        }) as IColumnFk,
      );
    });
  });

  return tables;
}
