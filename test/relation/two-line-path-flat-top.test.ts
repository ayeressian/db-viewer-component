import twoLinePathFlatTop from "../../src/realtion/two-line-path-flat-top";
import { expect } from "chai";
import { start, end } from "./common-test-data";

describe("twoLinePathFlatTop", () => {
  it("returns correct data", () => {
    const result = twoLinePathFlatTop(start, end);
    const expectedResult =
      "M 100 100 a 1,1 0 1,0 10,0 a 1,1 0 1,0 -10,0 M 110 100 H 500 V 500 M 500 500 l 4 -9 M 500 500 l -4 -9";
    expect(result).to.equal(expectedResult);
  });
});
