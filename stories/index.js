/* global document, module */
import {
  storiesOf
} from '@storybook/html';

import '../dist/main.js';

import basicHtml from './basic.html';

storiesOf('db-designer', module)
  .add('basic', () => basicHtml);
