export function isSafari(): boolean {
  return navigator.userAgent.includes('Safari') && navigator.userAgent.includes('Chrome');
}

export function isChrome(): boolean {
  return navigator.userAgent.includes('Chrome') && navigator.vendor.includes('Google Inc');
}

export function disableSelection(elem: Element): void {
  elem.setAttribute('unselectable', 'on');
  elem.classList.add('unselectable');
}

export function enableSelection(elem: Element): void {
  elem.removeAttribute('unselectable');
  elem.classList.remove('unselectable');
}
