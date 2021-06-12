import constant from "./const";
import MoveEvents from "./move-events";
import Point from "./types/point";
import { AnnotationSchema } from "./types/schema";
import Viewer from "./viewer";

class Annotation {
  #annotationSchema: AnnotationSchema;
  #gElem!: SVGGraphicsElement;
  #foreignObject!: Element;
  #containerElement!: HTMLDivElement;
  #viewer!: Viewer;

  constructor(annotationSchema: AnnotationSchema) {
    this.#annotationSchema = annotationSchema;
    this.render();
  }

  private onMove = () => {
    //TODO
  };

  private onMoveEnd = () => {
    //TODO
  };

  private posValue: Point = {
    x: 0,
    y: 0,
  };

  render(): SVGGraphicsElement {
    this.#gElem = document.createElementNS(
      constant.nsSvg,
      "g"
    ) as SVGGraphicsElement;
    this.#foreignObject = document.createElementNS(
      constant.nsSvg,
      "foreignObject"
    );
    this.#gElem.appendChild(this.#foreignObject);

    this.#containerElement = document.createElementNS(
      constant.nsHtml,
      "div"
    ) as HTMLDivElement;
    this.#containerElement.className = "annotation";

    this.#foreignObject.appendChild(this.#containerElement);

    if (this.#annotationSchema.title) {
      const h1 = document.createElementNS(constant.nsHtml, "h1") as HTMLElement;
      h1.innerHTML = this.#annotationSchema.title;
      this.#containerElement.appendChild(h1);
    }

    if (this.#annotationSchema.text) {
      const textPar = document.createElementNS(
        constant.nsHtml,
        "p"
      ) as HTMLParagraphElement;
      textPar.innerHTML = this.#annotationSchema.text;
      this.#containerElement.appendChild(textPar);
    }

    new MoveEvents(
      this.#viewer,
      this,
      this.#containerElement,
      this.#foreignObject,
      false,
      this.#gElem,
      this.onMove,
      this.onMoveEnd,
      (posValue: Point) => (this.posValue = posValue),
      () => this.posValue as Point
    );

    return this.#gElem;
  }

  setVeiwer(veiwer: Viewer): void {
    this.#viewer = veiwer;
  }

  addedToView(): void {
    const computedStyle = getComputedStyle(this.#containerElement);
    let borderWidth =
      parseInt(computedStyle.borderLeftWidth, 10) +
      parseInt(computedStyle.borderRightWidth, 10);
    let borderHeight =
      parseInt(computedStyle.borderTopWidth, 10) +
      parseInt(computedStyle.borderBottomWidth, 10);
    borderWidth = isNaN(borderWidth) ? 0 : borderWidth;
    borderHeight = isNaN(borderHeight) ? 0 : borderHeight;
    this.#foreignObject.setAttributeNS(
      null,
      "width",
      (this.#containerElement.scrollWidth + borderWidth).toString()
    );
    this.#foreignObject.setAttributeNS(
      null,
      "height",
      (this.#containerElement.scrollHeight + borderHeight).toString()
    );
  }
}

export default Annotation;
