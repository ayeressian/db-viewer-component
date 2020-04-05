import Point from "../types/Point";
import arrow from "./arrow";
import Orientation from "../types/Orientation";
import { PATH_START } from "./relationConfig";
import circlePath from "./circlePath";

export default (start: Point, end: Point, oneTo?: boolean, toMany?: boolean): string => {
  let dStartLine: string;
  let dPath: string;
  const p2X = start.x + (end.x - start.x) / 2;
  let dArrow: string;
  if (start.x > end.x) {
    dArrow = arrow(end, toMany, Orientation.Left);
    dPath = `M ${start.x} ${start.y}`;
    if (oneTo) {
      dStartLine = `M ${start.x - PATH_START} ${start.y - PATH_START} v ${2 * PATH_START}`;
      dPath += `H ${p2X}`;
    } else { // zero to
      dStartLine = circlePath(start.x - PATH_START, start.y);
      dPath += `m ${-PATH_START * 2} 0 H ${p2X}`;
    }
  } else {
    dArrow = arrow(end, toMany, Orientation.Right);
    dPath = `M ${start.x} ${start.y} `;
    if (oneTo) {
      dStartLine = `M ${start.x + PATH_START} ${start.y - PATH_START} v ${2 * PATH_START}`;
      dPath += `H ${p2X}`;
    } else { // zero to
      dStartLine = circlePath(start.x + PATH_START, start.y);
      dPath += `m ${PATH_START * 2} 0 H ${p2X}`;
    }
  }

  dPath += `V ${end.y} H ${end.x}`;

  return `${dStartLine} ${dPath} ${dArrow}`;
}
