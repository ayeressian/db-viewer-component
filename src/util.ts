export const isSafari = /^((?!chrome|android).)*safari/i.test(
  navigator.userAgent
);

export const isChrome =
  navigator.userAgent.includes("Chrome") &&
  navigator.vendor.includes("Google Inc");

export function disableSelection(elem: Element): void {
  elem.setAttribute("unselectable", "on");
  elem.classList.add("unselectable");
}

export function enableSelection(elem: Element): void {
  elem.removeAttribute("unselectable");
  elem.classList.remove("unselectable");
}

export const isTouchEvent = (event: MouseEvent | TouchEvent): boolean => {
  const type = event.type;
  return (
    type === "touchstart" ||
    type === "touchmove" ||
    type === "touchend" ||
    type === "touchcancel"
  );
};

export function normalizeEvent(
  event: MouseEvent | TouchEvent
): {
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
} {
  let result: {
    clientX: number;
    clientY: number;
    pageX: number;
    pageY: number;
  };
  if (isTouchEvent(event)) {
    const touch = (event as TouchEvent).touches[0];
    result = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      pageX: touch.pageX,
      pageY: touch.pageY,
    };
  } else {
    result = {
      clientX: (event as MouseEvent).clientX,
      clientY: (event as MouseEvent).clientY,
      pageX: (event as MouseEvent).pageX,
      pageY: (event as MouseEvent).pageY,
    };
  }
  return result;
}
