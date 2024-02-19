const express = require('express');
const route = express.Router();
const controller = require('../controller/control')

route.get('/emailContent',controller.email);

module.exports = route;