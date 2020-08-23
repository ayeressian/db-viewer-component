import { PATH_START } from "./relation-config";

export default (x: number, y: number): string => {
  return (
    `M ${x - PATH_START} ${y}` +
    ` a 1,1 0 1,0 ${PATH_START * 2},0 a 1,1 0 1,0 ${-PATH_START * 2},0`
  );
};
