import chai from "chai";
import {
  lineIntersection,
  segmentIntersection,
  to3FixedNumber,
} from "../src/math-util";

const expect = chai.expect;
describe("mathUtil", () => {
  describe("mathUtil.lineIntersection", () => {
    it("will return null when lines are parallel", () => {
      const l1p1 = { x: 0, y: 0 };
      const l1p2 = { x: 1, y: 0 };
      const l2p1 = { x: 0, y: 1 };
      const l2p2 = { x: 1, y: 1 };
      expect(lineIntersection(l1p1, l1p2, l2p1, l2p2)).eq(null);
    });

    it("will return correct value", () => {
      const l1p1 = { x: 0, y: 0 };
      const l1p2 = { x: 2, y: 0 };
      const l2p1 = { x: 1, y: 2 };
      const l2p2 = { x: 1, y: 1 };
      expect(lineIntersection(l1p1, l1p2, l2p1, l2p2)).to.deep.equal({
        x: 1,
        y: 0,
      });
    });
  });

  describe("mathUtil.segmentIntersection", () => {
    it("will return null when segments are parallel", () => {
      const l1p1 = { x: 0, y: 0 };
      const l1p2 = { x: 1, y: 0 };
      const l2p1 = { x: 0, y: 1 };
      const l2p2 = { x: 1, y: 1 };
      expect(segmentIntersection(l1p1, l1p2, l2p1, l2p2)).eq(null);
    });

    it("will return null when segments don't intersect", () => {
      const l1p1 = { x: 0, y: 0 };
      const l1p2 = { x: 2, y: 0 };
      const l2p1 = { x: 1, y: 2 };
      const l2p2 = { x: 1, y: 1 };
      expect(segmentIntersection(l1p1, l1p2, l2p1, l2p2)).eq(null);
    });
  });

  describe("mathUtil.to3FixedNumber", () => {
    it("will return correct value", () => {
      expect(to3FixedNumber(0.2222)).to.be.equal(0.222);
    });
    it("will return correct value", () => {
      expect(to3FixedNumber(0.9996)).to.be.equal(1);
    });
  });
});
