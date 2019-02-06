document.addEventListener('DOMContentLoaded', () => {
  const dbViewerElem = document.querySelector('db-viewer');
  dbViewerElem.addEventListener('ready', () => {
    // dbViewerElem.scrollLeft = 1000;
    // dbViewerElem.scrollTop = 1000;

    // // dbViewerElem.zoomIn();
    // // dbViewerElem.zoomIn();
  });

  dbViewerElem.addEventListener('load', () => {
    dbViewerElem.setTablePos('school', 0, 0);
    console.log(dbViewerElem.getTableInfo('school'));
    console.log(dbViewerElem.schema);
  });

  dbViewerElem.src = '/example/schema/school.json';

  dbViewerElem.addEventListener('tableClick', (event) => console.log('tableClick', event.detail));
  dbViewerElem.addEventListener('tableDblClick', (event) => console.log('tableDblClick', event.detail));
  dbViewerElem.addEventListener('tableContextMenu', (event) => console.log('tableContextMenu', event.detail));
  dbViewerElem.addEventListener('tableMove', (event) => console.log('tableMove', event.detail));
  dbViewerElem.addEventListener('zoomIn', (event) => console.log('zoomIn', event.detail));
  dbViewerElem.addEventListener('zoomOut', (event) => console.log('zoomOut', event.detail));
  dbViewerElem.addEventListener('scroll', (event) => console.log('scroll', event.detail));
}, false);
