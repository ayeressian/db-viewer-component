import Table from './Table';
import { TableSchema, Schema } from './Schema';

export default function schemaParser(schema: Schema) {
  const tablesFk = new Map();
  const tables: Array<Table> = [];
  schema.tables.forEach((table: TableSchema) => {
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
    fks.forEach((sFkColumn) => {
      const fkTable = tables.find((table) => table.getName() === sFkColumn.fk.table);
      const fkColumn = fkTable!.getColumns().find((column) => column.name === sFkColumn.fk.column);
      tables.find((table) => sTable.name === table.getName())!.addColumn(
        Object.assign(sFkColumn, {
          fk: {
            table: fkTable,
            column: fkColumn,
          },
        })
      );
    });
  });

  return tables;
}
