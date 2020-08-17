import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";

import constant from "../src/const";
import schemaParser from "../src/schemaParser";

const expect = chai.expect;

chai.use(sinonChai);

describe("Viewer", () => {
  const subject = (): Function => {
    delete require.cache[require.resolve("../src/SpiralArrange.ts")];
    return require("../src/SpiralArrange.ts").default;
  };
  describe("SpiralArrange.call", () => {
    it("Orders table in correct way", () => {
      const SpiralArrange = subject();
      const schema = {
        tables: Array(7)
          .fill(null)
          .map((_val, i) => ({ name: `${i}`, columns: [] })),
      };
      let tables = schemaParser(schema);
      tables.forEach((table) => (table.setTablePos = sinon.fake()));
      tables = SpiralArrange.call(tables);

      const centerX = constant.VIEWER_PAN_WIDTH / 2;
      const centerY = constant.VIEWER_PAN_HEIGHT / 2;

      expect(tables[0].setTablePos).to.have.been.calledWith(centerX, centerY);
      expect(tables[1].setTablePos).to.have.been.calledWith(
        centerX + constant.SPIRAL_ARRANGE_DIST_X,
        centerY
      );
      expect(tables[2].setTablePos).to.have.been.calledWith(
        centerX + constant.SPIRAL_ARRANGE_DIST_X,
        centerY + constant.SPIRAL_ARRANGE_DIST_Y
      );
      expect(tables[3].setTablePos).to.have.been.calledWith(
        centerX,
        centerY + constant.SPIRAL_ARRANGE_DIST_Y
      );
      expect(tables[4].setTablePos).to.have.been.calledWith(
        centerX - constant.SPIRAL_ARRANGE_DIST_X,
        centerY + constant.SPIRAL_ARRANGE_DIST_Y
      );
      expect(tables[5].setTablePos).to.have.been.calledWith(
        centerX - constant.SPIRAL_ARRANGE_DIST_X,
        centerY
      );
      expect(tables[6].setTablePos).to.have.been.calledWith(
        centerX - constant.SPIRAL_ARRANGE_DIST_X,
        centerY - constant.SPIRAL_ARRANGE_DIST_Y
      );
    });
  });
});
