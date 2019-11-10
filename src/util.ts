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
