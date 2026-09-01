const app = require('./app');
const config = require('./config');

app.listen(config.port, () => {
  console.log(`FinEdge API listening on port ${config.port} [${config.nodeEnv}]`);
});
