const path = require('path');
const FileRepository = require('./FileRepository');

module.exports = new FileRepository(
  path.join(__dirname, '../../data/budgets.json')
);
