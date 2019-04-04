import chai from 'chai';
import schemaParser from '../src/schemaParser.js';
import constant from '../src/const.js';

const expect = chai.expect;

describe('Viewer', () => {
  const subject = () => {
    delete require.cache[require.resolve('../src/Viewer.js')];
    return require('../src/Viewer.js').default;
  };
  describe('Viewer.prototype._arrangTablesSpiral', () => {
    it('Orders table in correct way', () => {
      const Viewer = subject();
      const schema = {
        tables: Array(7).fill().map((val, i) => ({name: `${i}`, columns: []}))
      };
      let tables = schemaParser(schema).tables;
      tables = Viewer.prototype._arrangTablesSpiral(tables);

      const centerX = constant.VIEWER_PAN_WIDTH / 2;
      const centerY = constant.VIEWER_PAN_HEIGHT / 2;

      expect(tables[0].pos.x).eq(centerX);
      expect(tables[0].pos.y).eq(centerY);

      expect(tables[1].pos.x).eq(centerX + constant.SPIRAL_ARRANGE_DIST_X);
      expect(tables[1].pos.y).eq(centerY);

      expect(tables[2].pos.x).eq(centerX + constant.SPIRAL_ARRANGE_DIST_X);
      expect(tables[2].pos.y).eq(centerY + constant.SPIRAL_ARRANGE_DIST_Y);

      expect(tables[3].pos.x).eq(centerX);
      expect(tables[3].pos.y).eq(centerY + constant.SPIRAL_ARRANGE_DIST_Y);

      expect(tables[4].pos.x).eq(centerX - constant.SPIRAL_ARRANGE_DIST_X);
      expect(tables[4].pos.y).eq(centerY + constant.SPIRAL_ARRANGE_DIST_Y);

      expect(tables[5].pos.x).eq(centerX - constant.SPIRAL_ARRANGE_DIST_X);
      expect(tables[5].pos.y).eq(centerY);

      expect(tables[6].pos.x).eq(centerX - constant.SPIRAL_ARRANGE_DIST_X);
      expect(tables[6].pos.y).eq(centerY - constant.SPIRAL_ARRANGE_DIST_Y);
    });
  });
});

