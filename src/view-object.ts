import Point from "./types/point";
import Viewer from "./viewer";

abstract class ViewObject {
  protected abstract rootElem: HTMLElement;
  protected abstract viewer: Viewer;
  protected abstract posValue: Point | string;

  protected abstract gElem: SVGGraphicsElement;

  get pos(): string | Point {
    return this.pos;
  }

  protected notAllowOutOfBound({ x, y }: Point): Point {
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + this.rootElem.offsetWidth > this.viewer.getViewerPanWidth()) {
      x = this.viewer.getViewerPanWidth() - this.rootElem.offsetWidth;
    }
    if (y + this.rootElem.offsetHeight > this.viewer.getViewerPanHeight()) {
      y = this.viewer.getViewerPanHeight() - this.rootElem.offsetHeight;
    }
    return { x, y };
  }
}

export default ViewObject;
