const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");
const admin = require("../controller/admin");
const User = db.user;
const Role = db.role;

checkTrial = async (req, res, next) => {
  const user = await User.findOne({ _id: req.userId });
  if (!user) {
    admin.logActions(req, { actionDetails: 'Access to admin panel', actionResult: 'Failed' });
    res.status(403).send({ message: "User not found!" });
  } else {
    if (user.isSubscribed || !user.isTrialOver || user.roles.includes('admin')) {
      next();
    } else {
      admin.logActions(req, { actionDetails: 'Trial is end', actionResult: 'Failed' });

      return res.status(403).send({
        message: 'Trial ended',
        redirect: '/billing?status=2'
      })
    }
  }
};

verifyTokenOptional = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    // No token, but that's okay. Just proceed.
    return next();
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      // Token is present but invalid, this is an error
      return res.status(401).send({ message: "Unauthorized! Invalid Token." });
    }
    req.userId = decoded.id;
    next();
  });
};

verifyToken = (req, res, next) => {
  let token = req.headers["authorization"] || req.query.token;
  if (!token) {
    admin.logActions(req, { actionType: req.originalUrl, actionDetails: 'No token provided! Dangerous Access!', actionResult: 'Failed' });
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      admin.logActions(req, { actionType: req.originalUrl, actionDetails: 'Invalid token or expired! Dangerous Access!', actionResult: 'Failed' });
      return res.status(401).send({ message: "Unauthorized!" });
    }
    req.userId = decoded.id;
    // return checkTrial(req, res, next)
    next()
  });
};

isAdmin = async (req, res, next) => {
  const user = await User.findOne({ _id: req.userId });
  if (!user) {
    admin.logActions(req, { actionDetails: 'Access to admin panel', actionResult: 'Failed' });
    res.status(403).send({ message: "Require Admin Role!" });
  } else {
    if (user.roles.includes('admin') || user.roles.includes('superadmin')) {
      next();
    } else {
      admin.logActions(req, { actionDetails: 'Invalid token or expired! Dangerous Access!', actionResult: 'Failed' });
      res.status(403).send({ message: "Require Admin Role!" });
    }
  }
};

isModerator = (req, res, next) => {
  User.findById(req.userId).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    Role.find(
      {
        _id: { $in: user.roles }
      },
      (err, roles) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        for (let i = 0; i < roles.length; i++) {
          if (roles[i].name === "moderator") {
            next();
            return;
          }
        }

        res.status(403).send({ message: "Require Moderator Role!" });
        return;
      }
    );
  });
};

const authJwt = {
  verifyToken,
  verifyTokenOptional,
  isAdmin,
  isModerator,
  checkTrial
};
module.exports = authJwt;
