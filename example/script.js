document.addEventListener('DOMContentLoaded', () => {
  const dbViewerElem = document.querySelector('db-viewer');
  dbViewerElem.addEventListener('ready', () => {
    dbViewerElem.scrollLeft = 50;
    dbViewerElem.scrollTop = 200;

    dbViewerElem.zoomIn();
    dbViewerElem.zoomIn();

    dbViewerElem.setTablePos('school', 0, 0);
    console.log(dbViewerElem.getTablePos('school'));
  });

  dbViewerElem.addEventListener('tableClick', (event) => console.log('tableClick', event.detail));
  dbViewerElem.addEventListener('tableDblClick', (event) => console.log('tableDblClick', event.detail));
  dbViewerElem.addEventListener('contextMenu', (event) => console.log('tableContextMenu', event.detail));
  dbViewerElem.addEventListener('tableMove', (event) => console.log('tableMove', event.detail));
  dbViewerElem.addEventListener('zoomIn', (event) => console.log('zoomIn'));
  dbViewerElem.addEventListener('zoomOut', (event) => console.log('zoomOut'));
}, false);
