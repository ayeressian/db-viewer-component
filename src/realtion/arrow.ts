import Point from "../types/Point";
import Orientation from "../types/Orientation";
import { PATH_ARROW_LENGTH, PATH_ARROW_HEIGHT } from "./relationConfig";

export default (
  { x, y }: Point,
  toMany: boolean | undefined,
  orientation: Orientation
): string => {
  switch (orientation) {
    case Orientation.Top:
      if (toMany) {
        return (
          `M ${x} ${
            y + PATH_ARROW_LENGTH
          } l ${PATH_ARROW_HEIGHT} ${-PATH_ARROW_LENGTH} ` +
          `M ${x} ${
            y + PATH_ARROW_LENGTH
          } l ${-PATH_ARROW_HEIGHT} ${-PATH_ARROW_LENGTH}`
        );
      } else {
        return (
          `M ${x} ${y} l ${PATH_ARROW_HEIGHT} ${PATH_ARROW_LENGTH} ` +
          `M ${x} ${y} l ${-PATH_ARROW_HEIGHT} ${PATH_ARROW_LENGTH}`
        );
      }
    case Orientation.Bottom:
      if (toMany) {
        return (
          `M ${x} ${
            y - PATH_ARROW_LENGTH
          } l ${PATH_ARROW_HEIGHT} ${PATH_ARROW_LENGTH} ` +
          `M ${x} ${
            y - PATH_ARROW_LENGTH
          } l ${-PATH_ARROW_HEIGHT} ${PATH_ARROW_LENGTH}`
        );
      } else {
        return (
          `M ${x} ${y} l ${PATH_ARROW_HEIGHT} ${-PATH_ARROW_LENGTH} ` +
          `M ${x} ${y} l ${-PATH_ARROW_HEIGHT} ${-PATH_ARROW_LENGTH}`
        );
      }
    case Orientation.Left:
      if (toMany) {
        return (
          `M ${
            x + PATH_ARROW_LENGTH
          } ${y} l ${-PATH_ARROW_LENGTH} ${PATH_ARROW_HEIGHT} ` +
          `M ${
            x + PATH_ARROW_LENGTH
          } ${y} l ${-PATH_ARROW_LENGTH} ${-PATH_ARROW_HEIGHT}`
        );
      } else {
        return (
          `M ${x} ${y} l ${PATH_ARROW_LENGTH} ${PATH_ARROW_HEIGHT} ` +
          `M ${x} ${y} l ${PATH_ARROW_LENGTH} ${-PATH_ARROW_HEIGHT}`
        );
      }
    case Orientation.Right:
      if (toMany) {
        return (
          `M ${
            x - PATH_ARROW_LENGTH
          } ${y} l ${PATH_ARROW_LENGTH} ${PATH_ARROW_HEIGHT} ` +
          `M ${
            x - PATH_ARROW_LENGTH
          } ${y} l ${PATH_ARROW_LENGTH} ${-PATH_ARROW_HEIGHT}`
        );
      } else {
        return (
          `M ${x} ${y} l ${-PATH_ARROW_LENGTH} ${PATH_ARROW_HEIGHT} ` +
          `M ${x} ${y} l ${-PATH_ARROW_LENGTH} ${-PATH_ARROW_HEIGHT}`
        );
      }
  }
};
