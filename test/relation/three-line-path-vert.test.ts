import threeLinePathVert from "../../src/realtion/three-line-path-vert";
import { expect } from "chai";
import { start, end } from "./common-test-data";

describe("threeLinePathVert", () => {
  it("returns correct data", () => {
    const result = threeLinePathVert(start, end);
    const expectedResult =
      "M 95 105 a 1,1 0 1,0 10,0 a 1,1 0 1,0 -10,0 M 100 110 V 300 H 500 V 500 M 500 500 l 4 -9 M 500 500 l -4 -9";
    expect(result).to.equal(expectedResult);
  });
});
