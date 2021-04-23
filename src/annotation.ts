import constant from "./const";
import { AnnotationSchema } from "./types/schema";

class Annotation {
  #annotationSchema: AnnotationSchema;
  #elem!: SVGGraphicsElement;
  #foreignObject!: Element;
  #containerElement!: HTMLDivElement;

  constructor(annotationSchema: AnnotationSchema) {
    this.#annotationSchema = annotationSchema;
    this.render();
  }

  render(): SVGGraphicsElement {
    this.#elem = document.createElementNS(
      constant.nsSvg,
      "g"
    ) as SVGGraphicsElement;
    this.#foreignObject = document.createElementNS(
      constant.nsSvg,
      "foreignObject"
    );
    this.#elem.appendChild(this.#foreignObject);

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
    return this.#elem;
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
