const path = require('path');
const config = require('../config');
const FileRepository = require('./FileRepository');

module.exports = new FileRepository(path.join(config.dataDir, 'users.json'));
