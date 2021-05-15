import Annotation from "./annotation";
import Table from "./table";
import { ColumnFk } from "./types/column";
import {
  ColumnFkSchema,
  TableSchema,
  Schema,
  ColumnSchema,
  TableArrang,
  AnnotationSchema,
} from "./types/schema";

function parseAnnotations(annotationSchemas: AnnotationSchema[]): Annotation[] {
  return annotationSchemas.map((annotationSchema) => {
    return new Annotation(annotationSchema);
  });
}

function parseTables(
  tableSchemas: TableSchema[],
  arrangement?: TableArrang
): Table[] {
  const tablesFk = new Map<TableSchema, ColumnSchema[]>();
  const tables: Table[] = [];
  tableSchemas.forEach((table: TableSchema) => {
    const fks = table.columns.filter((column) => (column as ColumnFkSchema).fk);
    tablesFk.set(table, fks);
    for (let i = 0; i < table.columns.length; ) {
      if ((table.columns[i] as ColumnFkSchema).fk) {
        table.columns.splice(i, 1);
      } else {
        ++i;
      }
    }
    tables.push(new Table(table, arrangement));
  });

  tableSchemas.forEach((sTable) => {
    const fks = tablesFk.get(sTable)!;
    fks.forEach((sFkColumn: ColumnFkSchema) => {
      const fkTable = tables.find(
        (table) => table.getName() === sFkColumn.fk!.table
      )!;
      const fkColumn = fkTable
        .getColumns()
        .find((column) => column.name === sFkColumn.fk!.column);
      if (fkColumn == null) throw new Error("fk column not found");
      tables
        .find((table) => sTable.name === table.getName())!
        .addColumn({
          ...sFkColumn,
          fk: {
            column: fkColumn,
            table: fkTable,
          },
        } as ColumnFk);
    });
  });

  return tables;
}

export default function schemaParser(
  schema: Schema
): { tables: Table[]; annotations: Annotation[] } {
  return {
    tables: parseTables(schema.tables, schema.arrangement),
    annotations: parseAnnotations(schema.annotations ?? []),
  };
}
