import ISchema, { IColumnFkSchema, ITableSchema } from './ISchema';
import Table from './Table';

export default function schemaParser(schema: ISchema): Table[] {
  const tablesFk = new Map();
  const tables: Table[] = [];
  schema.tables.forEach((table: ITableSchema) => {
    const fks = table.columns.filter((column) => column.fk);
    tablesFk.set(table, fks);
    for (let i = 0; i < table.columns.length;) {
      if (table.columns[i].fk) {
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
        Object.assign(sFkColumn, {
          fk: {
            column: fkColumn,
            table: fkTable,
          },
        }),
      );
    });
  });

  return tables;
}
