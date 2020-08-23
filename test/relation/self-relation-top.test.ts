import selfRelationTop from "../../src/realtion/self-relation-top";
import { expect } from "chai";
import { start } from "./common-test-data";

describe("selfRelationTop", () => {
  it("returns correct data", () => {
    const result = selfRelationTop(start, { x: 500, y: 100 });
    const expectedResult =
      "M 95 95 a 1,1 0 1,0 10,0 a 1,1 0 1,0 -10,0 M 100 90 v -30 H 500 v 40 M 500 100 l 4 -9 M 500 100 l -4 -9";
    expect(result).to.equal(expectedResult);
  });
});
