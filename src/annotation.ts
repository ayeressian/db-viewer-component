import constant from "./const";
import { AnnotationSchema } from "./types/schema";

export default class Annotation {
  constructor(private schema: AnnotationSchema) {}

  render(): SVGGraphicsElement {
    const elem = document.createElementNS(
      constant.nsSvg,
      "rect"
    ) as SVGGraphicsElement;
    elem.setAttributeNS(null, "x", (this.schema.pos?.x ?? 0).toString());
    elem.setAttributeNS(null, "y", (this.schema.pos?.y ?? 0).toString());
    elem.setAttributeNS(null, "width", this.schema.width.toString());
    elem.setAttributeNS(null, "height", this.schema.height.toString());
    elem.classList.add("annotation");
    return elem;
  }
}
