# db-viewer-component

Implementation of database viewer web component.
See the [demo](https://ayeressian.github.io/db-viewer-component/).
Note: This component doesn't work in Edge browser, since Edge browser doesn't have native support for web component.

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
The json schema for db-veiwer schema can be found [here](https://github.com/ayeressian/db-viewer-component/blob/new-events-methods/src/validation-schema.json).

### API
#### Attributes
Name | Description
--- | ---
`src` | Viewer-schema url. It should follow [this](https://github.com/ayeressian/db-viewer-component/blob/new-events-methods/src/validation-schema.json) json schema.
#### Events
Name | Description | event.detail
--- | --- | ---
`tableClick` | Clicking on a table. | {tableName, pos: {x, y}, width, height}
`tableDblClick` | Double clicking on a table. | {tableName, pos: {x, y}, width, height}
`tableContextMenu` | Right clicking on a table. | {tableName, pos: {x, y}, width, height}
`tableMove` | Moving table. | {tableName, pos: {x, y}, width, height}
`tableMoveEnd` | Moving table ends. | {tableName, pos: {x, y}, width, height}
`zoomIn` | Zooming in view |
`zoomOut` | Zooming out view |
`load` | Schema file has been successfully fetched from server. |
`ready` | Db viewer component has been loaded. |
`viewportClick` | Clicking on the viewport. | {x, y}
#### Properties
Name | Description
--- | ---
`schema` | Get and set schema for viewer. This will override the html src attribute. Note: src attribute accepts the address of viewer-schema and schema property accepts javascript object as viewer-schema. The viwer-schema should follow [this](https://github.com/ayeressian/db-viewer-component/blob/new-events-methods/src/validation-schema.json) json schema. Note the only way that db-viewer can alter the schema is by adding position of tables.
`src` | Set viewer-schema url. It should follow [this](https://github.com/ayeressian/db-viewer-component/blob/new-events-methods/src/validation-schema.json) json schema. It has the same effect as the src attribute.
`scrollLeft` | Get and set scrolling position from left.
`scrollTop` | Get and set scrolling position from top.
#### Methods
Name | Description | Arguments
--- | --- | ---
`getTablePos` | Get position of table. | table name
`setTablePos` | Set position of table. | table name, x cord, y cord
`zoomIn` | Zoom in view. |
`zoomOut` | Zoom out view. |
`getZoom` | Get amount of zoom |

### To run
  1. npm i
  2. npm start
  3. Navigate to http://localhost:9998
