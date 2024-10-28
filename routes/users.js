var express = require('express');
var router = express.Router();

const User = require('../models/users');
const { checkBody } = require('../modules/checkBody');
const uid2 = require('uid2');
const bcrypt = require('bcrypt');

// Signup route
router.post('/signup', (req, res) => {
    if (!checkBody(req.body, ['username', 'email', 'password','retypePassword'])) {
        res.json({ result: false, error: 'Missing or empty fields' });
        return;
    }
    if (req.body.password!== req.body.retypePassword) {
        res.json({ result: false, error: 'Passwords do not match' });
        return;
    }
    User.findOne({ email: req.body.email })
    .then(data => {
        if (data === null) {
            const hash = bcrypt.hashSync(req.body.password, 10);

            const newUser = new User({
                name: req.body.name,
                username: req.body.username,
                email: req.body.email,
                password: hash,
                token: uid2(32)
            });

            newUser.save()
                .then(newDoc => {
                    res.json({ result: true, token: newDoc.token });
                })
                .catch(error => {
                    res.json({ result: false, error: 'Error saving user' });
                });
        } else {
            res.json({ result: false, error: 'User already exists' });
        }
    })
    .catch(error => {
        res.json({ result: false, error: 'Database error' });
    });
});

// Signin route
router.post('/signin', (req, res) => {
    if (!checkBody(req.body, ['email', 'password'])) {
        res.json({ result: false, error: 'Missing or empty fields' });
        return;
    }

    User.findOne({ email: req.body.email })
    .then(data => {
        if (data && bcrypt.compareSync(req.body.password, data.password)) {
            res.json({ result: true, token: data.token, username: data.username });
        } else {
            res.json({ result: false, error: 'User not found or wrong password' });
        }
    })
    .catch(error => {
        res.json({ result: false, error: 'Database error' });
    });
});

module.exports = router;
