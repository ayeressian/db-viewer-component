import threeLinePathHoriz from "../../src/realtion/threeLinePathHoriz";
import { expect } from "chai";
import { start, end } from "./commonTestData";

describe("threeLinePathHoriz", () => {
  it("returns correct data", () => {
    const result = threeLinePathHoriz(start, end);
    const expectedResult =
      "M 100 100 a 1,1 0 1,0 10,0 a 1,1 0 1,0 -10,0 M 100 100 m 10 0 H 300V 500 H 500 M 500 500 l -9 4 M 500 500 l -9 -4";
    expect(result).to.equal(expectedResult);
  });
});
