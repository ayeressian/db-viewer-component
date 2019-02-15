import 'db-viewer-component';
import schema from '../schema/school.json';

const dbViewer = document.querySelector('db-viewer');
dbViewer.addEventListener('ready', () => {
  dbViewer.schema = schema;
});
