import Point from "../types/Point";
import { PATH_START, PATH_SELF_RELATION_LENGTH } from "./relationConfig";
import Orientation from "../types/Orientation";
import arrow from "./arrow";
import circlePath from "./circlePath";

export default (start: Point, end: Point, oneTo?: boolean, toMany?: boolean): string => {
  let dStartLine: string;
  let dPath: string;

  if (oneTo) {
    dStartLine = `M ${start.x - PATH_START} ${start.y - PATH_START} h ${PATH_START * 2}`;
    dPath = `M ${start.x} ${start.y} v ${-PATH_SELF_RELATION_LENGTH} H ${end.x} v ${PATH_SELF_RELATION_LENGTH}`;
  } else {
    dStartLine = circlePath(start.x, start.y - PATH_START);
    dPath = `M ${start.x} ${start.y - PATH_START * 2} v ${-PATH_SELF_RELATION_LENGTH + PATH_START * 2} H ${end.x} v ${PATH_SELF_RELATION_LENGTH}`;
  }

  const dArrow = arrow(end, toMany, Orientation.Bottom);

  return `${dStartLine} ${dPath} ${dArrow}`;
};
