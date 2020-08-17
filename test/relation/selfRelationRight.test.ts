import selfRelationRight from "../../src/realtion/selfRelationRight";
import { expect } from "chai";
import { start } from "./commonTestData";

describe("selfRelationRight", () => {
  it("returns correct data", () => {
    const result = selfRelationRight(start, { x: 100, y: 500 });
    const expectedResult =
      "M 100 100 a 1,1 0 1,0 10,0 a 1,1 0 1,0 -10,0 M 110 100 h 30 V 500 h -40 M 100 500 l 9 4 M 100 500 l 9 -4";
    expect(result).to.equal(expectedResult);
  });
});
