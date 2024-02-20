const express = require('express');
const route = express.Router();
const controller = require('../controller/control')

route.get('/emailContent/:fromMail',controller.email);
route.get('/emailBySubject/:fromSubject',controller.subject);

module.exports = route;