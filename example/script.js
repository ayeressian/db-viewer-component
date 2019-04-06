const schoolDbSetup = () => {
  const dbViewerSchoolElem = document.querySelector('#school-db');
  dbViewerSchoolElem.addEventListener('ready', () => {
    // dbViewerSchoolElem.scrollLeft = 1000;
    // dbViewerSchoolElem.scrollTop = 1000;

    // dbViewerSchoolElem.zoomIn();
    // dbViewerSchoolElem.zoomIn();
  });

  dbViewerSchoolElem.addEventListener('load', () => {
    // dbViewerSchoolElem.setTablePos('school', 0, 0);
    console.log(dbViewerSchoolElem.getTableInfo('school'));
    console.log(dbViewerSchoolElem.schema);
  });

  dbViewerSchoolElem.src = '/example/schema/school.json';

  dbViewerSchoolElem.addEventListener('tableClick', (event) => console.log('tableClick', event.detail));
  dbViewerSchoolElem.addEventListener('tableDblClick', (event) => console.log('tableDblClick', event.detail));
  dbViewerSchoolElem.addEventListener('tableContextMenu', (event) => console.log('tableContextMenu', event.detail));
  dbViewerSchoolElem.addEventListener('tableMove', (event) => console.log('tableMove', event.detail));
  dbViewerSchoolElem.addEventListener('tableMoveEnd', (event) => console.log('tableMoveEnd', event.detail));
  dbViewerSchoolElem.addEventListener('zoomIn', (event) => console.log('zoomIn', event.detail));
  dbViewerSchoolElem.addEventListener('zoomOut', (event) => console.log('zoomOut', event.detail));
  dbViewerSchoolElem.addEventListener('scroll', (event) => console.log('scroll', event.detail));
};

document.addEventListener('DOMContentLoaded', () => {
  schoolDbSetup();
}, false);
