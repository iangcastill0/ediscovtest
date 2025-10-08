'use strict';

// const https = require("https");
const express = require('express');
// const fs = require('fs');
const path = require('path');
const app = express();
const cors = require("cors");
const session = require('express-session');
const passport = require('passport');
var jwt = require("jsonwebtoken");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const config = require("./config/auth.config");
const appConfig = require("./config/app.config");
const db = require("./models");
const http = require('http');
const socketIo = require('socket.io');
const User = db.user;

require('./models/db');
require('./cronJob');
require('./archiveCronJob');

const authRouter = require('./routes/auth');
const slackRouter = require('./routes/slack');
const ms365Router = require('./routes/ms365');
const googleRouter = require('./routes/google');
const dropboxRouter = require('./routes/dropbox');
const archiveRouter = require('./routes/archive');
const billingRouter = require('./routes/billing');
const adminRouter = require('./routes/admin');
const userRouter = require('./routes/user');
const cdsecureRouter = require('./routes/cdsecure');
const inviteRouter = require('./routes/invites');
const flaggedRouter = require('./routes/flagged');
const supportRouter = require('./routes/support');
const boxRouter = require('./routes/box');

app.use(cors({ origin: '*' }));
app.use(session({
    maxAge: 24 * 60 * 60 * 1000,  // One day in milliseconds
    secret: config.secret,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));
app.use(function (req, res, next) {
    res.header(
        "Access-Control-Allow-Headers",
        "x-access-token, Origin, Content-Type, Accept"
    );
    next();
});

app.use('/api', authRouter);
app.use('/api', slackRouter);
app.use('/api', ms365Router);
app.use('/api', googleRouter);
app.use('/api', dropboxRouter);
app.use('/api', boxRouter);
app.use('/api', archiveRouter);
app.use('/api', billingRouter);
app.use('/api', adminRouter);
app.use('/api', userRouter);
app.use('/api', cdsecureRouter);
app.use('/api', inviteRouter);
app.use('/api', flaggedRouter);
app.use('/api', supportRouter);
app.get('/download/:baseId/:itemId/:filename', (req, res) => {
    const baseId = req.params.baseId;
    const itemId = req.params.itemId;
    const filename = req.params.filename;
    const directoryPath = path.join(__dirname, 'download', baseId, itemId);
    const filePath = path.join(directoryPath, filename);

    res.download(filePath, filename, (err) => {
        if (err) {
            console.log(err);
            res.status(500).send('Error downloading the file.');
        }
    });
});


//Google Auth
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: config.G_CLIENT_ID,
    clientSecret: config.G_CLIENT_SECRET,
    callbackURL: `${appConfig.SITE_URL}/auth/google/callback`,
}, (accessToken, refreshToken, profile, done) => {
    done(null, profile);
}));

app.get('/auth/google', passport.authenticate('google', {
    scope: ['email']
}));

app.get('/auth/google/callback', passport.authenticate('google'), async (req, res) => {
    console.log("Google User: ", req.user);
    // res.redirect('/profile');
    const email = req.user.emails[0].value;
    console.log("Email: ", email);
    const existUser = await User.findOne({email});
    if (existUser) {
        const token = jwt.sign({ id: existUser._id }, config.secret, {
            expiresIn: 86400 // 24 hours
        });

        res.redirect(`/login?serviceToken=${token}`);
        return;
    }

    const user = new User({
        email,
        isGoogleAuth: true,
    });

    try {
        await user.save();
        console.log("Created User from gmail: ", user);
        const token = jwt.sign({ id: user._id }, config.secret, {
            expiresIn: 86400 // 24 hours
        });

        res.redirect(`/login?serviceToken=${token}`);
    } catch (error) {
        res.redirect('/login');
        return;
    }
});

app.use((req, res, next) => {
    if (/(.ico|.js|.css|.jpg|.png|.map|.svg|.ttf)$/i.test(req.path)) {
        next();
    } else {
        res.header('Expires', '-1');
        res.sendFile(path.join(__dirname, '../build', 'index.html'));
    }
});
app.use(express.static(path.join(__dirname, '../build')));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/download', express.static('download'));
const PORT = process.env.PORT || 8000;



const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: appConfig.SERVER_NAME || "https://completediscovery.com",
    methods: ["GET", "POST"]
  }
});


app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});