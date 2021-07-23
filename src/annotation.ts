import constant from "./const";
import MoveEvents from "./move-events";
import Point from "./types/point";
import { AnnotationSchema } from "./types/schema";
import Vertices from "./types/vertices";
import Viewer from "./viewer";

class Annotation {
  #gElem!: SVGGraphicsElement;
  #foreignObject!: SVGForeignObjectElement;
  #annotationElement!: HTMLDivElement;
  #viewer!: Viewer;
  #onMoveCallback!: (
    annotation: Annotation,
    deltaX: number,
    deltaY: number,
    cordinatesChanged: boolean
  ) => void;
  #title?: string;
  #text?: string;
  #posValue: Point;
  #borderLeft!: HTMLDivElement;
  #borderRight!: HTMLDivElement;
  #borderTop!: HTMLDivElement;
  #borderBottom!: HTMLDivElement;
  #borderTopRight!: HTMLDivElement;
  #borderTopLeft!: HTMLDivElement;
  #borderBottomRight!: HTMLDivElement;
  #borderBottomLeft!: HTMLDivElement;
  #containerElem!: HTMLDivElement;
  #width: number;
  #height: number;
  #moveEvents!: MoveEvents;

  constructor({ title, text, pos, width, height }: AnnotationSchema) {
    this.#title = title;
    this.#text = text;
    this.#posValue = pos;
    this.#width = width;
    this.#height = height;
  }

  private onMoveEnd = () => {
    //TODO
  };

  getVertices(): Vertices {
    const bbox = this.#gElem.getBBox();
    return {
      bottomLeft: {
        x: bbox.x,
        y: bbox.y + this.#containerElem.offsetHeight,
      },
      bottomRight: {
        x: bbox.x + this.#containerElem.offsetWidth,
        y: bbox.y + this.#containerElem.offsetHeight,
      },
      topLeft: {
        x: bbox.x,
        y: bbox.y,
      },
      topRight: {
        x: bbox.x + this.#containerElem.offsetWidth,
        y: bbox.y,
      },
    };
  }

  private createBorderElems() {
    this.#borderTopRight = document.createElementNS(
      constant.nsHtml,
      "div"
    ) as HTMLDivElement;
    this.#borderTopRight.classList.add(
      "annotation-border",
      "annotation-top-right"
    );
    this.#containerElem.appendChild(this.#borderTopRight);

    this.#borderTopLeft = document.createElementNS(
      constant.nsHtml,
      "div"
    ) as HTMLDivElement;
    this.#borderTopLeft.classList.add(
      "annotation-border",
      "annotation-top-left"
    );
    this.#containerElem.appendChild(this.#borderTopLeft);

    this.#borderBottomLeft = document.createElementNS(
      constant.nsHtml,
      "div"
    ) as HTMLDivElement;
    this.#borderBottomLeft.classList.add(
      "annotation-border",
      "annotation-bottom-left"
    );
    this.#containerElem.appendChild(this.#borderBottomLeft);

    this.#borderBottomRight = document.createElementNS(
      constant.nsHtml,
      "div"
    ) as HTMLDivElement;
    this.#borderBottomRight.classList.add(
      "annotation-border",
      "annotation-bottom-right"
    );
    this.#containerElem.appendChild(this.#borderBottomRight);

    this.#borderLeft = document.createElementNS(
      constant.nsHtml,
      "div"
    ) as HTMLDivElement;
    this.#borderLeft.classList.add("annotation-border", "annotation-left");
    this.#containerElem.appendChild(this.#borderLeft);

    this.#borderRight = document.createElementNS(
      constant.nsHtml,
      "div"
    ) as HTMLDivElement;
    this.#borderRight.classList.add("annotation-border", "annotation-right");
    this.#containerElem.appendChild(this.#borderRight);

    this.#borderTop = document.createElementNS(
      constant.nsHtml,
      "div"
    ) as HTMLDivElement;
    this.#borderTop.classList.add("annotation-border", "annotation-top");
    this.#containerElem.appendChild(this.#borderTop);

    this.#borderBottom = document.createElementNS(
      constant.nsHtml,
      "div"
    ) as HTMLDivElement;
    this.#borderBottom.classList.add("annotation-border", "annotation-bottom");
    this.#containerElem.appendChild(this.#borderBottom);
  }

  private resizeBottomMove = (
    event: MouseEvent,
    mouseDownInitialElemY: number,
    height: number
  ): void => {
    const normalizedClientY = this.getNormlizeClient(event).clientY;
    const y = normalizedClientY - mouseDownInitialElemY;
    if (this.safeHeightResize(height + y)) {
      this.setSize(this.#width, this.#height);
    }
  };

  private resizeBottomDown = (event: MouseEvent): void => {
    event.stopPropagation();
    event.stopImmediatePropagation();
    const mouseDownInitialElemY = this.getNormlizeClient(event).clientY;

    const height = this.#height;
    const resizeBottomMove = (event: MouseEvent) => {
      this.resizeBottomMove(event, mouseDownInitialElemY, height);
    };
    document.addEventListener("mousemove", resizeBottomMove);

    document.addEventListener("mouseup", () => {
      document.removeEventListener("mousemove", resizeBottomMove);
    });
  };

  private resizeTopMove = (
    event: MouseEvent,
    mouseDownInitialElemY: number,
    initPosY: number,
    height: number
  ): void => {
    const normalizedClientY = this.getNormlizeClient(event).clientY;
    const y = normalizedClientY - mouseDownInitialElemY;
    if (this.safeHeightResize(height - y)) {
      this.setSize(this.#width, this.#height);
      this.#posValue.y = initPosY + y;
      this.#moveEvents.setPos(this.#posValue.x, this.#posValue.y);
    }
  };

  private resizeTopDown = (event: MouseEvent): void => {
    event.stopPropagation();
    event.stopImmediatePropagation();
    const mouseDownInitialElemY = this.getNormlizeClient(event).clientY;

    const initPosY = this.#posValue.y;

    const height = this.#height;
    const resizeTopMove = (event: MouseEvent) => {
      this.resizeTopMove(event, mouseDownInitialElemY, initPosY, height);
    };
    document.addEventListener("mousemove", resizeTopMove);

    document.addEventListener("mouseup", () => {
      document.removeEventListener("mousemove", resizeTopMove);
    });
  };

  private resizeRightMove = (
    event: MouseEvent,
    mouseDownInitialElemX: number,
    width: number
  ): void => {
    const normalizedClientX = this.getNormlizeClient(event).clientX;
    const x = normalizedClientX - mouseDownInitialElemX;
    if (this.safeWidthResize(width + x)) {
      this.setSize(this.#width, this.#height);
    }
  };

  private resizeRightDown = (event: MouseEvent): void => {
    event.stopPropagation();
    event.stopImmediatePropagation();
    const mouseDownInitialElemX = this.getNormlizeClient(event).clientX;

    const width = this.#width;
    const resizeRightMove = (event: MouseEvent) => {
      this.resizeRightMove(event, mouseDownInitialElemX, width);
    };
    document.addEventListener("mousemove", resizeRightMove);

    document.addEventListener("mouseup", () => {
      document.removeEventListener("mousemove", resizeRightMove);
    });
  };

  private resizeLeftMove = (
    event: MouseEvent,
    mouseDownInitialElemX: number,
    initPosX: number,
    width: number
  ): void => {
    const normalizedClientX = this.getNormlizeClient(event).clientX;
    const x = normalizedClientX - mouseDownInitialElemX;
    if (this.safeWidthResize(width - x)) {
      this.setSize(this.#width, this.#height);
      this.#posValue.x = initPosX + x;
      this.#moveEvents.setPos(this.#posValue.x, this.#posValue.y);
    }
  };

  private resizeLeftDown = (event: MouseEvent): void => {
    event.stopPropagation();
    event.stopImmediatePropagation();
    const mouseDownInitialElemX = this.getNormlizeClient(event).clientX;
    const initPosX = this.#posValue.x;

    const width = this.#width;
    const resizeLeftMove = (event: MouseEvent) => {
      this.resizeLeftMove(event, mouseDownInitialElemX, initPosX, width);
    };
    document.addEventListener("mousemove", resizeLeftMove);

    document.addEventListener("mouseup", () => {
      document.removeEventListener("mousemove", resizeLeftMove);
    });
  };

  private getNormlizeClient(event: MouseEvent) {
    const mousePos = this.#viewer.getMousePosRelativeContainer(event);
    const clientX =
      mousePos.x / this.#viewer.getZoom()! +
      this.#viewer.getPan().x / this.#viewer.getZoom();
    const clientY =
      mousePos.y / this.#viewer.getZoom()! +
      this.#viewer.getPan().y / this.#viewer.getZoom();
    return { clientX, clientY };
  }

  private safeHeightResize(newHeight: number): boolean {
    if (newHeight > constant.ANNOTATION_MIN_HEIGHT) {
      this.#height = newHeight;
      return true;
    }
    this.#height = constant.ANNOTATION_MIN_HEIGHT;
    return false;
  }

  private safeWidthResize(newWidth: number): boolean {
    if (newWidth > constant.ANNOTATION_MIN_WIDTH) {
      this.#width = newWidth;
      return true;
    }
    this.#width = constant.ANNOTATION_MIN_WIDTH;
    return false;
  }

  private resize(): void {
    this.#borderRight.addEventListener("mousedown", this.resizeRightDown);
    this.#borderLeft.addEventListener("mousedown", this.resizeLeftDown);
    this.#borderBottom.addEventListener("mousedown", this.resizeBottomDown);
    this.#borderTop.addEventListener("mousedown", this.resizeTopDown);
    this.#borderBottomLeft.addEventListener("mousedown", (event) => {
      this.resizeBottomDown(event);
      this.resizeLeftDown(event);
    });
    this.#borderBottomRight.addEventListener("mousedown", (event) => {
      this.resizeBottomDown(event);
      this.resizeRightDown(event);
    });
    this.#borderTopRight.addEventListener("mousedown", (event) => {
      this.resizeTopDown(event);
      this.resizeRightDown(event);
    });
    this.#borderTopLeft.addEventListener("mousedown", (event) => {
      this.resizeTopDown(event);
      this.resizeLeftDown(event);
    });
  }

  private setSize(width: number, height: number) {
    this.#foreignObject.setAttributeNS(null, "width", width.toString());
    this.#foreignObject.setAttributeNS(null, "height", height.toString());
  }

  render(): SVGGraphicsElement {
    this.#gElem = document.createElementNS(
      constant.nsSvg,
      "g"
    ) as SVGGraphicsElement;
    this.#gElem.classList.add("annotation");
    this.#foreignObject = document.createElementNS(
      constant.nsSvg,
      "foreignObject"
    ) as SVGForeignObjectElement;
    this.setSize(this.#width, this.#height);
    this.#gElem.appendChild(this.#foreignObject);

    this.#containerElem = document.createElementNS(
      constant.nsHtml,
      "div"
    ) as HTMLDivElement;
    this.#containerElem.classList.add("annotation-container");
    this.#foreignObject.appendChild(this.#containerElem);

    this.createBorderElems();
    this.resize();

    this.#annotationElement = document.createElementNS(
      constant.nsHtml,
      "div"
    ) as HTMLDivElement;
    this.#annotationElement.className = "annotation";

    this.#containerElem.appendChild(this.#annotationElement);

    if (this.#title) {
      const h1 = document.createElementNS(constant.nsHtml, "h1") as HTMLElement;
      h1.innerHTML = this.#title;
      this.#annotationElement.appendChild(h1);
    }

    if (this.#text) {
      const textPar = document.createElementNS(
        constant.nsHtml,
        "p"
      ) as HTMLParagraphElement;
      textPar.innerHTML = this.#text;
      this.#annotationElement.appendChild(textPar);
    }

    this.#moveEvents = new MoveEvents(
      this.#viewer,
      this,
      this.#containerElem,
      this.#foreignObject,
      false,
      this.#gElem,
      (_, x, y) => {
        this.#onMoveCallback(this, x, y, false);
      },
      this.onMoveEnd,
      (posValue: Point) => (this.#posValue = posValue),
      () => this.#posValue as Point
    );
    this.#moveEvents.setPos(this.#posValue.x, this.#posValue.y);

    return this.#gElem;
  }

  data(): AnnotationSchema {
    return {
      pos: this.#posValue,
      title: this.#title,
      text: this.#text,
      width: 200,
      height: 200,
    };
  }

  setViewer(
    viewer: Viewer,
    onMoveCallback: (
      annotation: Annotation,
      deltaX: number,
      deltaY: number,
      cordinatesChanged: boolean
    ) => void
  ): void {
    this.#viewer = viewer;
    this.#onMoveCallback = onMoveCallback;
  }
}

export default Annotation;
