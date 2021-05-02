import Table from "../table";
import Orientation from "../types/orientation";
import Relation from "./relation";

type SidesAndCount = { [K in Orientation]: number };
type OrientationAndRelations = { [K in Orientation]: Relation[] };

class Relations {
  private relations: Relation[] = [];

  constructor(private addToViewer: (elem: SVGElement) => void) {}

  addRelation(relation: Relation): void {
    this.relations.push(relation);
  }

  private getTableRelations(table: Table): Relation[] {
    return this.relations.filter((relations) => {
      return relations.fromTable === table || relations.toTable === table;
    });
  }

  private static getTableRelationsByOrientation(
    table: Table,
    tableRelations: Relation[]
  ): OrientationAndRelations {
    const result: OrientationAndRelations = {
      [Orientation.Left]: [],
      [Orientation.Right]: [],
      [Orientation.Top]: [],
      [Orientation.Bottom]: [],
    };

    for (const tableRelation of tableRelations) {
      let pathSide: Orientation | undefined;
      if (tableRelation.sameTableRelation()) continue;
      if (tableRelation.toTable === table) {
        pathSide = tableRelation.toTablePathSide;
      } else if (tableRelation.fromTable === table) {
        pathSide = tableRelation.fromTablePathSide;
      }
      if (pathSide != null) result[pathSide].push(tableRelation);
    }

    Relation.ySort(result[Orientation.Left], table);
    Relation.ySort(result[Orientation.Right], table);
    Relation.xSort(result[Orientation.Top], table);
    Relation.xSort(result[Orientation.Bottom], table);

    return result;
  }

  private static minSide(sidesAndCount: SidesAndCount): Orientation {
    const [side] = Object.entries(sidesAndCount).reduce(
      (
        [minOrientation, minCount],
        [orientationString, count]
      ): [Orientation, number] => {
        const orientation = parseInt(orientationString) as Orientation;
        if (count < minCount) return [orientation, count];
        return [minOrientation, minCount];
      },
      [Orientation.Left, Number.MAX_SAFE_INTEGER] as [Orientation, number]
    );
    return side;
  }

  private static updatePathIndex(
    relations: Relation[],
    count: number,
    table: Table
  ): void {
    let pathIndex = 0;
    relations.forEach((relation) => {
      pathIndex = relation.setPathIndex(table, count, pathIndex);
    });
  }

  private itterateOrientation(func: (orientation: Orientation) => void): void {
    func(Orientation.Left);
    func(Orientation.Right);
    func(Orientation.Top);
    func(Orientation.Bottom);
  }

  private createSidesAndCount(
    relationsByOrientation: OrientationAndRelations
  ): SidesAndCount {
    return {
      [Orientation.Left]: relationsByOrientation[Orientation.Left].length,
      [Orientation.Right]: relationsByOrientation[Orientation.Right].length,
      [Orientation.Top]: relationsByOrientation[Orientation.Top].length,
      [Orientation.Bottom]: relationsByOrientation[Orientation.Bottom].length,
    };
  }

  private drawTableRelations(table: Table) {
    const tableRelations = this.getTableRelations(table);
    const pendingSelfRelations = tableRelations.filter((relation) =>
      relation.calcPathTableSides()
    );
    const relationsByOrientation = Relations.getTableRelationsByOrientation(
      table,
      tableRelations
    );

    const sidesAndCount = this.createSidesAndCount(relationsByOrientation);

    pendingSelfRelations.forEach((pendingSelfRelation) => {
      const minSide = Relations.minSide(sidesAndCount);
      relationsByOrientation[minSide].push(pendingSelfRelation);
      pendingSelfRelation.fromTablePathSide = minSide;
      pendingSelfRelation.toTablePathSide = minSide;
      sidesAndCount[minSide] += 2;
    });
    this.itterateOrientation((orientation: Orientation) => {
      Relations.updatePathIndex(
        relationsByOrientation[orientation],
        sidesAndCount[orientation],
        table
      );
    });
  }

  draw(tables: Table[]): void {
    tables.forEach((table) => this.drawTableRelations(table));

    this.relations.forEach((relation: Relation) => {
      relation.removeHoverEffect();
      relation.remove();
      const elems = relation.render();
      elems.forEach((elem) => elem && this.addToViewer(elem));
    });
  }

  removeAll(): void {
    this.relations = [];
  }
}

export default Relations;
