import constant from "./const";

function createG(): SVGGElement {
  const gElem = document.createElementNS(constant.nsSvg, "g");
  return gElem as SVGGElement;
}

function createFo(gElem: SVGGElement): SVGForeignObjectElement {
  const foreignObject = document.createElementNS(
    constant.nsSvg,
    "foreignObject"
  );
  gElem.appendChild(foreignObject);
  return foreignObject as SVGForeignObjectElement;
}

export default function gWithFo(): {
  g: SVGGElement;
  foreignObject: SVGForeignObjectElement;
} {
  const g = createG();
  const foreignObject = createFo(g);
  return { g, foreignObject };
}
