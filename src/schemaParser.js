import Table from './Table';

export function schemaParser(schema) {
  const tablesFk = new Map();
  const tables = [];
  schema.tables.forEach((table) => {
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
      const fkColumn = fkTable.columns.find((column) => column.name === sFkColumn.fk.column);
      tables.find((table) => sTable.name === table.getName()).addColumn(
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