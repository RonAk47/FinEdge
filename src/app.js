const express = require('express');
const requestLogger = require('./middleware/requestLogger');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

app.use(express.json());
app.use(requestLogger);

app.use('/api', routes);

// Order matters: notFound catches unmatched routes, errorHandler is always last.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
