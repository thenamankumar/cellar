const express = require('express');
const statusController = require('./controllers/status');
const killController = require('./controllers/kill');
const getController = require('./controllers/get');
const setController = require('./controllers/set');
const removeController = require('./controllers/remove');

const router = express.Router();

router.route('/status').get(statusController);

router.route('/kill').post(killController);

router.route('/get').post(getController);
router.route('/set').post(setController);
router.route('/remove').post(removeController);

module.exports = router;
