document.addEventListener('DOMContentLoaded', () => {
  const dbViewerElem = document.querySelector('db-viewer');
  dbViewerElem.scrollLeft = 50;
  dbViewerElem.scrollTop = 200;

  console.log(dbViewerElem.getZoom());
  dbViewerElem.zoomIn();
  dbViewerElem.zoomIn();
  dbViewerElem.zoomIn();
  console.log(dbViewerElem.getZoom());
  dbViewerElem.addEventListener('tableClick', (event) => console.log('tableClick', event.detail));
  dbViewerElem.addEventListener('tableDblClick', (event) => console.log('tableDblClick', event.detail));
  dbViewerElem.addEventListener('contextMenu', (event) => console.log('contextMenu', event.detail));
  dbViewerElem.addEventListener('tableMove', (event) => console.log('tableMove', event.detail));
}, false);
