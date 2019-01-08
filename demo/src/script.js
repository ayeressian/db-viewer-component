import 'db-viewer-component';
import schema from '../schema/school.json';

const dbDesigner = document.querySelector('db-designer');
dbDesigner.schema = schema;