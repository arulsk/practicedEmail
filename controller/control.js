const Imap = require('imap');
const { simpleParser } = require('mailparser');
const moment = require('moment');

const emailConfig = {
    user: '',
    password: '',
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false } // Ignore certificate validation
};

const getEmails = (res) => {
    const imap = new Imap(emailConfig);
    let responseSent = false; // Flag to track if response has been sent

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

    imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
            if (err) {
                console.error('Error opening INBOX:', err);
                imap.end();
                if (!responseSent) {
                    responseSent = true;
                    res.status(500).json({ message: err.message });
                }
                return;
            }

            const searchCriteria = [
                ['ALL'],
                ['SINCE', moment().subtract(20, 'days').format('YYYY-MM-DD')],
                ['from', 'rohit104529@gmail.com']
            ];
            

            imap.search(searchCriteria, (searchErr, results) => {
                if (searchErr) {
                    console.error('Error searching emails:', searchErr);
                    imap.end();
                    if (!responseSent) {
                        responseSent = true;
                        res.status(500).json({ message: searchErr.message });
                    }
                    return;
                }

                if (results.length === 0) {
                    console.log('No unread emails found.');
                    imap.end();
                    if (!responseSent) {
                        responseSent = true;
                        res.status(404).json({ message: 'No unread emails found.' });
                    }
                    return;
                }

                const emails = [];

                const fetchOptions = {
                    bodies: ['HEADER', 'TEXT'],
                    markSeen: false // Mark emails as read after fetching
                };

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
                                from: parsed.from && parsed.from.text ? parsed.from.text : ' from email is not found',
                                subject: parsed.subject ? parsed.subject : 'subject is not found!!',
                                text: parsed.text ? parsed.text : 'text is not found'
                            });
                        });
                    });
                });
                fetch.once('end', () => {
                    imap.end();
                    if (!responseSent) {
                        responseSent = true;
                        res.status(200).json(emails);
                    }
                });
            });
        });
    });

    imap.connect();
};

const email = (req, res) => {
    getEmails(res);
};

module.exports = { email };
