import Annotation from "./annotation";
import Table from "./table/table";
import CommonEventListener from "./types/common-event-listener";
import Point from "./types/point";
import { elementIndex, isTouchEvent, normalizeEvent } from "./util";
import Viewer from "./viewer";

type Target = Table | Annotation;

export type OnMove = (
  target: Target,
  x: number,
  y: number,
  cordinatesChanged: boolean
) => void;

export type OnMoveEnd = <Target>(target: Target) => void;

export default class MoveEvents {
  constructor(
    private viewer: Viewer,
    private target: Target,
    private elem: HTMLElement,
    private foreignObject: Element,
    private disableMovementValue: boolean,
    private gElem: SVGGraphicsElement,
    private onMove: OnMove,
    private onMoveEnd: OnMoveEnd,
    private setPosValue: (point: Point) => void,
    private getPosValue: () => Point
  ) {
    this.gElem.addEventListener(
      "mousedown",
      this.#onMouseDown as CommonEventListener
    );
    this.gElem.addEventListener(
      "touchstart",
      this.#onMouseDown as CommonEventListener
    );
  }

  #mouseDownInitialElemX!: number;
  #mouseDownInitialElemY!: number;
  #initialClientX!: number;
  #initialClientY!: number;

  // The reason for not using append of this.elem instead of remaining element prepend
  // is to keep event concistency. The following code is for making click and and double click to work.
  private moveToTopAnnotation(): void {
    const parentNode = this.gElem.parentNode;
    const gElemIndex = elementIndex(this.gElem);
    const children = parentNode!.childNodes;
    const firstTable = parentNode!.querySelector(".table");
    const firstPath = parentNode!.querySelector("path");
    let iterateUntil: number;
    if (firstPath) {
      iterateUntil = Array.from(parentNode!.childNodes).indexOf(firstPath);
    } else if (firstTable) {
      iterateUntil = Array.from(parentNode!.childNodes).indexOf(firstTable);
    } else {
      iterateUntil = children.length - 1;
    }
    for (let i = gElemIndex + 1; i < iterateUntil; ++i) {
      parentNode?.insertBefore(children[i], this.gElem);
    }
  }

  // The reason for not using append of this.elem instead of remaining element prepend
  // is to keep event concistency. The following code is for making click and and double click to work.
  private moveTopTable(): void {
    const parentNode = this.gElem.parentNode;
    const children = parentNode!.childNodes;
    const gElemIndex = elementIndex(this.gElem);
    for (let i = gElemIndex + 1; i < children.length; ++i) {
      parentNode?.insertBefore(children[i], this.gElem);
    }
  }

  private moveToTop(): void {
    if (this.gElem.classList.contains("table")) {
      this.moveTopTable();
    } else {
      this.moveToTopAnnotation();
    }
  }

  private notAllowOutOfBound(x: number, y: number): Point {
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + this.elem.offsetWidth > this.viewer.getViewerPanWidth()) {
      x = this.viewer.getViewerPanWidth() - this.elem.offsetWidth;
    }
    if (y + this.elem.offsetHeight > this.viewer.getViewerPanHeight()) {
      y = this.viewer.getViewerPanHeight() - this.elem.offsetHeight;
    }
    return { x, y };
  }

  private isPoint(pos: Point | string): pos is Point {
    return (pos as Point).x !== undefined;
  }

  setPos = (x: number, y: number, disableOutOfBoundCheck = false): void => {
    if (!disableOutOfBoundCheck) {
      const result = this.notAllowOutOfBound(x, y);
      x = result.x;
      y = result.y;
    }
    const cordinatesChanged =
      this.isPoint(this.getPosValue()) &&
      (this.getPosValue().x !== x || this.getPosValue().y !== y);

    this.setPosValue({
      x,
      y,
    });
    this.foreignObject.setAttributeNS(null, "x", x.toString());
    this.foreignObject.setAttributeNS(null, "y", y.toString());
    if (this.onMove) this.onMove(this.target, x, y, cordinatesChanged);
  };

  #onMouseMove = (event: MouseEvent | TouchEvent): void => {
    console.log(event);
    if (!this.viewer.getGestureStart()) {
      const mousePos = this.viewer.getMousePosRelativeContainer(event);

      const normalizedClientX =
        mousePos.x / this.viewer.getZoom()! +
        this.viewer.getPan().x / this.viewer.getZoom()!;
      const normalizedClientY =
        mousePos.y / this.viewer.getZoom()! +
        this.viewer.getPan().y / this.viewer.getZoom()!;
      const x = normalizedClientX - this.#mouseDownInitialElemX;
      const y = normalizedClientY - this.#mouseDownInitialElemY;

      this.setPos(x, y);
      const pos = this.getPosValue();
      if (this.onMove) this.onMove(this.target, pos.x, pos.y, true);
    }
  };

  #mouseUp = (mouseUpEvent: MouseEvent): void => {
    if (
      this.onMoveEnd &&
      (this.#initialClientX !== mouseUpEvent.clientX ||
        this.#initialClientY !== mouseUpEvent.clientY)
    ) {
      this.onMoveEnd(this.target);
    }
    this.elem.classList.remove("move");
    document.removeEventListener(
      "mouseup",
      this.#mouseUp as CommonEventListener
    );
    document.removeEventListener(
      "touchend",
      this.#mouseUp as CommonEventListener
    );
    document.removeEventListener(
      "mousemove",
      this.#onMouseMove as CommonEventListener
    );
    document.removeEventListener(
      "touchmove",
      this.#onMouseMove as CommonEventListener
    );
  };

  #onMouseDown = (event: MouseEvent | TouchEvent): void => {
    console.log(event);
    const touchEvent = isTouchEvent(event);
    if (
      ((!touchEvent &&
        ((event as MouseEvent).button === 0 ||
          (event as MouseEvent).button == null)) ||
        touchEvent) &&
      this.disableMovementValue === false
    ) {
      const eventVal = normalizeEvent(event);
      this.elem.classList.add("move");
      const boundingRect = this.gElem.getBoundingClientRect();
      const zoom = this.viewer.getZoom()!;
      this.#mouseDownInitialElemX =
        (eventVal.clientX - boundingRect.left) / zoom;
      this.#mouseDownInitialElemY =
        (eventVal.clientY - boundingRect.top) / zoom;

      this.#initialClientX = eventVal.clientX;
      this.#initialClientY = eventVal.clientY;

      document.addEventListener(
        "mousemove",
        this.#onMouseMove as CommonEventListener
      );
      document.addEventListener(
        "touchmove",
        this.#onMouseMove as CommonEventListener
      );

      this.moveToTop();

      document.addEventListener(
        "mouseup",
        this.#mouseUp as CommonEventListener
      );
      document.addEventListener(
        "touchend",
        this.#mouseUp as CommonEventListener
      );
    }
  };

  #cleanUp = (): void => {
    document.removeEventListener(
      "mousemove",
      this.#onMouseMove as CommonEventListener
    );
    document.removeEventListener(
      "touchmove",
      this.#onMouseMove as CommonEventListener
    );

    document.removeEventListener(
      "mouseup",
      this.#mouseUp as CommonEventListener
    );
    document.removeEventListener(
      "touchend",
      this.#mouseUp as CommonEventListener
    );

    this.gElem.removeEventListener(
      "mousedown",
      this.#onMouseDown as CommonEventListener
    );
    this.gElem.removeEventListener(
      "touchstart",
      this.#onMouseDown as CommonEventListener
    );
  };
}