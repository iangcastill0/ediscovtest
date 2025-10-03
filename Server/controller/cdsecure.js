const config = require("../config/app.config");
const User = require("../models/user");
const CDSecureToken = require('../models/cdsecuretoken');
const adminController = require("./admin")

exports.storeToken = async (req, res) => {
  const {userId, token} = req.body;
  console.log("CDSECURE-TOKE: ", userId, token)
  const cdtoken = await CDSecureToken.findOne({userId, token})
  if (!cdtoken)
    await CDSecureToken.create({userId, token})

  res.json({ok: true})
}

exports.removeToken = async (req, res) => {
  const {userId, token} = req.body;
  console.log("CDSecure Remove Token: ", userId, token)
  await CDSecureToken.deleteOne({userId, token})
  
  res.json({ok: true})
}

exports.configure = async (req, res) => {
  const {userId, enableNotification} = req.body;
  console.log("CDSecure configuration: ", userId, enableNotification)

  await CDSecureToken.updateMany({userId}, {enableNotification: enableNotification})
  
  res.json({ok: true})
}

exports.users = async (req, res) => {
  const {userId, mobile} = req.query;
  const user = await User.findById(userId)
  if (!user || !user.roles.includes('admin') || !mobile)
    return res.json({ok: false, message: 'User is not valid'})
  
 try {
    const users = await adminController.userStats()

    res.json({ ok: true, users });
  } catch (error) {
    console.error('Error in getUsers:', error);
    res.status(500).json({ 
      ok: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
}
