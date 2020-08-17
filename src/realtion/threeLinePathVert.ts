import Point from "../types/Point";
import { PATH_START } from "./relationConfig";
import arrow from "./arrow";
import Orientation from "../types/Orientation";
import circlePath from "./circlePath";

export default (
  start: Point,
  end: Point,
  oneTo?: boolean,
  toMany?: boolean
): string => {
  let dStartLine = `M ${start.x - PATH_START} `;

  let dPath: string;
  const p2Y = start.y + (end.y - start.y) / 2;
  let dArrow: string;
  if (start.y > end.y) {
    dArrow = arrow(end, toMany, Orientation.Top);
    if (oneTo) {
      dStartLine += `${start.y - PATH_START} h ${2 * PATH_START}`;
      dPath = `M ${start.x} ${start.y} V ${p2Y} H ${end.x} V ${end.y}`;
    } else {
      // zero to
      dStartLine = circlePath(start.x, start.y - PATH_START);
      dPath = `M ${start.x} ${start.y - PATH_START * 2} V ${p2Y} H ${end.x} V ${
        end.y
      }`;
    }
  } else {
    dArrow = arrow(end, toMany, Orientation.Bottom);
    dStartLine += `${start.y + PATH_START} h ${2 * PATH_START}`;
    if (oneTo) {
      dPath = `M ${start.x} ${start.y} V ${p2Y} H ${end.x} V ${end.y}`;
    } else {
      // zero to
      dStartLine = circlePath(start.x, start.y + PATH_START);
      dPath = `M ${start.x} ${start.y + PATH_START * 2} V ${p2Y} H ${end.x} V ${
        end.y
      }`;
    }
  }

  return `${dStartLine} ${dPath} ${dArrow}`;
};
