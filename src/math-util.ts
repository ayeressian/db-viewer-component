import Point from "./types/point";

export function to3FixedNumber(num: number): number {
  return Math.round(num * 1e3) / 1e3;
}

export function distance(point1: Point, point2: Point): number {
  const a = Math.abs(point1.y - point2.y);
  const b = Math.abs(point1.x - point2.x);

  return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
}

export function center(point1: Point, point2: Point): Point {
  return { y: (point1.y + point2.y) / 2, x: (point1.x + point2.x) / 2 };
}

export function lineIntersection(
  l1p1: Point,
  l1p2: Point,
  l2p1: Point,
  l2p2: Point
): Point | null {
  const deltaXL1 = l1p1.x - l1p2.x;
  const deltaXL2 = l2p1.x - l2p2.x;
  let result: Point | null;

  if (deltaXL1 === 0 && deltaXL2 === 0) {
    // Parallel both horizontal
    return null;
  }

  // first line horizontal
  if (deltaXL1 === 0) {
    const deltaYL2 = l2p1.y - l2p2.y;
    const m2 = deltaYL2 / deltaXL2;
    const b2 = l2p1.y - m2 * l2p1.x;

    const intersectY = m2 * l1p1.x + b2;

    result = {
      x: l1p1.x,
      y: intersectY,
    };
  } else {
    const deltaYL1 = l1p1.y - l1p2.y;
    const m1 = deltaYL1 / deltaXL1;
    const b1 = l1p1.y - m1 * l1p1.x;

    if (deltaXL2 === 0) {
      const intersectY = m1 * l2p1.x + b1;
      result = {
        x: l2p1.x,
        y: intersectY,
      };
    } else {
      const deltaYL2 = l2p1.y - l2p2.y;
      const m2 = deltaYL2 / deltaXL2;

      // Parallel
      if (m1 === m2) result = null;
      else {
        const b2 = l2p1.y - m2 * l2p1.x;

        const intersectX = (b1 - b2) / (m2 - m1);
        const intersectY = m1 * intersectX + b1;

        result = {
          x: to3FixedNumber(intersectX),
          y: to3FixedNumber(intersectY),
        };
      }
    }
  }
  return result;
}

export function segmentIntersection(
  l1p1: Point,
  l1p2: Point,
  l2p1: Point,
  l2p2: Point
): Point | null {
  l1p1.x = to3FixedNumber(l1p1.x);
  l1p1.y = to3FixedNumber(l1p1.y);
  l1p2.x = to3FixedNumber(l1p2.x);
  l1p2.y = to3FixedNumber(l1p2.y);

  l2p1.x = to3FixedNumber(l2p1.x);
  l2p1.y = to3FixedNumber(l2p1.y);
  l2p2.x = to3FixedNumber(l2p2.x);
  l2p2.y = to3FixedNumber(l2p2.y);
  const ip = lineIntersection(l1p1, l1p2, l2p1, l2p2);

  if (!ip) return null;

  if (
    ip.x <= Math.max(l1p1.x, l1p2.x) &&
    ip.x >= Math.min(l1p1.x, l1p2.x) &&
    ip.x <= Math.max(l2p1.x, l2p2.x) &&
    ip.x >= Math.min(l2p1.x, l2p2.x) &&
    ip.y <= Math.max(l1p1.y, l1p2.y) &&
    ip.y >= Math.min(l1p1.y, l1p2.y) &&
    ip.y <= Math.max(l2p1.y, l2p2.y) &&
    ip.y >= Math.min(l2p1.y, l2p2.y)
  )
    return ip;
  return null;
}
