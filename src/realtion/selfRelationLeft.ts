import Point from "../types/Point";
import { PATH_START, PATH_SELF_RELATION_LENGTH } from "./relationConfig";
import circlePath from "./circlePath";
import arrow from "./arrow";
import Orientation from "../types/Orientation";

export default (start: Point, end: Point, oneTo?: boolean, toMany?: boolean): string => {
  let dStartLine: string;
  let dPath: string;

  if (oneTo) {
    dStartLine = `M ${start.x - PATH_START} ${start.y - PATH_START} v ${PATH_START * 2}`;
    dPath = `M ${start.x} ${start.y} h ${-PATH_SELF_RELATION_LENGTH} V ${end.y} h ${PATH_SELF_RELATION_LENGTH}`;
  } else {
    dStartLine = circlePath(start.x - PATH_START, start.y);
    dPath = `M ${start.x - PATH_START * 2} ${start.y} h ${-PATH_SELF_RELATION_LENGTH + PATH_START * 2} V ${end.y} h ${PATH_SELF_RELATION_LENGTH}`;
  }

  const dArrow = arrow(end, toMany, Orientation.Right);

  return `${dStartLine} ${dPath} ${dArrow}`;
}
