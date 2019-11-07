const context = require.context('.', true, /\.test\.ts$/);

context.keys().forEach(context);

module.exports = context;
