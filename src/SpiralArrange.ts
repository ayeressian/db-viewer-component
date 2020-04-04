import constant from './const';
import Table from './table';

export default class SpiralArrange {
  public static call(tables: Table[]): Table[] {
    let currentX = constant.VIEWER_PAN_WIDTH / 2;
    let currentY = constant.VIEWER_PAN_HEIGHT / 2;
    tables[0].setTablePos(currentX, currentY);
    let direction = 0;
    let index = 1;
    let numOfTablesTillDirectionChange = 1;
    let countBeforeDirChange = 0;
    while (index < tables.length) {
      if (countBeforeDirChange === 2) {
        ++numOfTablesTillDirectionChange;
        countBeforeDirChange = 0;
      } else {
        ++countBeforeDirChange;
      }
      const lastIndex = index + numOfTablesTillDirectionChange;
      const tablesWithDirection = tables.slice(index, lastIndex);
      tablesWithDirection.forEach((table) => {
        switch (direction) {
          case 0: // right
          currentX += constant.SPIRAL_ARRANGE_DIST_X;
          break;
          case 1: // down
          currentY += constant.SPIRAL_ARRANGE_DIST_Y;
          break;
          case 2: // left
          currentX -= constant.SPIRAL_ARRANGE_DIST_X;
          break;
          case 3: // up
          currentY -= constant.SPIRAL_ARRANGE_DIST_Y;
          break;
        }
        table.setTablePos(currentX, currentY);
      });
      direction = (direction + 1) % 4;
      index = lastIndex;
    }
    return tables;
  }
}
