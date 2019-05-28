export function isSafari() {
  return navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Chrome') === -1;
}

export function isChrome() {
  return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
}

export function disableSelection(elem) {
  elem.setAttribute('unselectable', 'on');
  elem.classList.add('unselectable');
}

export function enableSelection(elem) {
  elem.removeAttribute('unselectable');
  elem.classList.remove('unselectable');
}

export function isRetinaDisplay() {
  if (window.matchMedia) {
      const mq = window.matchMedia(
        'only screen and (min--moz-device-pixel-ratio: 1.3),' +
        ' only screen and (-o-min-device-pixel-ratio: 2.6/2),' +
        ' only screen and (-webkit-min-device-pixel-ratio: 1.3),' +
        ' only screen  and (min-device-pixel-ratio: 1.3),' +
        ' only screen and (min-resolution: 1.3dppx)');
      return (mq && mq.matches || (window.devicePixelRatio > 1));
  }
}


export function isHighDensity() {
  return ((window.matchMedia &&
    (
      window.matchMedia(
      'only screen and (min-resolution: 124dpi),' +
      ' only screen and (min-resolution: 1.3dppx),' +
      ' only screen and (min-resolution: 48.8dpcm)').matches ||
      window.matchMedia('only screen and (-webkit-min-device-pixel-ratio: 1.3),' +
      ' only screen and (-o-min-device-pixel-ratio: 2.6/2),' +
      ' only screen and (min--moz-device-pixel-ratio: 1.3),' +
      ' only screen and (min-device-pixel-ratio: 1.3)').matches)) || (window.devicePixelRatio && window.devicePixelRatio > 1.3));
}
