const Imap = require('imap');
const { simpleParser } = require('mailparser');
const moment = require('moment');
const { promisify } = require('util');

const emailConfig = {
    user: 'arulk1535@gmail.com',
    password: 'krusqtvqowqauoxh',
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false } // Ignore certificate validation
};

const openInbox = promisify(function (imap, callback) {
    imap.openBox('INBOX', false, callback);
});

const getEmails = async (req, res) => {
    const fromMail = req.params.fromMail;
    const imap = new Imap(emailConfig);
    let responseSent = false;
    
    imap.once('error', (err) => {
        console.error('IMAP connection error:', err);
        imap.end();
        if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: err.message });
        }
    });

    imap.once('end', () => {
        console.log('IMAP connection ended');
    });

    imap.once('ready', async () => {
        try {
            await openInbox(imap);
            const searchCriteria = [
                ['ALL'],
                ['SINCE', moment().subtract(5, 'days').format('YYYY-MM-DD')],
                ['from', fromMail]
            ];

            const results = await promisify(imap.search).bind(imap)(searchCriteria);

            if (results.length === 0) {
                console.log('No unread emails found.');
                imap.end();
                if (!responseSent) {
                    responseSent = true;
                    res.status(404).json({ message: 'No emails found.' });
                }
                return;
            }

            const fetchOptions = {
                bodies: "",
                markSeen: false,
                uids: true
            };

            const emails = [];

            const fetch = imap.fetch(results, fetchOptions);
            fetch.on('message', (msg, seqno) => {
                msg.on('body', (stream, info) => {
                    simpleParser(stream, async (parseErr, parsed) => {
                        if (parseErr) {
                            console.error('Error parsing email:', parseErr);
                            if (!responseSent) {
                                responseSent = true;
                                res.status(500).json({ message: parseErr.message });
                            }
                            return;
                        }

                        emails.push({
                            uids: seqno,
                            from: parsed.from && parsed.from.text ? parsed.from.text : ' from email is not found',
                            subject: parsed.subject ? parsed.subject : 'subject is not found!!',
                            text: parsed.text ? parsed.text : 'text is not found'
                        });
                    });
                });
            });

            fetch.once('error', (err) => {
                imap.end();
                if (!responseSent) {
                    responseSent = true;
                    res.status(200).json({ error: err.message });
                }
            });

            fetch.once('end', () => {
                imap.end();
                if (!responseSent) {
                    responseSent = true;
                    res.status(200).json({ emails, len: emails.length });
                }
            });
        } catch (error) {
            console.error('Error:', error);
            if (!responseSent) {
                responseSent = true;
                res.status(500).json({ message: error.message });
            }
        }
    });

    imap.connect();
};

const getSubjectMails = async (req, res) => {
    const fromSubject = req.params.fromSubject;
    const imap = new Imap(emailConfig);
    let responseSent = false;

    imap.once('error', (err) => {
        console.error('IMAP connection error:', err);
        imap.end();
        if (!responseSent) {
            responseSent = true;
            res.status(500).json({ message: err.message });
        }
    });

    imap.once('end', () => {
        console.log('IMAP connection ended');
    });

    imap.once('ready', async () => {
        try {
            await openInbox(imap);
            const searchCriteria = [
                ['ALL'],
                ['SINCE', moment().subtract(5, 'days').format('YYYY-MM-DD')],
                ['SUBJECT', fromSubject]
            ];

            const results = await promisify(imap.search).bind(imap)(searchCriteria);

            if (results.length === 0) {
                console.log('No unread emails found.');
                imap.end();
                if (!responseSent) {
                    responseSent = true;
                    res.status(404).json({ message: 'No emails found.' });
                }
                return;
            }

            const fetchOptions = {
                bodies: "",
                markSeen: false,
                uids: true
            };

            const emails = [];

            const fetch = imap.fetch(results, fetchOptions);
            fetch.on('message', (msg, seqno) => {
                msg.on('body', (stream, info) => {
                    simpleParser(stream, async (parseErr, parsed) => {
                        if (parseErr) {
                            console.error('Error parsing email:', parseErr);
                            if (!responseSent) {
                                responseSent = true;
                                res.status(500).json({ message: parseErr.message });
                            }
                            return;
                        }

                        emails.push({
                            uids: seqno,
                            from: parsed.from && parsed.from.text ? parsed.from.text : ' from email is not found',
                            subject: parsed.subject ? parsed.subject : 'subject is not found!!',
                            text: parsed.text ? parsed.text : 'text is not found'
                        });
                    });
                });
            });

            fetch.once('error', (err) => {
                imap.end();
                if (!responseSent) {
                    responseSent = true;
                    res.status(200).json({ error: err.message });
                }
            });

            fetch.once('end', () => {
                imap.end();
                if (!responseSent) {
                    responseSent = true;
                    res.status(200).json({ emails, len: emails.length });
                }
            });
        } catch (error) {
            console.error('Error:', error);
            if (!responseSent) {
                responseSent = true;
                res.status(500).json({ message: error.message });
            }
        }
    });

    imap.connect();
};

const getEmailsHandler = (req, res) => {
    getEmails(req, res);
};

const getSubjectMailsHandler = (req, res) => {
    getSubjectMails(req, res);
};

module.exports = { getEmailsHandler, getSubjectMailsHandler };
