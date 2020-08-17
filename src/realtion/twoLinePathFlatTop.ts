import Point from "../types/Point";
import { PATH_START } from "./relationConfig";
import circlePath from "./circlePath";
import arrow from "./arrow";
import Orientation from "../types/Orientation";

export default (
  start: Point,
  end: Point,
  oneTo?: boolean,
  toMany?: boolean
): string => {
  let dArrow: string;
  let dStartLine: string;
  let dPath: string;

  if (start.y > end.y) {
    if (oneTo) {
      dStartLine = `M ${start.x - PATH_START} ${start.y - PATH_START}
                    h ${2 * PATH_START}`;
      dPath = `M ${start.x} ${start.y}`;
    } else {
      // zero to
      dStartLine = circlePath(start.x, start.y - PATH_START);
      dPath = `M ${start.x} ${start.y - PATH_START * 2}`;
    }
    dPath += ` V ${end.y} H ${end.x}`;

    if (start.x > end.x) {
      dArrow = arrow(end, toMany, Orientation.Left);
    } else {
      dArrow = arrow(end, toMany, Orientation.Right);
    }
  } else {
    if (oneTo) {
      if (start.x > end.x) {
        dStartLine = `M ${start.x - PATH_START} `;
      } else {
        dStartLine = `M ${start.x + PATH_START} `;
      }
      dStartLine += `${start.y - PATH_START} v ${2 * PATH_START}`;
      dPath = `M ${start.x} ${start.y} H ${end.x} V ${end.y}`;
    } else {
      // zero to
      if (start.x > end.x) {
        dStartLine = circlePath(start.x - PATH_START, start.y);
      } else {
        dStartLine = circlePath(start.x + PATH_START, start.y);
      }
      if (start.x > end.x) {
        dPath = `M ${start.x - PATH_START * 2}`;
      } else {
        dPath = `M ${start.x + PATH_START * 2}`;
      }
      dPath += ` ${start.y} H ${end.x} V ${end.y}`;
    }
    dArrow = arrow(end, toMany, Orientation.Bottom);
  }

  return `${dStartLine} ${dPath} ${dArrow}`;
};
