const express = require('express');
const route = express.Router();
const controller = require('../controller/control')

route.get('/emailContent/:fromMail',controller.getEmailsHandler);
route.get('/emailBySubject/:fromSubject',controller.getSubjectMailsHandler);

module.exports = route;