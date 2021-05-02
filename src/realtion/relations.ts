import Table from "../table";
import Orientation from "../types/orientation";
import Relation from "./relation";

type SidesAndCount = { [K in Orientation]: number };

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
  ): {
    leftRelations: Relation[];
    rightRelations: Relation[];
    topRelations: Relation[];
    bottomRelations: Relation[];
  } {
    const leftRelations = [] as Relation[],
      rightRelations = [] as Relation[],
      topRelations = [] as Relation[],
      bottomRelations = [] as Relation[];

    for (const tableRelation of tableRelations) {
      let pathSide: Orientation | undefined;
      if (tableRelation.sameTableRelation()) continue;
      if (tableRelation.toTable === table) {
        pathSide = tableRelation.toTablePathSide;
      } else if (tableRelation.fromTable === table) {
        pathSide = tableRelation.fromTablePathSide;
      }
      switch (pathSide) {
        case Orientation.Left:
          leftRelations.push(tableRelation);
          break;
        case Orientation.Right:
          rightRelations.push(tableRelation);
          break;
        case Orientation.Top:
          topRelations.push(tableRelation);
          break;
        case Orientation.Bottom:
          bottomRelations.push(tableRelation);
          break;
      }
    }

    Relation.ySort(leftRelations, table);
    Relation.ySort(rightRelations, table);
    Relation.xSort(topRelations, table);
    Relation.xSort(bottomRelations, table);

    return { leftRelations, rightRelations, topRelations, bottomRelations };
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

  draw(tables: Table[]): void {
    tables.forEach((table) => {
      const tableRelations = this.getTableRelations(table);
      const pendingSelfRelations = tableRelations.filter((relation) =>
        relation.calcPathTableSides()
      );
      const {
        leftRelations,
        rightRelations,
        topRelations,
        bottomRelations,
      } = Relations.getTableRelationsByOrientation(table, tableRelations);

      const sidesAndCount: SidesAndCount = {
        [Orientation.Left]: leftRelations.length,
        [Orientation.Right]: rightRelations.length,
        [Orientation.Top]: topRelations.length,
        [Orientation.Bottom]: bottomRelations.length,
      };

      pendingSelfRelations.forEach((pendingSelfRelation) => {
        const minSide = Relations.minSide(sidesAndCount);

        switch (minSide) {
          case Orientation.Left:
            leftRelations.push(pendingSelfRelation);
            break;
          case Orientation.Right:
            rightRelations.push(pendingSelfRelation);
            break;
          case Orientation.Top:
            topRelations.push(pendingSelfRelation);
            break;
          case Orientation.Bottom:
            bottomRelations.push(pendingSelfRelation);
            break;
        }
        pendingSelfRelation.fromTablePathSide = minSide;
        pendingSelfRelation.toTablePathSide = minSide;
        sidesAndCount[minSide] += 2;
      });
      Relations.updatePathIndex(
        leftRelations,
        sidesAndCount[Orientation.Left],
        table
      );
      Relations.updatePathIndex(
        rightRelations,
        sidesAndCount[Orientation.Right],
        table
      );
      Relations.updatePathIndex(
        topRelations,
        sidesAndCount[Orientation.Top],
        table
      );
      Relations.updatePathIndex(
        bottomRelations,
        sidesAndCount[Orientation.Bottom],
        table
      );
    });

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
