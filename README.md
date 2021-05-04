![npm](https://img.shields.io/npm/dt/db-viewer-component.svg)
![NPM](https://img.shields.io/npm/l/db-viewer-component.svg)
![npm](https://img.shields.io/npm/v/db-viewer-component.svg)
![CI](https://github.com/ayeressian/db-viewer-component/workflows/CI/badge.svg)

# db-viewer-component

Database schema viewer web component. This web component can be used to view interactive database diagrams.
See an [example](https://stackblitz.com/edit/db-viewer-component-simple-example).

Note: This component doesn't work on old browsers that don't support web components.

### Usage
In the case of webpack, import the package in your main js file.
```javascript
import 'db-viewer-component';
```
in html:
```html
<db-viewer src="/awesome-schema.json"></db-viewer>
```
The schema for viewer can be specified either with src attribute as shown above or by schema property of db-viwer html object like this:

```javascript
document.querySelector('db-viewer').schema = awesomeSchema;
```
The json schema for db-veiwer schema can be found [here](https://raw.githubusercontent.com/ayeressian/db-viewer-component/v4.4.7/src/validation-schema.json). An example of schema can be found [here](https://raw.githubusercontent.com/ayeressian/db-viewer-component/v4.4.7/example/schema/school.json).

A simple usage example can be found [here](https://stackblitz.com/edit/db-viewer-component-simple-example).
An example usage with the React can be found [here](https://stackblitz.com/edit/db-viewer-component-react-example). An example usage with the Svelte can be found [here](https://codesandbox.io/s/white-fast-uvdk2).

### API
#### Attributes
Name | Description
--- | ---
`src` | Viewer-schema url. It should follow [this](https://raw.githubusercontent.com/ayeressian/db-viewer-component/v4.4.7/src/validation-schema.json) json schema. An example of schema can be found [here](https://raw.githubusercontent.com/ayeressian/db-viewer-component/v4.4.7/example/schema/school.json).
`disable-table-movement` | If this attribute exist. Table movement will be disabled.
`viewport` | Viewport positioning strategy on initial load. Can be "noChange", "centerByTablesWeight", "center" or "centerByTables".
#### Events
Name | Description | event.detail
--- | --- | ---
`tableClick` | Clicking on a table. | {tableName, pos: {x, y}, width, height}
`tableDblClick` | Double clicking on a table. | {tableName, pos: {x, y}, width, height}
`tableContextMenu` | Right clicking on a table. | {tableName, pos: {x, y}, width, height}
`tableMove` | Moving table. | {tableName, pos: {x, y}, width, height}
`tableMoveEnd` | Moving table ends. | {tableName, pos: {x, y}, width, height}
`relationClick` | Clicking on a relation. | {fromTable, toTable, fromColumn, toColumn}
`relationDblClick` | Double clicking in a relation. | {fromTable, toTable, fromColumn, toColumn}
`relationContextMenu` | Right clikc on a realtion. | {fromTable, toTable, fromColumn, toColumn}
`zoomIn` | Zooming in view |
`zoomOut` | Zooming out view |
`load` | Schema file has been successfully fetched from server. |
`ready` | Db viewer component has been loaded. |
`viewportClick` | Clicking on the viewport. | {x, y}
#### Properties
Name | Description
--- | ---
`schema` | Get and set schema for viewer. This will override the html src attribute. Note: src attribute accepts the address of viewer-schema and schema property accepts javascript object as viewer-schema. The viwer-schema should follow [this](https://raw.githubusercontent.com/ayeressian/db-viewer-component/v4.4.7/src/validation-schema.json) json schema. Note the only way that db-viewer can alter the schema is by adding position of tables.
`src` | Set viewer-schema url. It should follow [this](https://raw.githubusercontent.com/ayeressian/db-viewer-component/v4.4.7/src/validation-schema.json) json schema. An example of schema can be found [here](https://raw.githubusercontent.com/ayeressian/db-viewer-component/v4.4.7/example/schema/school.json). It has the same effect as the src attribute.
`scrollLeft` | Get and set scrolling position from left.
`scrollTop` | Get and set scrolling position from top.
`disableTableMovement` | Disables table movement if true.
`viewport` | Viewport positioning strategy on initial load. Can be "noChange", "centerByTablesWeight", "center" or "centerByTables".
#### Methods
Name | Description | Arguments
--- | --- | ---
`getTablePos` | Get position of table. | table name
`setTablePos` | Set position of table. | table name, x cord, y cord
`zoomIn` | Zoom in view. |
`zoomOut` | Zoom out view. |
`getZoom` | Get amount of zoom |
#### Styles
Styles can be applied by the following CSS variables.
Name | Description
--- | ---
`--table-boarder-color` | Table border color
`--viewer-background-color` | Viewer background color
`--relation-color` | Relation color |
`--relation-color-highlight` | Relation color on mouse hover
`--font-family` | Font
`--color` | Text color

### To run
  1. yarn
  2. yarn start
  3. Navigate to http://localhost:9998
