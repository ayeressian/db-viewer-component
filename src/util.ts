export function isSafari(): boolean {
  return navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Chrome') === -1;
}

export function isChrome(): boolean {
  return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
}

export function disableSelection(elem: Element) {
  elem.setAttribute('unselectable', 'on');
  elem.classList.add('unselectable');
}

export function enableSelection(elem: Element) {
  elem.removeAttribute('unselectable');
  elem.classList.remove('unselectable');
}

export const isTouchEvent = (event: MouseEvent | TouchEvent) => {
  const type = event.type;
  return type === 'touchstart' ||
      type === 'touchmove' ||
      type === 'touchend' ||
      type === 'touchcancel';
};

export function normalizeEvent(event: MouseEvent | TouchEvent) {
  let result: {clientX: number; clientY: number, pageX: number; pageY: number; };
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
