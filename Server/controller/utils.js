const nodemailer = require('nodemailer')
const MailComposer  = require('nodemailer/lib/mail-composer');
const fs = require('fs')
const moment = require('moment')
const path = require('path')
const axios = require('axios')
const crypto = require('crypto')
const { Attachment, Email } = require("../oxmsg/index");
const { mkdir, readdir, stat, access } = require('node:fs/promises')
const config = require('../config/app.config')
const { addIndex, deleteOutlookIndex, deleteOneDriveIndex, deleteGmailIndex, deleteGDriveIndex, deleteFlaggedCollectionsIndex } = require('./ai_search')
const fetch = require('node-fetch')
const { google } = require('googleapis')
const { parse } = require('node-html-parser')
const https = require('https')
const { PassThrough } = require('stream');
const { ObjectId } = require('mongodb');
const { getBucket } = require('../models/db');
const ms365Controller = require('./ms365')
const BackupMessages = require('../models/outlook_msgids_archive')
const ArchiveState = require('../models/archive_state')
const GmailArchive = require('../models/gmail_archive')
const AWS = require('./aws')
const CDSecureToken = require('../models/cdsecuretoken')
const User = require('../models/user')
const InviteUsers = require('../models/invite_users')
const SlackTeam = require('../models/slack_team')
const GoogleWorkspace = require('../models/googleworkspaces')
const GoogleUsers = require('../models/googleusers')
const MS365Workspace = require('../models/ms365workspaces')
const MS365Users = require('../models/ms365users')
const DropboxWorkspace = require('../models/dropboxworkspace')
const DropboxMembers = require('../models/dropboxmembers')
const FileQueue = require('../models/file_queue')

const pdfParse = require('pdf-parse');
const tesseract = require('tesseract.js');
const mime = require('mime-types');
const { extractTextFromDocx, extractTextFromXlsx, extractTextFromCSV, isReadableFileType, googleMimeTypes } = require('../utils')
const CollectionList = require('../models/collection_list')
const BoxWorkspace = require('../models/boxworkspace')
const BoxMember = require('../models/boxmember')

const googleOAuth = new google.auth.OAuth2(
    config.GOOGLE_APP_INFO.CLIENT_ID,
    config.GOOGLE_APP_INFO.CLIENT_SECRET,
    `${config.SITE_URL}/api/google/auth-redirect-test`
);

const mailTransport = nodemailer.createTransport({
    host: 'smtp-mail.outlook.com', // Microsoft's SMTP server domain
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'approvals@ediscoverycloud.com',
        pass: 'WSy-b!28*3!'
    },
    tls: {
        rejectUnauthorized: false
    }
})

const ts2datetime = ts => {
    const timestamp = parseFloat(ts)
    return moment.unix(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

const fetchSlackImageByBase64 = async (imageUrl, token, imagetype) => {
    const response = await axios.get(imageUrl, { headers: { Authorization: `Bearer ${token}` }, responseType: 'arraybuffer' })
    const base64 = btoa(new Uint8Array(response.data).reduce((data, byte) => data + String.fromCharCode(byte), ''))

    // Set Data URL as image src
    return `data:image/${imagetype};base64,${base64}`
}

const fetchSlackImageByBase64FromS3 = async (s3Key, imagetype) => {
    const buffer = await AWS.downloadFileAsBuffer(config.AWS.OUTLOOK_BUCKET, s3Key)
    const base64 = buffer ? btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')) : null

    // Set Data URL as image src
    return `data:image/${imagetype};base64,${base64}`
}

exports.getSlackBase64Images = fetchSlackImageByBase64
exports.fetchSlackImageByBase64FromS3 = fetchSlackImageByBase64FromS3
exports.ts2datetime = ts2datetime

exports.sendMail = async (to, userId, userName, teamName) => {
    let htmlTemplate = fs.readFileSync(path.join(__dirname, '../../public/auth-tempate-mail.html'), 'utf-8')
    htmlTemplate = htmlTemplate.replace('${username}', userName)
    htmlTemplate = htmlTemplate.replace('${teamName}', teamName)

    const url = `https://slack.com/oauth/v2/authorize?state=${userId}&client_id=5258767683554.5510301270178&scope=&user_scope=channels:history,channels:read,groups:history,groups:read,im:history,im:read,mpim:history,mpim:read,users:read,users:read.email,chat:write`
    htmlTemplate = htmlTemplate.replace('https://ediscoverycloud.com', url)

    const mailOptions = {
        from: `approvals@ediscoverycloud.com`,
        to: to,
        subject: `Request of authorization from ${teamName}`,
        html: htmlTemplate,
        attachments: [
            {
                filename: 'image-1.png',
                path: path.join(__dirname, '../../public/images/image-1.png'),
                cid: 'image-1.png'
            },
            {
                filename: 'image-2.png',
                path: path.join(__dirname, '../../public/images/image-2.png'),
                cid: 'image-2.png'
            },
            {
                filename: 'image-3.png',
                path: path.join(__dirname, '../../public/images/image-3.png'),
                cid: 'image-3.png'
            },
            {
                filename: 'image-4.png',
                path: path.join(__dirname, '../../public/images/image-4.png'),
                cid: 'image-4.png'
            },
            {
                filename: 'image-5.jpeg',
                path: path.join(__dirname, '../../public/images/image-5.jpeg'),
                cid: 'image-5.jpeg'
            },
            {
                filename: 'image-6.png',
                path: path.join(__dirname, '../../public/images/image-6.png'),
                cid: 'image-6.png'
            },
            {
                filename: 'image-7.png',
                path: path.join(__dirname, '../../public/images/image-7.png'),
                cid: 'image-7.png'
            },
            {
                filename: 'image-8.jpeg',
                path: path.join(__dirname, '../../public/images/image-8.jpeg'),
                cid: 'image-8.jpeg'
            }
        ]
    }

    try {
        await mailTransport.sendMail(mailOptions)
        console.log('Email sent successfully')
        return true
    } catch (error) {
        console.log('Email sent failed', error)
        return false
    }
}

exports.sendMS365AuthRequest = async (to, userId, userName, teamName) => {
    let htmlTemplate = fs.readFileSync(path.join(__dirname, '../../public/auth-tempate-mail.html'), 'utf-8')
    htmlTemplate = htmlTemplate.replace('${username}', userName)
    htmlTemplate = htmlTemplate.replace('${teamName}', teamName)

    const url = `https://slack.com/oauth/v2/authorize?state=${userId}&client_id=5258767683554.5510301270178&scope=&user_scope=channels:history,channels:read,groups:history,groups:read,im:history,im:read,mpim:history,mpim:read,users:read,users:read.email,chat:write`
    htmlTemplate = htmlTemplate.replace('https://ediscoverycloud.com', url)

    const mailOptions = {
        from: `approvals@ediscoverycloud.com`,
        to: to,
        subject: `Request of authorization from ${teamName}`,
        html: htmlTemplate,
        attachments: [
            {
                filename: 'image-1.png',
                path: path.join(__dirname, '../../public/images/image-1.png'),
                cid: 'image-1.png'
            },
            {
                filename: 'image-2.png',
                path: path.join(__dirname, '../../public/images/image-2.png'),
                cid: 'image-2.png'
            },
            {
                filename: 'image-3.png',
                path: path.join(__dirname, '../../public/images/image-3.png'),
                cid: 'image-3.png'
            },
            {
                filename: 'image-4.png',
                path: path.join(__dirname, '../../public/images/image-4.png'),
                cid: 'image-4.png'
            },
            {
                filename: 'image-5.jpeg',
                path: path.join(__dirname, '../../public/images/image-5.jpeg'),
                cid: 'image-5.jpeg'
            },
            {
                filename: 'image-6.png',
                path: path.join(__dirname, '../../public/images/image-6.png'),
                cid: 'image-6.png'
            },
            {
                filename: 'image-7.png',
                path: path.join(__dirname, '../../public/images/image-7.png'),
                cid: 'image-7.png'
            },
            {
                filename: 'image-8.jpeg',
                path: path.join(__dirname, '../../public/images/image-8.jpeg'),
                cid: 'image-8.jpeg'
            }
        ]
    }

    try {
        await mailTransport.sendMail(mailOptions)
        console.log('Email sent successfully')
        return true
    } catch (error) {
        console.log('Email sent failed', error)
        return false
    }
}

exports.sendArchiveCompletionMail = async (to, info) => {
    const html = `<!DOCTYPE html>
  <html>
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style type="text/css">
          body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
          }
          .email-container {
              max-width: 600px;
              margin: auto;
              background-color: #ffffff;
              padding: 20px;
          }
          .header {
              background-color: #4CAF50;
              color: #ffffff;
              padding: 10px;
              text-align: center;
              font-size: 24px;
          }
          .button {
              background-color: #4CAF50;
              color: #ffffff;
              padding: 10px 20px;
              text-decoration: none;
              display: inline-block;
              margin: 20px 0;
          }
          .footer {
              color: #555555;
              font-size: 12px;
              text-align: center;
              margin-top: 20px;
          }
          .footer a {
              color: #555555;
          }
      </style>
  </head>
  <body>
      <div class="email-container">
          <div class="header">
              🎉 Your Archive is Ready!
          </div>
          <p>Dear Client</p>
          <p>We're thrilled to inform you that your archive is complete and ready for download! 🚀</p>
          <p>
              <strong>Archive Details:</strong><br>
              - <strong>ID:</strong> ${info.id}<br>
              - <strong>Name:</strong> ${info.name}<br>
              - <strong>JobName:</strong> ${info.jobName}<br>
              - <strong>Account:</strong> ${info.account}<br>
              - <strong>Type:</strong> ${info.type}<br>
              - <strong>ChatContentSize:</strong> ${info.size}<br>
              - <strong>Note:</strong> ${info.note}
              - <strong>Date Completed:</strong> ${info.date}
          </p>
          <a href="${config.SITE_URL}/archive/apps" class="button">Check Archive</a>
          <p>Need Assistance? Contact our <a href="${config.SITE_URL}/login">support team</a>.</p>
          <div class="footer">
              Warm regards,<br>
              <br>
              Global Digital Forensics<br>
              <br>
          </div>
      </div>
  </body>
  </html>
  `
    const mailOptions = {
        from: `approvals@ediscoverycloud.com`,
        to: to,
        subject: `🎉 Your Archive is Ready!`,
        html: html
    }

    try {
        await mailTransport.sendMail(mailOptions)
        await exports.sendPushNotification({email: to, title: 'Your archive is ready!', message:`We're thrilled to inform you that your archive is complete and ready for download!\nArchive ID: ${info.id}\nName: ${info.name}\nJobName: ${info.jobName}\nType: ${info.type}\nSize: ${info.size}\nNote: ${info.note}\nDate: ${info.date}`})
        console.log('Email sent successfully')
        return true
    } catch (error) {
        console.log('Email sent failed', error)
        return false
    }
}

exports.sendArchiveFailedMail = async (to, info) => {
    const html = `<!DOCTYPE html>
  <html>
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style type="text/css">
          body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
          }
          .email-container {
              max-width: 600px;
              margin: auto;
              background-color: #ffffff;
              padding: 20px;
          }
          .header {
              background-color: #4CAF50;
              color: #ffffff;
              padding: 10px;
              text-align: center;
              font-size: 24px;
          }
          .button {
              background-color: #4CAF50;
              color: #ffffff;
              padding: 10px 20px;
              text-decoration: none;
              display: inline-block;
              margin: 20px 0;
          }
          .footer {
              color: #555555;
              font-size: 12px;
              text-align: center;
              margin-top: 20px;
          }
          .footer a {
              color: #555555;
          }
      </style>
  </head>
  <body>
      <div class="email-container">
          <div class="header">
              Your Archive is Failed!
          </div>
          <p>Dear Client</p>
          <p>We're sorry to inform you that your archive is failed</p>
          <p>
              <strong>Archive Details:</strong><br>
              - <strong>ID:</strong> ${info.id}<br>
              - <strong>Name:</strong> ${info.name}<br>
              - <strong>Type:</strong> ${info.type}<br>
              - <strong>Note:</strong> ${info.note}
              - <strong>Date Failed:</strong> ${info.date}
          </p>
          <a href="${config.SITE_URL}/archive/apps" class="button">Check Archive</a>
          <p>Need Assistance? Contact our <a href="${config.SITE_URL}/login">support team</a>.</p>
          <div class="footer">
              Warm regards,<br>
              <br>
              Global Digital Forensics<br>
              <br>
          </div>
      </div>
  </body>
  </html>
  `
    const mailOptions = {
        from: `approvals@ediscoverycloud.com`,
        to: to,
        subject: `Your Archive is Failed!`,
        html: html
    }

    try {
        await mailTransport.sendMail(mailOptions)
        console.log('Email sent successfully')
        await exports.sendPushNotification({email: to, title: 'Your Archive is Failed!', message:`We're sorry to inform you that your archive is failed!\nArchive ID: ${info.id}\nName: ${info.name}\nJobName: ${info.jobName}\nType: ${info.type}\nSize: ${info.size}\nNote: ${info.note}\nDate: ${info.date}`})
        return true
    } catch (error) {
        console.log('Email sent failed', error)
        return false
    }
}

exports.sendArchiveFailedMail = async (to, info) => {
    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style type="text/css">
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .email-container {
            max-width: 600px;
            margin: auto;
            background-color: #ffffff;
            padding: 20px;
        }
        .header {
            background-color: #4CAF50;
            color: #ffffff;
            padding: 10px;
            text-align: center;
            font-size: 24px;
        }
        .button {
            background-color: #4CAF50;
            color: #ffffff;
            padding: 10px 20px;
            text-decoration: none;
            display: inline-block;
            margin: 20px 0;
        }
        .footer {
            color: #555555;
            font-size: 12px;
            text-align: center;
            margin-top: 20px;
        }
        .footer a {
            color: #555555;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
          Your Archive Is Failed.
        </div>
        <p>Dear Client</p>
        <p>We're sorry to inform you that your archive is failed.</p>
        <p>
            <strong>Archive Details:</strong><br>
            - <strong>Name:</strong> ${info.name}<br>
            - <strong>Error Detail:</strong> ${info.note}
            - <strong>Failed Date:</strong> ${info.date}
        </p>
        <a href="${config.SITE_URL}/archive/apps" class="button">Check Archive</a>
        <p>Need Assistance? Contact our <a href="${config.SITE_URL}/login">support team</a>.</p>
        <div class="footer">
            Warm regards,<br>
            <br>
            Global Digital Forensics<br>
            <br>
        </div>
    </div>
</body>
</html>
`
    const mailOptions = {
        from: `approvals@ediscoverycloud.com`,
        to: to,
        subject: `Your Archive Is Failed!`,
        html: html
    }

    try {
        await mailTransport.sendMail(mailOptions)
        console.log('Email sent successfully')
        return true
    } catch (error) {
        console.log('Email sent failed', error)
        return false
    }
}

exports.sendForgotMail = async (to, userId, url) => {
    let htmlTemplate = fs.readFileSync(path.join(__dirname, '../../public/auth-forgotPassword-tempMail.html'), 'utf-8')

    htmlTemplate = htmlTemplate.replace('https://ediscoverycloud.com', url)

    const mailOptions = {
        from: `approvals@ediscoverycloud.com`,
        to: to,
        subject: `Request of Reset Password`,
        html: htmlTemplate,
        attachments: [
            {
                filename: 'image-1.png',
                path: path.join(__dirname, '../../public/images/image-1.png'),
                cid: 'image-1.png'
            },
            {
                filename: 'image-2.png',
                path: path.join(__dirname, '../../public/images/image-2.png'),
                cid: 'image-2.png'
            },
            {
                filename: 'image-3.png',
                path: path.join(__dirname, '../../public/images/image-3.png'),
                cid: 'image-3.png'
            },
            {
                filename: 'image-4.png',
                path: path.join(__dirname, '../../public/images/image-4.png'),
                cid: 'image-4.png'
            },
            {
                filename: 'image-5.jpeg',
                path: path.join(__dirname, '../../public/images/image-5.jpeg'),
                cid: 'image-5.jpeg'
            },
            {
                filename: 'image-6.png',
                path: path.join(__dirname, '../../public/images/image-6.png'),
                cid: 'image-6.png'
            },
            {
                filename: 'image-7.png',
                path: path.join(__dirname, '../../public/images/image-7.png'),
                cid: 'image-7.png'
            },
            {
                filename: 'image-8.jpeg',
                path: path.join(__dirname, '../../public/images/image-8.jpeg'),
                cid: 'image-8.jpeg'
            }
        ]
    }

    try {
        await mailTransport.sendMail(mailOptions)
        console.log('Email sent successfully')
        return true
    } catch (error) {
        console.log('Email sent failed', error)
        return false
    }
}

exports.sendTwoFactorMail = async (to, code) => {
    const html = `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Two Factor Authentication</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 20px;
          }
  
          .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
          }
  
          .header {
              text-align: center;
              margin-bottom: 20px;
          }
  
          .code {
              text-align: center;
              font-size: 24px;
              margin: 20px 0;
              color: #333;
              padding: 10px;
              border: 1px solid #ddd;
              border-radius: 5px;
              background-color: #f9f9f9;
          }
  
          .footer {
              text-align: center;
              font-size: 12px;
              color: #888;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <img src="${config.SITE_URL}/static/media/gdf-logo.f06a8a21.png" alt="Global Digital Forensics">
              <h2>Two Factor Authentication</h2>
              <p>To verify your identity, please use the following code:</p>
          </div>
          <div class="code">
              ${code}
          </div>
          <div class="footer">
              <p>If you did not request this code, please contact our support immediately. This code will be expired in 10 minutes.</p>
              <p>&copy; 2023 Global Digital Forensics. All rights reserved.</p>
          </div>
      </div>
  </body>
  </html>
  `

    const mailOptions = {
        from: `approvals@ediscoverycloud.com`,
        to: to,
        subject: `🎉 Verification Code`,
        html: html
    }

    try {
        await mailTransport.sendMail(mailOptions)
        console.log('Email sent successfully')
        return true
    } catch (error) {
        console.log('Email sent failed', error)
        return false
    }
}

exports.sendMailVerification = async (to, link) => {
    const html = `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Please Verify Your Email</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 20px;
          }
  
          .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
          }
  
          .header {
              text-align: center;
              margin-bottom: 20px;
          }
          .button {
            display: block;
            width: max-content;
            background-color: #007bff;
            color: #ffffff;
            padding: 10px 20px;
            text-align: center;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px auto;
        }
          .footer {
              text-align: center;
              font-size: 12px;
              color: #888;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <img src="${config.SITE_URL}/static/media/gdf-logo.f06a8a21.png" alt="Global Digital Forensics">
              <h2>Please verify your email</h2>
              <p>To verify your email, please click the following button</p>
          </div>
          <div class="code">
              <a href="${link}" class="button">Verify Email</a>
          </div>
          <div class="footer">
              <p>If you did not do this action, please contact our support immediately. This link will be expired in 7 days.</p>
              <p>&copy; 2023 Global Digital Forensics. All rights reserved.</p>
          </div>
      </div>
  </body>
  </html>
  `

    const mailOptions = {
        from: `approvals@ediscoverycloud.com`,
        to: to,
        subject: `Verify Your Email`,
        html: html
    }

    try {
        await mailTransport.sendMail(mailOptions)
        console.log('Email sent successfully')
        return true
    } catch (error) {
        console.log('Email sent failed', error)
        return false
    }
}

exports.sendPasswordUpdatedMail = async (to, user) => {
    const html = `<!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Updated</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border: 1px solid #e1e1e1;
      border-radius: 5px;
      box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #f8f8f8;
      padding: 10px;
      text-align: center;
    }
    .content {
      padding: 20px;
      line-height: 1.6;
    }
    .footer {
      text-align: center;
      padding: 10px;
      background-color: #f8f8f8;
    }
    a {
      color: #0066cc;
    }
  </style>
  </head>
  <body>
  
  <div class="container">
    <div class="header">
      <h1>${config.SITE_TITLE}</h1>
    </div>
    <div class="content">
      <p>Dear ${user.name || user.email.split('@')[0]},</p>
      <p>We hope this message finds you well. We wanted to inform you that the password associated with your account at ${config.SITE_TITLE
        } has been successfully updated.</p>
      <p>If you did not initiate this change, please contact our customer support team immediately at <a href="mailto:approvals@ediscoverycloud.com">[Customer Support Email Address]</a> or call us at [Customer Support Phone Number]. We take the security of your account very seriously and are here to assist you in any way possible.</p>
      <p>To access your account, please visit <a href="${config.SITE_URL}">${config.SITE_URL}</a> and log in using your new password.</p>
      <p>As a reminder, here are some best practices for maintaining a secure account:</p>
      <ul>
        <li>Regularly update your password and choose a unique combination of letters, numbers, and symbols.</li>
        <li>Avoid using easily guessable information, such as your name or birthdate.</li>
        <li>Be cautious of phishing attempts and do not click on any suspicious links or provide your password to anyone claiming to be from ${config.SITE_TITLE
        }.</li>
      </ul>
      <p>Thank you for being a valued customer of ${config.SITE_TITLE
        }. We appreciate your trust in us and are committed to providing you with the best possible service.</p>
      <p>Best regards,</p>
      <p>The ${config.SITE_TITLE} Team</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${config.SITE_TITLE}. All rights reserved.</p>
    </div>
  </div>
  
  </body>
  </html>
  
  `

    const mailOptions = {
        from: `approvals@ediscoverycloud.com`,
        to: to,
        subject: `🎉 Password Updated`,
        html: html
    }

    try {
        await mailTransport.sendMail(mailOptions)
        console.log('Email sent successfully')
        return true
    } catch (error) {
        console.log('Email sent failed', error)
        return false
    }
}

exports.sendUserDeactivatedMail = async (to, user) => {
    const html = `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Deactivation</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
          }
          .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
              border: 1px solid #e1e1e1;
              border-radius: 5px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          h1 {
              color: #f00;
          }
          p {
              color: #555;
          }
          a {
              color: #00f;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <h1>Your Account Has Been Deactivated</h1>
          <p>Dear ${user.name || user.email.split('@')[0]},</p>
          <p>We regret to inform you that your account has been deactivated. If you think this is a mistake or if you would like to reactivate your account, please contact our support team.</p>
          <p><a href="mailto:${config.SUPPORT_EMAIL}">Contact Support</a></p>
          <p>Best regards,</p>
          <p>${config.COMPANY_NAME}</p>
      </div>
  </body>
  </html>
  
  `

    const mailOptions = {
        from: `approvals@ediscoverycloud.com`,
        to: to,
        subject: `🎉 Account Deactivated!`,
        html: html
    }

    try {
        await mailTransport.sendMail(mailOptions)
        console.log('Email sent successfully')
        return true
    } catch (error) {
        console.log('Email sent failed', error)
        return false
    }
}

exports.sendUserSuspendedPWD = async (to, user) => {
    const html = `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
          body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
          }
          .container {
              max-width: 600px;
              margin: 20px auto;
              padding: 20px;
              background-color: #ffffff;
          }
          .header {
              background-color: #f8f8f8;
              padding: 10px 20px;
              text-align: center;
          }
          .header img {
              max-width: 180px;
          }
          .content {
              padding: 20px;
          }
          .footer {
              background-color: #f8f8f8;
              padding: 10px 20px;
              text-align: center;
              font-size: 12px;
          }
          .button {
              display: block;
              width: max-content;
              background-color: #007bff;
              color: #ffffff;
              padding: 10px 20px;
              text-align: center;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px auto;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="content">
              <h2>Account Suspension Notice</h2>
              <p>Dear ${user.name || user.email.split('@')[0]},</p>
              <p>We've noticed several unsuccessful login attempts to your account. To help protect your information, we've temporarily suspended your account. This is a precautionary measure and we apologize for any inconvenience this may cause.</p>
              <p>If you did not attempt to login to your account or believe this to be an error, please contact our support team immediately at:</p>
              <p><a href="mailto:${config.SUPPORT_EMAIL}">Get Support</a></p>
              <p>Thank you for your prompt attention to this matter.</p>
              <p>Best regards,</p>
              <p>${config.COMPANY_NAME}</p>
          </div>
          <div class="footer">
              © ${new Date().getFullYear()} ${config.COMPANY_NAME}. All rights reserved.
          </div>
      </div>
  </body>
  </html>  
  `

    const mailOptions = {
        from: `approvals@ediscoverycloud.com`,
        to: to,
        subject: `🎉 Account suspended temporary!`,
        html: html
    }

    try {
        await mailTransport.sendMail(mailOptions)
        console.log('Email sent successfully')
        return true
    } catch (error) {
        console.log('Email sent failed', error)
        return false
    }
}

exports.sendSignInSucceed = async (to, user, info) => {
    const html = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Successful Sign In</title>
  </head>
  <body>
    <table width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: auto;">
      <!-- Header -->
      <!-- <tr>
        <td style="background-color: #f8f8f8; text-align: center; padding: 20px;">
          <img src="logo_url_here" alt="Company Logo" style="max-width: 200px;">
        </td>
      </tr> -->
      <!-- Message Body -->
      <tr>
        <td style="background-color: #ffffff; text-align: left; padding: 40px;">
          <h1 style="color: #333333; font-size: 24px; margin-bottom: 10px;">Sign In Successful</h1>
          <p style="color: #555555; font-size: 16px; margin-bottom: 20px;">Hello, ${user.name || user.email.split('@')[0]}!</p>
          <p style="color: #555555; font-size: 16px; margin-bottom: 20px;">You have successfully signed into your account. Here are the details of your sign-in:</p>
          <!-- Sign-in Details -->
          <table cellspacing="0" cellpadding="0" style="width: 100%; font-size: 16px; color: #555555;">
            <tr>
              <td style="padding: 5px 0;"><strong>Date and Time:</strong></td>
              <td style="padding: 5px 0;">${new Date().toISOString()}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;"><strong>Operating System:</strong></td>
              <td style="padding: 5px 0;">${info.os}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;"><strong>Browser:</strong></td>
              <td style="padding: 5px 0;">${info.browser}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;"><strong>IP Address:</strong></td>
              <td style="padding: 5px 0;">${info.ipAddress}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;"><strong>Country:</strong></td>
              <td style="padding: 5px 0;">${info.geoData.country}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;"><strong>Region:</strong></td>
              <td style="padding: 5px 0;">${info.geoData.regionName}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;"><strong>City:</strong></td>
              <td style="padding: 5px 0;">${info.geoData.city}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;"><strong>Zip:</strong></td>
              <td style="padding: 5px 0;">${info.geoData.zip}</td>
            </tr>
          </table>
          <!-- End of Sign-in Details -->
          <p style="margin-top: 20px;">If this was not you, please contact our support team immediately.</p>
          <a href="${config.SITE_URL
        }" style="background-color: #0056b3; color: #ffffff; padding: 15px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">Go to Dashboard</a>
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="background-color: #333333; text-align: center; padding: 20px; color: #ffffff;">
          <p style="font-size: 14px;">&copy; ${new Date().getFullYear()} ${config.COMPANY_NAME}. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </body>
  </html>  
  `

    const mailOptions = {
        from: `approvals@ediscoverycloud.com`,
        to: to,
        subject: `🎉 Successful Sign In!`,
        html: html
    }

    try {
        await mailTransport.sendMail(mailOptions)
        console.log('Email sent successfully')
        return true
    } catch (error) {
        console.log('Email sent failed', error)
        return false
    }
}

exports.sendArchiveDeletionMail = async (to, info) => {
    const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Archived Deletion Notice</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background: #fff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
                background-color: #4CAF50;
                color: white;
                padding: 10px 0;
                text-align: center;
                border-radius: 8px 8px 0 0;
            }
            .content {
                padding: 20px;
            }
            .content h2 {
                color: #4CAF50;
                border-bottom: 2px solid #4CAF50;
                padding-bottom: 5px;
            }
            .content p {
                margin: 10px 0;
            }
            .footer {
                text-align: center;
                padding: 10px 0;
                border-top: 1px solid #ccc;
                color: #777;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Deletion Archive Notice</h1>
            </div>
            
            <div class="content">
                <h2>Archived Deletion Details</h2>
                <p><strong>Date of Deletion:</strong> ${info.dtDeleted}</p>
                
                <h2>Item Information</h2>
                <p><strong>Item Type:</strong> ${info.type}</p>
                <p><strong>Item Count</strong> ${info.count}</p>
                <p><strong>Unique Identifier:</strong> ${info.id}</p>
                
                <h2>Deletion Details</h2>
                <p><strong>Reason for Deletion:</strong> ${info.reason}</p>
                <p><strong>Method of Deletion:</strong> ${info.method}</p>
                <p><strong>Recovery Possibility:</strong> ${info.isRecovery}</p>
                
                <h2>Metadata</h2>
                <p><strong>Size of Item:</strong> ${info.size} Bytes</p>
                
            </div>
            
            <div class="footer">
                <p>&copy; 2024 ${config.COMPANY_NAME}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>    
  `

    const mailOptions = {
        from: `approvals@ediscoverycloud.com`,
        to: to,
        subject: `Archive Deleted`,
        html: html
    }

    try {
        await mailTransport.sendMail(mailOptions)
        console.log('Email sent successfully')
        return true
    } catch (error) {
        console.log('Email sent failed', error)
        return false
    }
}

exports.sendWorkspaceDeletionMail = async (to, info) => {
    const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Archived Deletion Notice</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background: #fff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
                background-color: #4CAF50;
                color: white;
                padding: 10px 0;
                text-align: center;
                border-radius: 8px 8px 0 0;
            }
            .content {
                padding: 20px;
            }
            .content h2 {
                color: #4CAF50;
                border-bottom: 2px solid #4CAF50;
                padding-bottom: 5px;
            }
            .content p {
                margin: 10px 0;
            }
            .footer {
                text-align: center;
                padding: 10px 0;
                border-top: 1px solid #ccc;
                color: #777;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Deletion Archive Notice</h1>
            </div>
            
            <div class="content">
                <h2>Archived Deletion Details</h2>
                <p><strong>Date of Deletion:</strong> ${info.dtDeleted}</p>
                
                <h2>Item Information</h2>
                <p><strong>Item Type:</strong> ${info.type}</p>
                <p><strong>Item Count</strong> ${info.name}</p>
                <p><strong>Unique Identifier:</strong> ${info.id}</p>
                
                <h2>Deletion Details</h2>
                <p><strong>Reason for Deletion:</strong> ${info.reason}</p>
                <p><strong>Method of Deletion:</strong> ${info.method}</p>
                <p><strong>Recovery Possibility:</strong> ${info.isRecovery}</p>
                
                <h2>Metadata</h2>
                <p><strong>Count of Members:</strong> ${info.cntMember}</p>
                <p><strong>Count of Archives:</strong> ${info.cntArchive}</p>
                
            </div>
            
            <div class="footer">
                <p>&copy; 2024 ${config.COMPANY_NAME}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>    
  `

    const mailOptions = {
        from: `approvals@ediscoverycloud.com`,
        to: to,
        subject: `A Workspace Has Been Deleted`,
        html: html
    }

    try {
        await mailTransport.sendMail(mailOptions)
        console.log('Email sent successfully')
        return true
    } catch (error) {
        console.log('Email sent failed', error)
        return false
    }
}

exports.sendSubscriptionSucceed = async (to, user, info) => {
    const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Subscription is Successful!</title>
        <style>
            body {
                font-family: sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #fff;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            h1, h2 {
                color: #007bff;
            }
            .button {
                display: inline-block;
                background-color: #28a745;
                color: #fff;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
            }
            .button:hover {
                background-color: #218838;
            }
            .highlight {
                font-weight: bold;
                color: #007bff;
            }
            .footer {
                margin-top: 30px;
                font-size: 0.8em;
                color: #777;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎉 Congratulations! Your Subscription is Successful! 🎉</h1>
            <p>Dear <span class="highlight">${user.name || user.email.split('@')[0]}</span>,</p>
            <p>We're thrilled to confirm that your subscription to <span class="highlight">${config.SITE_TITLE}</span> has been successfully processed!</p>
            <p>You now have full access to all the amazing features and benefits of your <span class="highlight">${info.subscriptionTitle}</span> plan, including:</p>
            <ul>
                ${info.benefit}
            </ul>
            <p>Here are your subscription details:</p>
            <ul>
                <li><strong>Subscription Plan:</strong> <span class="highlight">${info.subscriptionTitle}</span></li>
                <li><strong>Start Date:</strong> <span class="highlight">${info.startDate}</span></li>
                <li><strong>Next Billing Date:</strong> <span class="highlight">${info.nextBillingDate}</span></li>
            </ul>
            <p>Ready to dive in? Click the button below to access your account:</p>
            <p><a href="${config.SITE_URL}" class="button">Access Your Account</a></p>
            <h2>Need Help?</h2>
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team:</p>
            <ul>
                <li>Email: <a href="mailto:${config.SUPPORT_EMAIL}">${config.SUPPORT_EMAIL}</a></li>
                <li>Visit our Help Center: <a href="${config.SITE_URL}/help">${config.SITE_URL}/help</a></li>
            </ul>
            <p>Thank you for choosing <span class="highlight">${config.SITE_TITLE}</span>. We're excited to have you as part of our community!</p>
            <p>Sincerely,<br>The <span class="highlight">${config.COMPANY_NAME}</span> Team</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${config.COMPANY_NAME}. All rights reserved.</p>
            <p><a href="${config.SITE_URL}/policy">Privacy Policy</a> | <a href="${config.SITE_URL}/terms">Terms of Service</a></p>
        </div>
    </body>
    </html>
  `

    const mailOptions = {
        from: `approvals@ediscoverycloud.com`,
        to: to,
        subject: `🎉 Successful Subscribed!`,
        html: html
    }

    try {
        await mailTransport.sendMail(mailOptions)
        console.log('Email sent successfully')
        return true
    } catch (error) {
        console.log('Email sent failed', error)
        return false
    }
}

exports.sendSubscriptionCancelled = async (to, user, info) => {
    const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Cancellation Confirmation</title>
        <style>
            body {
                font-family: sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #fff;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            h1, h2 {
                color: #007bff; /* You can change this to your brand color */
            }
            p {
                margin-bottom: 16px;
            }
            .button {
                display: inline-block;
                background-color: #007bff; /* Or your brand color */
                color: #fff;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
            }
            .button:hover {
                background-color: #0056b3; /* Darker shade for hover effect */
            }
            .highlight {
                font-weight: bold;
                color: #007bff; /* Or your brand color */
            }
            .footer {
                margin-top: 30px;
                font-size: 0.8em;
                color: #777;
                text-align: center;
            }
            .feedback {
                margin-top: 20px;
                padding: 15px;
                background-color: #f8f9fa; /* Light background for feedback section */
                border-radius: 5px;
                border: 1px solid #ddd; /* Optional border */
            }
            .feedback h2 {
                font-size: 1.2em;
                margin-bottom: 10px;
                color: #343a40;
            }
            .feedback-form {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .feedback-form textarea {
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                resize: vertical;
                font-family: sans-serif;
            }
            .feedback-form button {
                background-color: #6c757d; /* Gray button for feedback submission */
                color: #fff;
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                align-self: flex-start; /* Align button to the start */
            }
            .feedback-form button:hover {
                background-color: #5a6268; /* Darker gray on hover */
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>We're Sorry to See You Go</h1>
            <p>Dear <span class="highlight">${user.name || user.email.split('@')[0]}</span>,</p>
            <p>This email confirms that your subscription to <span class="highlight">${config.SITE_TITLE}</span> has been cancelled.</p>
            <p>Your subscription will remain active until <span class="highlight">${info.effectiveDate}</span>.  You will not be charged again.</p>
    
            <p>If you have any questions about your cancellation or if you'd like to resubscribe, please contact us at <a href="mailto:${config.SUPPORT_EMAIL}">${config.SUPPORT_EMAIL}</a> or visit our <a href="${config.SITE_URL}/help">Help Center</a>.</p>
    
            <div class="feedback">
                <h2>We Value Your Feedback</h2>
                <p>We're always looking to improve our services.  Could you take a moment to tell us why you cancelled your subscription?</p>
                <form class="feedback-form">
                    <textarea id="feedback-reason" placeholder="Your feedback is important to us."></textarea>
                    <button type="submit">Submit Feedback</button>
                    <p style="font-size: 0.9em; color: #777;">(Optional)</p>
                </form>
            </div>
    
            <p>Thank you for being a part of the <span class="highlight">${config.COMPANY_NAME}</span> community. We hope to see you again in the future.</p>
    
            <p>Sincerely,<br>The <span class="highlight">${config.COMPANY_NAME}</span> Team</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${config.COMPANY_NAME}. All rights reserved.</p>
            <p><a href="${config.SITE_URL}/policy">Privacy Policy</a> | <a href="${config.SITE_URL}/terms">Terms of Service</a></p>
        </div>
    </body>
    </html>
    
  `

    const mailOptions = {
        from: `approvals@ediscoverycloud.com`,
        to: to,
        subject: `Subscription Cancelled!`,
        html: html
    }

    try {
        await mailTransport.sendMail(mailOptions)
        console.log('Email sent successfully')
        return true
    } catch (error) {
        console.log('Email sent failed', error)
        return false
    }
}

exports.downloadFileFromSlack = async (teamId, fileName, fileUrl, accessToken) => {
    try {
        // Constructing an absolute path to the directory
        const dirPath = path.join(config.SLACK_FILES_DIR, `${teamId}/`)

        await mkdir(dirPath, { recursive: true })
        const filePath = path.join(dirPath, fileName)

        try {
            await access(filePath)
            return { ok: true, filePath }
        } catch (error) {
            // File doesn't exist, so download it
            const response = await axios({
                method: 'GET',
                url: fileUrl,
                headers: { Authorization: `Bearer ${accessToken}` },
                responseType: 'stream'
            })

            // Return a new promise that resolves/rejects based on stream events
            return new Promise((resolve, reject) => {
                const writer = fs.createWriteStream(filePath)
                response.data.pipe(writer)

                writer.on('finish', () => resolve({ ok: true, filePath }))
                writer.on('error', err => {
                    console.log('File download failed! --------', err)
                    reject(err)
                })
            })
        }
    } catch (error) {
        console.error('An error occurred while trying to download the file.', error)
        throw error // re-throw the error
    }
}

// exports.getConversationHistoryWithThreads = async data => {
//     const { client, channelId, startDate, endDate, token, teamId, isBackUp, userId, channelName, members, teamName } = data

//     let result = []
//     let hasMore = false
//     let cursor = undefined
//     let oldest = '0'
//     let latest = `${Math.floor(Date.now() / 1000)}`

//     if (startDate && endDate) {
//         oldest = `${Math.floor(new Date(startDate).getTime() / 1000)}`
//         latest = `${Math.floor(new Date(endDate).getTime() / 1000)}`
//     }

//     let retryCnt = 0
//     let newBackupFiles = 0
//     let newBackupFileSize = 0
//     do {
//         try {
//             const res = await client.conversations.history({
//                 channel: channelId,
//                 cursor: cursor,
//                 oldest,
//                 latest,
//                 limit: 200
//             })

//             // result = result.concat(res.messages);
//             hasMore = res.has_more
//             cursor = res.response_metadata.next_cursor
//             // Iterate through each message and retrieve its threads
//             let index = 0
//             // console.log("=======================MESSAGES===============");
//             // console.log(res.messages);
//             // console.log("=======================END MESSAGES===============");

//             for (const message of res.messages) {
//                 const msgObj = {}
//                 if (message.files) {
//                     const files = []
//                     for (const file of message.files) {
//                         if (isBackUp) {
//                             //download file
//                             try {
//                                 // Constructing an absolute path to the directory
//                                 const dirPath = path.join(config.SLACK_FILES_DIR, `${teamId}/`)
//                                 await mkdir(dirPath, { recursive: true })
//                                 const filePath = path.join(dirPath, file.id)
//                                 try {
//                                     await access(filePath)
//                                     console.log('File Exists -> ', filePath)
//                                 } catch (error) {
//                                     const response = await axios({
//                                         method: 'GET',
//                                         url: file.url_private,
//                                         headers: { Authorization: `Bearer ${token}` },
//                                         responseType: 'stream'
//                                     })

//                                     // Creating write stream
//                                     const writer = fs.createWriteStream(filePath)
//                                     response.data.pipe(writer)
//                                     writer.on('finish', () => {
//                                         console.log('File Donwloaded! --------', filePath)
//                                         newBackupFiles += 1
//                                         newBackupFileSize += file.size
//                                     })

//                                     writer.on('error', err => {
//                                         console.log('File download failed! --------', err)
//                                         throw err
//                                     })
//                                 }
//                             } catch (error) {
//                                 console.error('An error occurred while trying to download the file.', error, file)
//                                 throw error
//                             }
//                         }
//                         const filetype = file.filetype
//                         if (filetype === 'png' || filetype === 'jpg' || filetype === 'tif' || filetype === 'bmp' || filetype === 'tiff') {
//                             file.thumb = await fetchSlackImageByBase64(file.thumb_360, token, filetype)
//                         }
//                         files.push(file)
//                     }
//                     msgObj.files = files
//                 }

//                 if (message.reactions) {
//                     msgObj.reactions = message.reactions
//                 }
//                 // const msgText = [];
//                 if (message.blocks && Array.isArray(message.blocks)) {
//                     for (const block of message.blocks) {
//                         if (block.type === 'rich_text') {
//                             for (const element of block.elements) {
//                                 if (element.type === 'rich_text_section') {
//                                     msgObj['messageObj'] = element.elements
//                                 }
//                             }
//                         }
//                     }
//                 } else {
//                     msgObj['messageObj'] = [{ type: 'text', text: message.text }]
//                 }

//                 msgObj['message'] = message.text
//                 msgObj['started_by'] = message.user
//                 msgObj['created'] = ts2datetime(message.ts)
//                 msgObj['replies'] = 0
//                 msgObj['index'] = index++
//                 msgObj['user'] = message.user
//                 msgObj['threads'] = []
//                 if (message.thread_ts) {
//                     // Retrieve the thread's replies
//                     const threadResult = await client.conversations.replies({
//                         channel: channelId,
//                         ts: message.thread_ts
//                     })
//                     msgObj['replies'] = message.reply_count
//                     msgObj['reply_users'] = message.reply_users

//                     msgObj['threads'] = threadResult.messages.map(msg => {
//                         return {
//                             text: msg.text,
//                             ts: ts2datetime(msg.ts),
//                             user: msg.user
//                         }
//                     })
//                 }

//                 if (isBackUp) {
//                     const member = members[message.user]
//                     const realname = member ? member.real_name : message.user
//                     addIndex({
//                         index: config.ELASTIC_INFO.SLACK_INDEX,
//                         id: message.ts,
//                         body: {
//                             userId,
//                             teamId,
//                             teamName,
//                             channelId,
//                             channelName,
//                             message: message.text,
//                             startedBy: message.user,
//                             realname,
//                             created: ts2datetime(message.ts),
//                             files: msgObj['files'],
//                             replies: msgObj['threads']
//                         }
//                     })
//                 }

//                 result.push(msgObj)
//             }
//         } catch (error) {
//             if (error.data && error.data.error === 'ratelimited' && retryCnt < 3) {
//                 const delay = Number(error.response.headers['retry-after']) * 1000
//                 await new Promise(resolve => setTimeout(resolve, delay))
//                 retryCnt += 1
//                 continue
//             } else {
//                 console.log(error, message.blocks)
//                 throw error
//             }
//         }
//     } while (hasMore)

//     if (isBackUp) return { newBackupFileSize, newBackupFiles, result }

//     return result
// }

exports.getConversationHistoryWithThreads = async data => {
    const { client, channelId, startDate, endDate, token, teamId, isBackUp, userId, channelName, members, teamName, cursor, backupId } = data

    let result = []
    let hasMore = false
    let newCursor = undefined
    let oldest = '0'
    let latest = `${Math.floor(Date.now() / 1000)}`

    if (startDate && endDate) {
        oldest = `${Math.floor(new Date(startDate).getTime() / 1000)}`
        latest = `${Math.floor(new Date(endDate).getTime() / 1000)}`
    }

    let retryCnt = 0
    let newBackupFiles = 0
    let newBackupFileSize = 0

    try {
        const res = await client.conversations.history({
            channel: channelId,
            cursor: cursor,
            oldest,
            latest,
            limit: 200
        })

        hasMore = res.has_more
        newCursor = res.response_metadata ? res.response_metadata.next_cursor : undefined
        let index = 0
        for (const message of res.messages) {
            const msgObj = {}
            if (message.files) {
                const files = []
                for (const file of message.files) {
                    if (isBackUp) {
                        try {
                            const dirPath = path.join(config.SLACK_FILES_DIR, `${teamId}/`)
                            await mkdir(dirPath, { recursive: true })
                            const filePath = path.join(dirPath, file.id)
                            try {
                                await access(filePath)
                                console.log('File Exists -> ', filePath)
                            } catch (error) {
                                const response = await axios({
                                    method: 'GET',
                                    url: file.url_private,
                                    headers: { Authorization: `Bearer ${token}` },
                                    responseType: 'stream',
                                    httpsAgent: new https.Agent({ rejectUnauthorized: false })
                                })

                                console.log('----------------File Url------------')
                                console.log(file.url_private)

                                const writer = fs.createWriteStream(filePath)
                                response.data.pipe(writer)
                                writer.on('finish', () => {
                                    console.log('File Donwloaded! --------', filePath)
                                    newBackupFiles += 1
                                    newBackupFileSize += file.size
                                })

                                writer.on('error', err => {
                                    console.log('File download failed! --------', err)
                                    throw err
                                })
                            }
                        } catch (error) {
                            console.error('An error occurred while trying to download the file.', error, file)
                            throw error
                        }
                    }
                    const filetype = file.filetype
                    if (filetype === 'png' || filetype === 'jpg' || filetype === 'tif' || filetype === 'bmp' || filetype === 'tiff') {
                        file.thumb = await fetchSlackImageByBase64(file.thumb_360, token, filetype)
                    }
                    files.push(file)
                }
                msgObj.files = files
            }

            if (message.reactions) {
                msgObj.reactions = message.reactions
            }

            if (message.blocks && Array.isArray(message.blocks)) {
                for (const block of message.blocks) {
                    if (block.type === 'rich_text') {
                        for (const element of block.elements) {
                            if (element.type === 'rich_text_section') {
                                msgObj['messageObj'] = element.elements
                            }
                        }
                    }
                }
            } else {
                msgObj['messageObj'] = [{ type: 'text', text: message.text }]
            }

            msgObj['message'] = message.text
            msgObj['started_by'] = message.user
            msgObj['created'] = ts2datetime(message.ts)
            msgObj['ts'] = message.ts
            msgObj['replies'] = 0
            msgObj['index'] = index++
            msgObj['user'] = message.user
            msgObj['threads'] = []
            if (message.thread_ts) {
                const threadResult = await client.conversations.replies({
                    channel: channelId,
                    ts: message.thread_ts
                })
                msgObj['replies'] = message.reply_count
                msgObj['reply_users'] = message.reply_users

                msgObj['threads'] = threadResult.messages.map(msg => {
                    return {
                        text: msg.text,
                        ts: ts2datetime(msg.ts),
                        user: msg.user
                    }
                })
            }

            if (isBackUp) {
                const member = members[message.user]
                const realname = member ? member.real_name : message.user
                addIndex({
                    index: config.ELASTIC_INFO.SLACK_INDEX,
                    id: `${backupId}_${message.ts}`,
                    body: {
                        userId,
                        teamId,
                        teamName,
                        channelId,
                        channelName,
                        message: message.text,
                        startedBy: message.user,
                        realname,
                        created: ts2datetime(message.ts),
                        files: msgObj['files'],
                        replies: msgObj['threads'],
                        backupId
                    }
                })
            }

            result.push(msgObj)
        }
    } catch (error) {
        if (error.data && error.data.error === 'ratelimited' && retryCnt < 30) {
            const delay = Number(error.response.headers['retry-after']) * 1000 * 5
            await new Promise(resolve => setTimeout(resolve, delay))
            retryCnt += 1
            return await exports.getConversationHistoryWithThreads(data) // Retry with the same data
        } else {
            // console.log(error, message.blocks)
            throw error
        }
    }

    if (isBackUp) return { newBackupFileSize, newBackupFiles, result, hasMore, cursor: newCursor }

    return { result, hasMore, cursor: newCursor }
}

exports.addIndexQueue = async (type, fileInfo) => {
    // check if file is readable.
    try {
        // Validate fileInfo
        const requiredFields = ['workspaceId', 'archiveId', 'fileId', 'fileName', 'fileType', 's3Key', 'owner', 'collectedBy'];
        for (const field of requiredFields) {
            if (!fileInfo[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Check if file is readable
        if (!isReadableFileType(fileInfo.fileType, fileInfo.fileName)) {
            console.log(`File type ${fileInfo.fileType} is not readable. Skipping...`);
            return;
        }

        fileInfo.state = 'queued'
        // if (type === 'Slack') {
        await FileQueue.create(fileInfo)
        // }

        // Simulate file processing (OCR or parsing if necessary)
        console.log(`Successfully queued file: ${fileInfo.fileName} (Type: ${fileInfo.fileType})`);
    } catch (error) {
        console.error(`Error adding file to index queue: ${error.message}`);
        throw error;
    }
}

exports.getConversationHistoryWithThreads2 = async data => {
    const { client, channelId, startDate, endDate, token, teamId, isBackUp, userId, owner, createdBy, channelName, members, teamName, cursor, backupId, filters } = data;

    let result = [];
    let hasMore = false;
    let newCursor = undefined;
    let oldest = '0';
    let latest = `${Math.floor(Date.now() / 1000)}`;

    if (startDate && endDate) {
        oldest = `${Math.floor(new Date(startDate).getTime() / 1000)}`;
        latest = `${Math.floor(new Date(endDate).getTime() / 1000)}`;
    }
    if (isBackUp) {
        if (filters.filterByDateRange)
            oldest = `${Math.floor(new Date(filters.dateRange?.start).getTime() / 1000)}`;
            latest = `${Math.floor(new Date(filters.dateRange?.end).getTime() / 1000)}`;
    }

    let retryCnt = 0;
    let newBackupFileSize = 0;

    try {
        const res = await client.conversations.history({
            channel: channelId,
            cursor: cursor,
            oldest,
            latest,
            limit: 200
        });

        hasMore = res.has_more;
        newCursor = res.response_metadata ? res.response_metadata.next_cursor : undefined;
        let index = 0;

        for (const message of res.messages) {
            let isMatch = false; // Reset isMatch for each message
            const msgObj = {};

            if (filters.keywords && message.text?.includes(filters.keywords)) {
                isMatch = true;
            }

            if (message.files) {
                const files = [];
                const filePromises = []; // Array to store promises for file processing

                for (const file of message.files) {
                    if (isBackUp) {
                        try {
                            if (!file.name || !file.url_private)
                                continue
                            if (filters.keywords && file.name && file.name.includes(filters.keywords))
                                isMatch = true;
                            const dirPath = path.join(config.SLACK_FILES_DIR, `${teamId}/`);
                            await mkdir(dirPath, { recursive: true });
                            const filePath = path.join(dirPath, file.id);

                            const response = await axios({
                                method: 'GET',
                                url: file.url_private,
                                headers: { Authorization: `Bearer ${token}` },
                                responseType: 'stream',
                                httpsAgent: new https.Agent({ rejectUnauthorized: false })
                            });

                            console.log('----------------File Url------------');
                            console.log(file.url_private);
                            const s3Key = `Slack/${backupId}/${file.id}/${file.name}`;
                            file.s3Key = s3Key;

                           
                            const writer = fs.createWriteStream(filePath);
                            response.data.pipe(writer);

                            const filePromise = new Promise(resolve => {
                                writer.on('finish', async () => {
                                    console.log('File Donwloaded! --------', filePath);
                                    if (filters.keywords && !isMatch && isReadableFileType(file.mimetype, file.name)) {
                                        const buffer = fs.readFileSync(filePath);
                                        const keywords = await exports.extractKeywordsFromFile(buffer, file.mimetype);
                                        if (keywords?.includes(filters.keywords))
                                            isMatch = true;
                                    }
                                    if (isMatch || !filters.keywords) {
                                        const fileStream = fs.createReadStream(filePath);
                                        const passThroughStream = new PassThrough();
                                        fileStream.pipe(passThroughStream);
                                        await AWS.uploadFileStream(config.AWS.OUTLOOK_BUCKET, s3Key, passThroughStream);
                                        newBackupFileSize += file.size;
                                        exports.addIndexQueue('Slack', {
                                            workspaceId: teamId,
                                            archiveId: backupId,
                                            fileId: file.id,
                                            fileName: file.name,
                                            fileType: file.mimetype,
                                            size: file.size,
                                            s3Key: file.s3Key,
                                            owner: owner,
                                            collectedBy: createdBy
                                        });
                                    }
                                    fs.unlinkSync(filePath);
                                    resolve(); // Resolve the promise when file processing is complete
                                });
                            });
                            filePromises.push(filePromise);

                            writer.on('error', err => {
                                console.log('File download failed! --------', err);
                                throw err;
                            });
                        } catch (error) {
                            console.error('An error occurred while trying to download the slack file.', error, file);
                            throw error;
                        }
                    }
                    files.push(file);
                }
                msgObj.files = files;
                await Promise.all(filePromises); // Wait for all file processing to complete
            }

            if (message.reactions) {
                msgObj.reactions = message.reactions;
            }

            if (message.blocks && Array.isArray(message.blocks)) {
                for (const block of message.blocks) {
                    if (block.type === 'rich_text') {
                        for (const element of block.elements) {
                            if (element.type === 'rich_text_section') {
                                msgObj['messageObj'] = element.elements;
                            }
                        }
                    }
                }
            } else {
                msgObj['messageObj'] = [{ type: 'text', text: message.text }];
            }

            msgObj['message'] = message.text;
            msgObj['started_by'] = message.user;
            msgObj['created'] = ts2datetime(message.ts);
            msgObj['ts'] = message.ts;
            msgObj['replies'] = 0;
            msgObj['index'] = index++;
            msgObj['user'] = message.user;
            msgObj['threads'] = [];
            if (message.thread_ts) {
                const threadResult = await client.conversations.replies({
                    channel: channelId,
                    ts: message.thread_ts
                });
                msgObj['replies'] = message.reply_count;
                msgObj['reply_users'] = message.reply_users;

                msgObj['threads'] = threadResult.messages.map(msg => {
                    if (filters.keywords && msg.text?.includes(filters.keywords))
                        isMatch = true;
                    return {
                        text: msg.text,
                        ts: ts2datetime(msg.ts),
                        user: msg.user
                    };
                });
            }

            if (isBackUp) {
                const member = members[message.user];
                const realname = member ? member.real_name : message.user;
                addIndex({
                    index: config.ELASTIC_INFO.SLACK_INDEX,
                    id: `${backupId}_${message.ts}`,
                    body: {
                        userId, //deprecated
                        owner,
                        createdBy,
                        teamId,
                        teamName,
                        channelId,
                        channelName,
                        message: message.text,
                        startedBy: message.user,
                        realname,
                        created: ts2datetime(message.ts),
                        files: msgObj['files'],
                        replies: msgObj['threads'],
                        backupId
                    }
                });
            }

            if (!filters.keywords || isMatch) { // Only add if no filter or isMatch
                result.push(msgObj);
            }
        }
    } catch (error) {
        if (error.data && error.data.error === 'ratelimited' && retryCnt < 30) {
            const delay = Number(error.response.headers['retry-after']) * 1000 * 5;
            await new Promise(resolve => setTimeout(resolve, delay));
            retryCnt += 1;
            return await exports.getConversationHistoryWithThreads2(data); // Retry with the same data
        } else {
            // console.log(error, message.blocks)
            throw error;
        }
    }

    if (isBackUp) return { newBackupFileSize, result, hasMore, cursor: newCursor };

    return { result, hasMore, cursor: newCursor };
};

exports.getThreads = async (client, channelId) => {
    const resultArray = []
    try {
        // Call the conversations.history method using WebClient
        const result = await client.conversations.history({
            channel: channelId
        })

        const conversationHistory = result.messages
        conversationHistory.forEach(async msg => {
            const msgObj = {
                user: msg['user'],
                messages: msg['text'],
                ts: msg['ts']
            }
            const threads = await client.conversations.replies({
                channel: channelId,
                ts: msg['ts']
            })
        })
    } catch (error) {
        console.error(error)
    }

    return resultArray
}

exports.get30DayFreeTrialEndDate = () => {
    const currentDate = new Date()

    const trialEndDate = new Date(currentDate)
    trialEndDate.setDate(currentDate.getDate() + 30)

    return trialEndDate
}

exports.formatSizeUnits = bytes => {
    let formatted = ''
    if (bytes >= 1073741824) {
        formatted = (bytes / 1073741824).toFixed(2) + ' GB'
    } else if (bytes >= 1048576) {
        formatted = (bytes / 1048576).toFixed(2) + ' MB'
    } else if (bytes >= 1024) {
        formatted = (bytes / 1024).toFixed(2) + ' KB'
    } else if (bytes > 1) {
        formatted = bytes + ' bytes'
    } else if (bytes === 1) {
        formatted = bytes + ' byte'
    } else {
        formatted = '0 bytes'
    }

    return formatted
}

exports.getObjectBytes = obj => {
    const strSize = JSON.stringify(obj)
    return new TextEncoder().encode(strSize).length
}

exports.getDirectorySize = async (dirPath, isRecuse = false) => {
    let totalSize = 0

    // Read all items in the directory
    try {
        const items = await readdir(dirPath)

        // Loop through each item
        for (let item of items) {
            // Get the full path of the item
            const fullPath = path.join(dirPath, item)

            // Get the stats of the item
            const stats = await stat(fullPath)

            // Check if the item is a directory
            if (isRecuse && stats.isDirectory()) {
                // If it's a directory, get its size recursively
                totalSize += await getDirectorySize(fullPath)
            } else {
                // If it's a file, add its size to the total
                totalSize += stats.size
            }
        }
    } catch (error) {
        console.log(error)
    }

    return totalSize
}

exports.generateTwoFactorCode = () => Math.floor(1000 + Math.random() * 9000).toString()

exports.getGeolocation = async ipAddress => {
    const resp = await axios.get(`http://ip-api.com/json/${ipAddress}`)
    return resp.data
}

exports.fetchGraphAPIData = async (accessToken, filters, processBatch, orgId, onTokenRefresh) => {
    let headers = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    };

    let query = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(filters.userEmail)}/messages`;

    // Construct filter query for keywords
    if (filters.keywords) {
        const keywordsArray = filters.keywords.split(',').map(kw => kw.trim());
        const keywordFilters = keywordsArray.map(kw => `(contains(subject, '${encodeURIComponent(kw)}')${filters.filterWithContent ? ` or contains(body/content, '${encodeURIComponent(kw)}')` : ''})`).join(' or ');
        query += `?$filter=${keywordFilters}`;
    }

    // Add filter for date range
    if (filters.filterByDateRange) {
        const dateFilter = `(receivedDateTime ge ${filters.dateRange.start} and receivedDateTime le ${filters.dateRange.end})`;
        query += filters.keywords ? ` and ${dateFilter}` : `?$filter=${dateFilter}`;
    }

    let retryCount = 0;
    const fetchWithRetry = async (currentQuery) => {
        while (retryCount < 100) {
            try {
                let moreDataAvailable = true;
                while (moreDataAvailable) {
                    console.log("==================Getting GraphAPI Data================");
                    const response = await axios.get(currentQuery, { headers });
                    const data = response.data;
                    console.log("...Processing batch...")
                    await processBatch(data.value);
                    retryCount = 0;
                    if (data['@odata.nextLink']) {
                        currentQuery = data['@odata.nextLink'];
                    } else {
                        moreDataAvailable = false;
                    }
                }
                return; // Successful fetch
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    // Token expired, refresh it
                    console.log("// Token expired, refresh it //")
                    const newToken = await ms365Controller.getAccessToken(orgId);
                    if (!newToken) {
                        throw new Error('Failed to refresh token');
                    }
                    headers.Authorization = `Bearer ${newToken}`;
                    console.log("New Token: ", newToken)
                    await onTokenRefresh(newToken);
                } else {
                    retryCount++;
                    console.log(`Attempt ${retryCount} failed, retrying in 1 minute...`, error);
                    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait for 1 minute
                }
            }
        }
        throw new Error('Failed to fetch data after 100 attempts');
    };

    await fetchWithRetry(query);
};

// Helper function to handle rate-limited Graph API requests
exports.fetchGraphAPIWithRateLimit = async (url, params, onTokenRefresh, orgId) => {
    let retryCount = 0;

    while (retryCount < 100) {
        try {
            const response = await axios.get(url, params);
            return response.data;
        } catch (error) {
            if (error.response) {
                const status = error.response.status;

                // Handle rate limit error (429)
                if (status === 429) {
                    const retryAfter = error.response.headers['retry-after'];
                    const waitTime = (retryAfter ? parseInt(retryAfter) : Math.pow(2, retryCount)) * 1000;
                    console.log(`Rate limit reached. Waiting ${waitTime / 1000} seconds before retrying...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    retryCount++;
                }
                // Handle token expiration (401)
                else if (status === 401) {
                    console.log("// Token expired, refresh it //");
                    const newToken = await ms365Controller.getAccessToken(orgId);
                    if (!newToken) throw new Error('Failed to refresh token');
                    headers.Authorization = `Bearer ${newToken}`;
                    await onTokenRefresh(newToken);
                } else {
                    retryCount++;
                    console.log(`Attempt ${retryCount} failed, retrying in 1 minute...`, error);
                    await new Promise(resolve => setTimeout(resolve, 60000));
                }
            } else {
                console.error("Unexpected error:", error);
                throw error;
            }
        }
    }
    throw new Error('Failed to fetch data after 100 attempts');
};

exports.fetchAllFolders = async (accessToken, userEmail, orgId, onTokenRefresh) => {
    const fetchFolders = async (parentFolderId = null, currentPath = '') => {
        const folderQuery = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userEmail)}/mailFolders${parentFolderId ? `/${parentFolderId}/childFolders` : ''}`;
        let allFolders = [];

        // Use the helper function for rate-limited requests
        const foldersData = await exports.fetchGraphAPIWithRateLimit(folderQuery, {headers: { Authorization: `Bearer ${accessToken}` }}, onTokenRefresh, orgId);
        for (let folder of foldersData.value) {
            const folderPath = currentPath ? `${currentPath}/${folder.displayName}` : folder.displayName;
            allFolders.push({ id: folder.id, path: folderPath });
            const childFolders = await fetchFolders(folder.id, folderPath);
            allFolders = allFolders.concat(childFolders);
        }
        return allFolders;
    };

    return await fetchFolders();
};

exports.fetchGraphAPIData2 = async ({ accessToken, orgId, apiEndpoint, queryParameters = '', processData, onTokenRefresh }) => {
    let headers = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    };

    let query = `${apiEndpoint}?${queryParameters}`;

    let retryCount = 0;
    const fetchWithRetry = async (currentQuery) => {
        while (retryCount < 100) {
            try {
                let moreDataAvailable = true;
                while (moreDataAvailable) {
                    console.log("==================Getting GraphAPI Data================");
                    const response = await axios.get(currentQuery, { headers });
                    const data = response.data;
                    console.log("...Processing data...");
                    await processData(data);
                    retryCount = 0;
                    if (data['@odata.nextLink']) {
                        currentQuery = data['@odata.nextLink'];
                    } else {
                        moreDataAvailable = false;
                    }
                }
                return; // Successful fetch
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    // Token expired, refresh it
                    console.log("// Token expired, refresh it //");
                    const newToken = await ms365Controller.getAccessToken(orgId);
                    if (!newToken) {
                        throw new Error('Failed to refresh token');
                    }
                    headers.Authorization = `Bearer ${newToken}`;
                    console.log("New Token: ", newToken);
                    await onTokenRefresh(newToken);
                } else {
                    retryCount++;
                    console.log(`Attempt ${retryCount} failed, retrying in 1 minute...`, error);
                    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait for 1 minute
                }
            }
        }
        throw new Error('Failed to fetch data after 100 attempts');
    };

    await fetchWithRetry(query);
};

exports.fetchOutlookMessages = async (accessToken, filters, orgId, onTokenRefresh, processBatch) => {
    const folderQuery = filters.folderId ? `/mailFolders/${filters.folderId}/messages` : '/messages';
    // const queryParameters = `?$filter=${filters.keywords ? filters.keywords.split(',').map(kw => `(contains(subject, '${encodeURIComponent(kw.trim())}') or contains(body/content, '${encodeURIComponent(kw.trim())}'))`).join(' or ') : ''}${filters.filterByDateRange ? (filters.keywords ? ' and ' : '') + `(receivedDateTime ge ${filters.dateRange.start} and receivedDateTime le ${filters.dateRange.end})` : ''}`;
    let queryParameters = ''
    let searchApplied = false;
    let searchString = ""
    // Construct search query for keywords in subject and/or body
    if (filters.keywords) {
        const keywordsArray = filters.keywords.split(',').map(kw => kw.trim());
        const searchQueryParts = [];
        keywordsArray.forEach(kw => {
            searchQueryParts.push(`subject:${kw}`);
            searchQueryParts.push(`attachment:${kw}`);
            if (filters.filterWithContent) {
                searchQueryParts.push(`body:${kw}`);
            }
        });
        searchString = searchQueryParts.join(' OR ');
        searchApplied = true;
    }

    // // Construct filter query for attachment name
    // if (filters.attachmentName) {
    //     const attachFilter = 'hasAttachments eq true';
    //     query += searchApplied ? ` AND ${attachFilter}` : `&$filter=${attachFilter}`;
    // }

    // Add filter for date range
    if (filters.filterByDateRange) {
        const startDate = new Date(filters.dateRange.start).toLocaleDateString();
        const endDate = new Date(filters.dateRange.end).toLocaleDateString();
        const dateFilter = `received>=${startDate} AND received<=${endDate}`;
        searchApplied = true
        if (searchString) {
            searchString += ' AND ' + dateFilter
        } else {
            searchString = dateFilter
        }
        // query += searchApplied || filters.attachmentName ? ` and ${dateFilter}` : `&$filter=${dateFilter}`;
    }
    if (searchApplied)
        queryParameters = `?$search="${searchString}"`;
    try {
        await exports.fetchGraphAPIData2({
            accessToken,
            orgId,
            apiEndpoint: `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(filters.userEmail)}${folderQuery}`,
            queryParameters,
            processData: async (data) => {
                await processBatch(data.value);
            },
            onTokenRefresh
        });
    } catch (error) {
        console.log("fetchOutlookMessages error: ", error)
    }
};

exports.fetchGraphOneDriveAPIData = async (accessToken, filters, archiveId) => {
    const listItemsInFolder = async (accessToken, userId, folderId = 'root') => {
        const url = `https://graph.microsoft.com/v1.0/users/${userId}/drive/items/${folderId}/children`
        try {
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })
            return response.data.value
        } catch (error) {
            console.error('Error listing items in folder', error)
            return []
        }
    }
    const downloadFiles = (itemId, fileName, fileDownloadUrl) => {
        if (itemId && fileDownloadUrl && fileName) {
            const directoryPath = path.join(__dirname, '../download', archiveId.toString(), itemId.toString())
            if (!fs.existsSync(directoryPath)) {
                fs.mkdirSync(directoryPath, { recursive: true })
            }

            fetch(fileDownloadUrl)
                .then(response => {
                    const dest = fs.createWriteStream(path.join(directoryPath, fileName))
                    response.body.pipe(dest)

                    dest.on('finish', () => {
                        console.log('File downloaded successfully')
                    })

                    dest.on('error', err => {
                        console.error('Error saving file:', err)
                    })
                })
                .catch(error => {
                    console.error('Error downloading file:', error)
                })
        }
    }

    async function buildFileTree(accessToken, userId, folderId = 'root', path = '') {
        const items = await listItemsInFolder(accessToken, userId, folderId)
        const nodePromises = items.map(async item => {
            const node = {
                id: item.id,
                baseId: archiveId,
                name: item.name,
                path: `${path}/${item.name}`,
                isFolder: item.folder !== undefined,
                downloadUrl: item.folder !== undefined ? '' : item['@microsoft.graph.downloadUrl']
            }
            if (!node.isFolder && node.downloadUrl) {
                downloadFiles(node.id, node.name, node.downloadUrl)
            }

            if (node.isFolder) {
                node.children = await buildFileTree(accessToken, userId, item.id, node.path)
            }

            return node
        })

        return Promise.all(nodePromises)
    }

    return await buildFileTree(accessToken, filters.userEmail)
}

exports.fetchGraphOneDriveAPIData2 = async (accessToken, filters, archiveId, ms365Workspace, oneDriveArchive) => {
    let totalSize = 0
    const listItemsInFolder = async (accessToken, userId, folderId = 'root') => {
        const url = `https://graph.microsoft.com/v1.0/users/${userId}/drive/items/${folderId}/children`
        try {
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            return response.data.value;
        } catch (error) {
            console.error('Error listing items in folder', error);
            return [];
        }
    };

    const downloadFiles = async (itemId, fileName, fileDownloadUrl) => {
        if (itemId && fileDownloadUrl && fileName) {
            try {
                const response = await axios({
                    url: fileDownloadUrl,
                    method: 'GET',
                    responseType: 'stream'
                });

                const s3Key = `${archiveId}/${itemId}/${fileName}`;
                const passThroughStream = new PassThrough();

                response.data.pipe(passThroughStream);
                await AWS.uploadFileStream(config.AWS.OUTLOOK_BUCKET, s3Key, passThroughStream);
            } catch (error) {
                console.error('Error downloading or uploading file:', error);
            }
        }
    };

    async function buildFileTree(accessToken, userId, folderId = 'root', path = '') {
        const items = await listItemsInFolder(accessToken, userId, folderId);
        const nodePromises = items.map(async item => {
            totalSize += item.size || 0
            const node = {
                id: item.id,
                baseId: archiveId,
                name: item.name,
                path: `${path}/${item.name}`,
                s3Key: `${archiveId}/${item.id}/${item.name}`,
                isFolder: item.folder !== undefined,
                downloadUrl: item.folder !== undefined ? '' : item['@microsoft.graph.downloadUrl'],
                size: item.size
            };
            if (!node.isFolder && node.downloadUrl) {
                // Get versions of item

                await downloadFiles(node.id, node.name, node.downloadUrl);
                item.hash = exports.generateHash(item)
                item.workspaceName = ms365Workspace.displayName;
                item.userId = ms365Workspace.clientId;
                item.archiveId = archiveId;
                item.createdAt = oneDriveArchive.createdAt;
                item.archiveName = filters.jobName;

                addIndex({
                    index: config.ELASTIC_INFO.ONEDRIVE_INDEX,
                    id: `${archiveId}_${item.id}`,
                    body: item
                })
            }

            if (node.isFolder) {
                node.children = await buildFileTree(accessToken, userId, item.id, node.path);
            }

            return node;
        });

        return Promise.all(nodePromises);
    }

    const fileTree = await buildFileTree(accessToken, filters.userEmail);
    return { data: fileTree, totalSize };
};

// Deprecated
exports.fetchGraphGmailAPIData = async filters => {
    let keyword = ''
    if (filters.keywords) {
        const keywordsArray = filters.keywords.split(',').map(kw => kw.trim())
        const keywordFilters = keywordsArray.join(' OR ')
        keyword = keywordFilters
    }
    let startDate = ''
    let endDate = ''
    if (filters.filterByDateRange) {
        startDate = filters.dateRange.start
        startDate = startDate.slice(0, 10)
        endDate = filters.dateRange.end
        endDate = endDate.slice(0, 10)
    }

    let after = ''
    let before = ''
    if (startDate !== '') after = `after:${startDate}`
    if (endDate !== '') before = `before:${endDate}`
    const query = `"${keyword}" ${after} ${before}`
    console.log('archive filter query:', query)

    const auth = await google.auth.getClient({
        keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
        scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
        clientOptions: { subject: filters.userEmail }
    })
    const gmail = google.gmail({ version: 'v1', auth })
    let retryCount = 0
    let allData = []

    const fetchWithRetry = async () => {
        while (retryCount < 2) {
            try {
                let moreDataAvailable = true
                const requestData = {
                    userId: 'me',
                    maxResults: 10,
                    q: query,
                    pageToken: ''
                }
                while (moreDataAvailable) {
                    try {
                        const gmailResponse = await gmail.users.messages.list(requestData)
                        const messagesDetails = await Promise.all(
                            gmailResponse.data.messages.map(message =>
                                gmail.users.messages.get({
                                    userId: 'me',
                                    id: message.id,
                                    format: 'metadata',
                                    metadataHeaders: ['From', 'Subject', 'Date']
                                })
                            )
                        )
                        const messageList = messagesDetails.map(res => res.data)
                        allData = allData.concat(messageList)
                        if (gmailResponse.data.nextPageToken) {
                            requestData.pageToken = gmailResponse.data.nextPageToken
                        } else {
                            moreDataAvailable = false
                        }
                    } catch (e) {
                        console.log('filter err:', e)
                        moreDataAvailable = false
                    }
                }
                return allData // Successful fetch
            } catch (error) {
                console.log(error)
                retryCount++
                console.log(`Attempt ${retryCount} failed, retrying in 1 minute...`)
                await new Promise(resolve => setTimeout(resolve, 60000)) // Wait for 1 minute
            }
        }

        throw new Error('Failed to fetch data after 2 attempts')
    }

    const messages = await fetchWithRetry()
    return messages
}

// added by dmytro at 08/25/2024

// Utility function to wait for a specified amount of time (in ms)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryWithBackoff = async (
  fn, 
  maxRetries = 5, 
  initialDelay = 1000, 
  maxDelay = 30000
) => {
  let attempt = 0;
  let delay = initialDelay;

  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      
      // Check for Google API rate limit errors (403 with specific codes)
      const isRateLimitError = 
        error.code === 403 && 
        (
          error.errors?.[0]?.reason === 'rateLimitExceeded' ||
          error.errors?.[0]?.reason === 'userRateLimitExceeded' ||
          error.response?.data?.error?.errors?.[0]?.reason === 'rateLimitExceeded'
        );
      
      if (!isRateLimitError || attempt >= maxRetries) {
        throw error; // Re-throw if not retryable or max retries reached
      }
      
      // Add jitter (randomness) to avoid synchronized retries
      const jitter = delay * 0.2 * Math.random();
      const actualDelay = Math.min(delay + jitter, maxDelay);
      
      console.log(`Google API rate limited (${error.errors?.[0]?.reason}). Retry ${attempt}/${maxRetries} in ${Math.round(actualDelay)}ms`);
      await sleep(actualDelay);
      delay = Math.min(delay * 2, maxDelay);
    }
  }
};

// Function to download an attachment and save it to a file
const uplaodAttachmentToS3 = async (auth, messageId, attachmentId, gmail, s3Key) => {
  const attachmentData = await retryWithBackoff(async () => {
    return gmail.users.messages.attachments.get({
      userId: 'me',
      messageId: messageId,
      id: attachmentId,
      auth: auth
    });
  });
  try {
      const decodedAttachment = Buffer.from(attachmentData?.data?.data, 'base64');
      await AWS.uploadFile(config.AWS.OUTLOOK_BUCKET, s3Key, decodedAttachment)

      console.log(`Gmail Attachment saved to ${s3Key}`);
      return decodedAttachment.length
  } catch (error) {
    console.log("Error: Uploading gmail attachment to s3bucket->", error)
  }

  return 0
};

// Function to retrieve all attachments from an email
const getAttachments = async (auth, messageId, parts, archiveId, gmail, workspaceId, owner, createdBy) => {
  let attachments = [];
  for (const part of parts) {
    if (part.filename && part.body && part.body.attachmentId) {
      const s3Key = `Google/Gmail/${archiveId}/${part.body.attachmentId}/${part.filename}`; // Save to a s3bucket
      await uplaodAttachmentToS3(auth, messageId, part.body.attachmentId, gmail, s3Key);
      
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType,
        attachmentId: part.body.attachmentId,
        size: part.body.size,
        s3Key // Return the file path instead of raw data
      });

      //Add queue to index file contents to ElasticSearch
        await exports.addIndexQueue('Gmail', {
            workspaceId,
            archiveId,
            fileId: part.body.attachmentId,
            fileName: part.filename,
            fileType: part.mimeType,
            size: part.body.size,
            s3Key,
            owner: owner,
            collectedBy: createdBy
        })
    }
    if (part.parts) {
      const nestedAttachments = await getAttachments(auth, messageId, part.parts, archiveId, gmail, workspaceId, owner, createdBy);
      if (nestedAttachments.length > 0) {
          attachments = attachments.concat(nestedAttachments);
      }
    }
  }
  return attachments;
};

// Function to retrieve the email content and attachments
const getHtmlPart = (parts) => {
  if (!parts) return ''
  const part = parts.find(part => part.mimeType === 'text/html' || part.parts);
  if (part) {
    if (part.mimeType === 'text/html') {
      return part.body.data;
    }
    if (part.parts) {
      return getHtmlPart(part.parts);
    }
  }
  return null;
};

const getGmailDetail = async (auth, message, archiveId, gmail, workspaceId, owner, createdBy) => {

  const getSafeHTMLContent = async (auth, emailData, archiveId, gmail, workspaceId, owner, createdBy) => {
    if (!emailData) return '';
    const payload = emailData.payload;

    let body;
    if (payload.mimeType === 'text/html') {
      body = payload.body?.data;
    } else {
      body = getHtmlPart(payload.parts);
    }

    // Get all attachments with rate limit handling
    const attachments = await getAttachments(auth, emailData.id, payload.parts || [], archiveId, gmail, workspaceId, owner, createdBy);
    let totalSize = 0
    attachments.forEach((attachment) => totalSize += parseInt(attachment.size))

    const decodedHtml = Buffer.from(body || '', 'base64');
    return {
      id: emailData.id,
      threadId: emailData.threadId,
      historyId: emailData.historyId,
      labels: emailData.labelIds,
      preview: emailData.snippet,
      size: emailData.sizeEstimate,
      from: payload.headers.find(header => header.name === 'From')?.value,
      to: payload.headers.find(header => header.name === 'To')?.value,
      subject: payload.headers.find(header => header.name === 'Subject')?.value,
      date: new Date(payload.headers.find(header => header.name === 'Date')?.value),
      msg: decodedHtml.toString('utf8'),
      attachments: attachments, // File paths instead of raw data
      attachmentsSize: totalSize
    };
  };

  return await getSafeHTMLContent(auth, message, archiveId, gmail, workspaceId, owner, createdBy);
};

exports.fetchGraphGmailAPIData2 = async (gmailArchive, filters, googleWorkspace) => {
    
    // Initialize authentication
    let auth;
    if (googleWorkspace.isPersonal) {
        googleOAuth.setCredentials(googleWorkspace.accessToken);
        auth = googleOAuth;
    } else {
        auth = await google.auth.getClient({
            keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
            scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
            clientOptions: { subject: filters.userEmail },
        });
    }
    const gmail = google.gmail({ version: 'v1', auth });

    // Build search query
    const keyword = filters.keywords 
        ? filters.keywords.split(',').map(kw => kw.trim()).join(' OR ')
        : '';
    
    const startDate = filters.filterByDateRange ? filters.dateRange.start.slice(0, 10) : '';
    const endDate = filters.filterByDateRange ? filters.dateRange.end.slice(0, 10) : '';
    
    const query = `"${keyword}" ${startDate ? `after:${startDate}` : ''} ${endDate ? `before:${endDate}` : ''}`;
    console.log('Gmail search query:', query);

    // Message processing queue
    let messageQueue = [];
    let totalSize = 0;
    let processedCount = 0;

    // Process a batch of messages
    const processBatch = async () => {
        if (messageQueue.length === 0) return;

        console.log(`Processing batch of ${messageQueue.length} messages...`);
        
        try {
            let totalAttachmentsSize = 0;
            const newMsgs = [];
            const messageIds = [];

            // Process each message in the queue
            for (const val of messageQueue) {
                const originVal = { ...val };
                val.body = val.msg ? exports.html2plainText(val.msg) : '';
                val.archiveId = gmailArchive.id;
                val.userId = gmailArchive.clientId;
                val.owner = filters.owner;
                val.createdBy = filters.createdBy;
                val.createdAt = gmailArchive.createdAt;
                val.archiveName = filters.jobName;
                val.hash = exports.generateHash(originVal);
                val.msg = undefined;
                
                totalAttachmentsSize += val.attachmentsSize || 0;
                
                // Add to ElasticSearch
                addIndex({
                    index: config.ELASTIC_INFO.GMAIL_INDEX,
                    id: `${gmailArchive.id}_${val.id}`,
                    body: val,
                });

                originVal.hash = val.hash;
                newMsgs.push(originVal);
                messageIds.push({ id: val.id, attachments: val.attachments });
            }

            // Calculate batch size
            const batchSize = messageQueue.reduce((acc, msg) => acc + (exports.getObjectBytes(msg) || 0), 0);
            totalSize += batchSize + totalAttachmentsSize;

            // Save backup data
            const backupId = new ObjectId().toHexString();
            const { dataId } = await exports.saveLargeData(newMsgs, backupId);

            // Update database records
            await Promise.all([
                GmailArchive.updateOne(
                    { _id: gmailArchive._id },
                    {
                        $push: { backups: dataId },
                        $inc: { 
                            size: batchSize + totalAttachmentsSize, 
                            totalCount: messageQueue.length 
                        },
                    }
                ),
                BackupMessages.create({
                    archiveId: gmailArchive.id,
                    backupId,
                    dataId,
                    messageIds,
                }),
                ArchiveState.updateOne(
                    { _id: filters.stateId }, 
                    { $inc: { processedCount: messageQueue.length } }
                )
            ]);

            processedCount += messageQueue.length;
            console.log(`Processed ${messageQueue.length} messages (total: ${processedCount})`);
            messageQueue = [];
        } catch (batchError) {
            console.error('Error processing batch:', batchError);
            throw batchError;
        }
    };

    // Fetch messages with retry logic
    const fetchMessages = async () => {
        let retryCount = 0;
        const maxRetries = 5;
        let delay = 1000; // Initial delay in ms
        let nextPageToken = '';

        while (retryCount < maxRetries) {
            try {
                do {
                    try {
                        // List messages
                        const listResponse = await gmail.users.messages.list({
                            userId: 'me',
                            maxResults: 100,
                            q: query,
                            pageToken: nextPageToken,
                        });

                        if (!listResponse.data.messages || listResponse.data.messages.length === 0) {
                            nextPageToken = '';
                            break;
                        }

                        // Process messages in smaller batches to avoid timeouts
                        const batchSize = 20;
                        for (let i = 0; i < listResponse.data.messages.length; i += batchSize) {
                            const batch = listResponse.data.messages.slice(i, i + batchSize);
                            
                            const messagesDetails = await Promise.all(
                                batch.map(message => 
                                    retryWithBackoff(() => 
                                        gmail.users.messages.get({
                                            userId: 'me',
                                            id: message.id,
                                            metadataHeaders: ['From', 'Subject', 'Date'],
                                        }),
                                        3, // retry attempts
                                        1000 // initial delay
                                    )
                                )
                            );

                            const resolvedMessages = await Promise.all(
                                messagesDetails.map(res => 
                                    getGmailDetail(
                                        auth, 
                                        res.data, 
                                        gmailArchive.id, 
                                        gmail, 
                                        googleWorkspace.id, 
                                        filters.owner, 
                                        filters.createdBy
                                    )
                                )
                            );

                            messageQueue.push(...resolvedMessages);

                            // Process batch if queue is large enough
                            if (messageQueue.length >= 300) {
                                await processBatch();
                            }
                        }

                        nextPageToken = listResponse.data.nextPageToken || '';
                    } catch (pageError) {
                        console.error('Error processing page:', pageError);
                        if (isRateLimitError(pageError)) {
                            const waitTime = Math.min(delay * (1 + Math.random()), 60000); // Max 60s
                            console.log(`Rate limited. Waiting ${Math.round(waitTime/1000)} seconds...`);
                            await sleep(waitTime);
                            delay *= 2;
                            continue; // Retry same page
                        }
                        throw pageError;
                    }
                } while (nextPageToken);

                // Process any remaining messages
                if (messageQueue.length > 0) {
                    await processBatch();
                }

                return totalSize;
            } catch (error) {
                retryCount++;
                console.error(`Attempt ${retryCount} failed:`, error.message);

                if (retryCount >= maxRetries) {
                    throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
                }

                const waitTime = Math.min(delay * (1 + Math.random()), 60000); // Max 60s
                console.log(`Waiting ${Math.round(waitTime/1000)} seconds before retry...`);
                await sleep(waitTime);
                delay *= 2;
            }
        }
    };

    // Helper function to check for rate limit errors
    const isRateLimitError = (error) => {
        return error.code === 403 && (
            error.errors?.[0]?.reason === 'rateLimitExceeded' ||
            error.errors?.[0]?.reason === 'userRateLimitExceeded' ||
            error.response?.data?.error?.errors?.[0]?.reason === 'rateLimitExceeded'
        );
    };

    return await fetchMessages();
};

// Deprecated
exports.fetchGraphDriveAPIData = async (filters, baseId) => {
    const getFileData = async userId => {
        try {
            const auth = await google.auth.getClient({
                keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
                scopes: ['https://www.googleapis.com/auth/drive.readonly'],
                clientOptions: { subject: userId }
            })
            const drive = google.drive({
                version: 'v3',
                auth
            })
            try {
                const response = await drive.files.list({
                    pageSize: 100,
                    fields: 'nextPageToken, files(id, name, mimeType, parents)',
                    q: "'me' in owners"
                })

                const files = response.data.files
                if (files.length) {
                    return files
                } else {
                    return []
                }
            } catch (error) {
                console.log('get google drive err:', error)
                return []
            }
        } catch (err) {
            console.log('using google service err:', err)
            return []
        }
    }

    const downloadFiles = async item => {
        const itemId = item.id
        const fileName = item.name
        if (itemId && fileName && item.mimeType !== 'application/vnd.google-apps.folder') {
            const auth = await google.auth.getClient({
                keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
                scopes: ['https://www.googleapis.com/auth/drive.readonly'],
                clientOptions: { subject: filters.userEmail }
            })
            const drive = google.drive({
                version: 'v3',
                auth
            })
            try {
                const directoryPath = path.join(__dirname, '../download/googleDrive', baseId.toString(), itemId.toString())
                if (!fs.existsSync(directoryPath)) {
                    fs.mkdirSync(directoryPath, { recursive: true })
                }

                const dest = fs.createWriteStream(path.join(directoryPath, fileName))
                drive.files.get(
                    {
                        fileId: itemId,
                        alt: 'media'
                    },
                    {
                        responseType: 'stream'
                    },
                    (err, { data }) => {
                        if (err) {
                            console.error('Error downloading file:', err)
                        }
                        data.on('end', () => {
                            console.log('File download completed:', directoryPath)
                        })
                            .on('error', err => {
                                console.error('Error during file download:', err)
                            })
                            .pipe(dest)
                    }
                )
            } catch (error) {
                console.error('Error with Google Drive API:', error)
            }
        }
    }

    async function buildTree(userId) {
        const items = await getFileData(userId)

        const itemMap = {}
        const tree = []

        items.forEach(item => {
            itemMap[item.id] = { ...item, children: [], baseId: baseId }
        })

        await Promise.all(items.map(downloadFiles))

        items.forEach(item => {
            if (item.parents && item.parents.length) {
                item.parents.forEach(parentId => {
                    if (itemMap[parentId]) {
                        itemMap[parentId].children.push(itemMap[item.id])
                    } else {
                        tree.push(itemMap[item.id])
                    }
                })
            } else {
                tree.push(itemMap[item.id])
            }
        })

        function setPath(node, basePath = '') {
            const path = `${basePath}/${node.name}`
            node.path = path
            node.isFolder = node.mimeType === 'application/vnd.google-apps.folder'
            node.children.forEach(child => setPath(child, path))
        }

        tree.forEach(root => setPath(root))

        return tree
    }

    return await buildTree(filters.userEmail)
}

exports.fetchGraphDriveAPIData_v2 = async (filters, baseId, addElasticIndex, googleWorkspace) => {
    let totalSize = 0
    const getFileData = async (userId, filters) => {
        try {
            let auth;
            if (googleWorkspace.isPersonal) {
                auth = googleOAuth.setCredentials(googleWorkspace.accessToken)
            } else {
                auth = await google.auth.getClient({
                    keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
                    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
                    clientOptions: { subject: userId }
                });
            }
            const drive = google.drive({
                version: 'v3',
                auth
            });

            let files = [];
            let pageToken = null;

            // Build query string for filters
            let query = "'me' in owners";  // Base query to get files owned by the user

            if (filters.keywords) {
                query += ` and name contains '${filters.keywords}'`;
            }
            if (filters.filterByDateRange) {
                query += ` and createdTime >= '${filters.dateRange.start}' and createdTime <= '${filters.dateRange.end}'`;
            }
            if (filters.modifiedTime) {
                query += ` and modifiedTime >= '${filters.dateRange.start}' and modifiedTime <= '${filters.dateRange.end}'`;
            }

            do {
                try {
                    const response = await drive.files.list({
                        pageSize: 100,
                        fields: 'nextPageToken, files(id, name, mimeType, parents, size, createdTime, modifiedTime, md5Checksum, thumbnailLink)',
                        q: query,
                        pageToken: pageToken,
                    });

                    files = files.concat(response.data.files);
                    pageToken = response.data.nextPageToken;
                } catch (error) {
                    console.log('Error fetching Google Drive files:', error);
                    break;
                }
            } while (pageToken);

            return files.length ? files : [];
        } catch (err) {
            console.log('Error using Google service:', err);
            return [];
        }
    };

    const flattenDriveDataAndDownload = async (files, userEmail) => {
        const tree = [];
        const map = {};

        // Create map of file and folder nodes, and download files in the same loop
        await Promise.all(files.map(async file => {
            console.log("*************File************")
            console.log(file)
            const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
            map[file.id] = {
                key: file.id,
                label: file.name,
                data: {
                    label: file.name,
                    size: file.size || 0, // raw size for filtering
                    type: isFolder ? 'Folder' : file.mimeType,
                    createdTime: file.createdTime,
                    modifiedTime: file.modifiedTime,
                    md5Checksum: file.md5Checksum || 'N/A',
                    thumbnailLink: file.thumbnailLink || null
                },
                icon: isFolder ? 'pi pi-fw pi-folder' : 'pi pi-fw pi-file',
                children: []
            };

            // Download the file and upload it directly to S3
            if (!isFolder) {
                let auth;
                if (googleWorkspace.isPersonal) {
                    auth = googleOAuth.setCredentials(googleWorkspace.accessToken)
                } else {
                    auth = await google.auth.getClient({
                        keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
                        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
                        clientOptions: { subject: userEmail }
                    });
                }

                const drive = google.drive({ version: 'v3', auth });

                try {
                    let response;
                    if (googleMimeTypes.includes(file.mimeType)) {
                        let exportMime;
                        switch(file.mimeType) {
                            case 'application/vnd.google-apps.document':
                                exportMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                                break;
                            case 'application/vnd.google-apps.spreadsheet':
                                exportMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                                break;
                            case 'application/vnd.google-apps.presentation':
                                exportMime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
                                break;
                            default:
                                exportMime = 'application/pdf';
                        }
        
                        response = await drive.files.export({
                            fileId: file.id,
                            mimeType: exportMime
                        }, { responseType: 'stream' });
                    } else {
                        response = await drive.files.get(
                            { fileId: file.id, alt: 'media' },
                            { responseType: 'stream' }
                        );
                    }
                    const s3Key = `${baseId}/${file.id}/${file.name}`;
                    map[file.id].data.s3Key = s3Key
                    const passStream = new PassThrough();
                    response.data.pipe(passStream);
                    await AWS.uploadFileStream(config.AWS.OUTLOOK_BUCKET, s3Key, passStream);
                    console.log(`File uploaded to S3: ${s3Key}`);

                    //Add queue to index file contents to ElasticSearch
                    await exports.addIndexQueue('GDrive', {
                        workspaceId: googleWorkspace.id,
                        archiveId: baseId,
                        fileId: file.id,
                        fileName: file.name,
                        fileType: file.mimeType,
                        size: file.size,
                        s3Key,
                        owner: filters.owner,
                        collectedBy: filters.createdBy
                    })

                } catch (error) {
                    console.error('Error downloading file from Google Drive:', error);
                }

                totalSize += parseInt(file.size)
            }
            console.log("BaseID: ", baseId)
            await ArchiveState.updateOne({ archiveId: baseId }, { $inc: { processedCount: 1 } });
        }));

        // Link each item with its parent
        files.forEach(file => {
            addElasticIndex(file)
            if (file.parents && file.parents.length > 0) {
                const parentId = file.parents[0];
                if (map[parentId]) {
                    map[parentId].children.push(map[file.id]);
                } else {
                    tree.push(map[file.id]);
                }
            } else {
                tree.push(map[file.id]);
            }
        });

        return tree;
    };

    const files = await getFileData(filters.userEmail, filters);
    const data = await flattenDriveDataAndDownload(files, filters.userEmail);
    console.log("Google drive total size: ", totalSize)
    return {data, totalSize};
};

exports.removeEmptyFields = obj => {
    if (Array.isArray(obj)) {
        return obj.map(removeEmptyFields).filter(item => item !== undefined)
    } else if (obj !== null && typeof obj === 'object') {
        return Object.entries(obj)
            .map(([key, value]) => [key, removeEmptyFields(value)])
            .reduce((acc, [key, value]) => {
                if (
                    value !== undefined &&
                    value !== null &&
                    value !== '' &&
                    !(Array.isArray(value) && value.length === 0) &&
                    !(typeof value === 'object' && Object.keys(value).length === 0)
                ) {
                    acc[key] = value
                }
                return acc
            }, {})
    } else {
        return obj
    }
}

exports.saveLargeData = async (data, filename) => {
    const bucket = getBucket();
    const buffer = Buffer.from(JSON.stringify(data));
    const uploadStream = bucket.openUploadStream(filename);

    return new Promise((resolve, reject) => {
        uploadStream.end(buffer);
        uploadStream.on('error', err => {
            console.error('Upload error:', err);
            reject(err);
        });

        uploadStream.on('finish', () => {
            console.log("GridFS Length: ", uploadStream.length);
            resolve({ dataId: uploadStream.id, dataSize: uploadStream.length });
        });
    });
};

exports.getLargeData = async (dataId) => {
    const bucket = getBucket();
    let data = '';
    try {
        const downloadStream = bucket.openDownloadStream(new ObjectId(dataId));
        for await (const chunk of downloadStream) {
            data += chunk.toString();
        }
    } catch (error) {
        console.log("utils.js getLargeData error: ", error)
    }

    return data ? JSON.parse(data) : '';
};

exports.deleteLargeData = async (dataId) => {
    try {
        const bucket = getBucket();
        await bucket.delete(new ObjectId(dataId));
        console.log(`Data with id ${dataId} has been deleted from GridFS.`);
    } catch (error) {
        console.error('Error deleting data from GridFS:', error);
        throw error;
    }
};

exports.removeOutlookArchive = async (outlookArchive) => {
    for (let j = 0; j < outlookArchive.backups.length; j++) {
        // TO-DO bug fix
        const messages = await exports.getLargeData(outlookArchive.backups[j].dataId)
        for (const message of messages) {
            const indexId = `${outlookArchive._id}_${message.id}`
            try {
                console.log("Deleting ElasticSearch messages");
                await deleteOutlookIndex(indexId)
            } catch (error) {
                console.log(error);
            }
        }

        try {
            console.log("Deleting GridFS messages");
            await exports.deleteLargeData(outlookArchive.backups[j].dataId)
        } catch (error) {
            console.log(error);
        }
    }
}

exports.removeOutlookArchive2 = async (outlookArchive) => {
    for (let j = 0; j < outlookArchive.backups.length; j++) {
        const backupMsg = await BackupMessages.findOne({ dataId: outlookArchive.backups[j] })
        // TO-DO bug fix
        if (backupMsg && backupMsg.messageIds) {
            for (const message of backupMsg.messageIds) {
                const indexId = `${outlookArchive._id}_${message.id}`
                try {
                    console.log("Deleting ElasticSearch messages");
                    await deleteOutlookIndex(indexId)
                } catch (error) {
                    console.log(error);
                }
    
                // Delete attachments from S3 bucket
                if (message.attachments && message.attachments.length > 0) {
                    for (let attachment of message.attachments) {
                        await AWS.deleteS3File(config.AWS.OUTLOOK_BUCKET, `Outlook/${outlookArchive.id}_${attachment.id}`)
                    }
                }
            }
        }

        try {
            console.log("Deleting GridFS messages");
            await exports.deleteLargeData(backupMsg.dataId)
        } catch (error) {
            console.log(error);
        }

        // Update Archive State for deleting
        try {
            // Remove backupmsg
            await ArchiveState.updateOne({ archiveId: outlookArchive.id }, { $inc: { deletedCount: backupMsg.messageIds.length } })
        } catch (error) {
            console.log(error)
        }
        try {
            await BackupMessages.deleteOne({ _id: backupMsg._id })
        } catch (error) {
            console.log(error)
        }
    }
}

exports.removeFlaggedArchive = async (flaggedArchive) => {
    for (let j = 0; j < flaggedArchive.backups.length; j++) {
        const backupMsg = await BackupMessages.findOne({ dataId: flaggedArchive.backups[j] })
        if (backupMsg && backupMsg.messageIds) {
            for (const message of backupMsg.messageIds) {
                const indexId = `${flaggedArchive._id}_${message.id}`
                try {
                    console.log("Deleting ElasticSearch messages");
                    await deleteFlaggedCollectionsIndex(indexId)
                } catch (error) {
                    console.log(error);
                }
    
                // Delete attachments from S3 bucket
                if (message.attachments && message.attachments.length > 0) {
                    for (let attachment of message.attachments) {
                        await AWS.deleteS3File(config.AWS.OUTLOOK_BUCKET, `FlaggedCollections/${flaggedArchive.id}_${attachment.id}`)
                    }
                }
            }
        }

        try {
            console.log("Deleting GridFS messages");
            await exports.deleteLargeData(backupMsg.dataId)
        } catch (error) {
            console.log(error);
        }

        // Update Archive State for deleting
        try {
            // Remove backupmsg
            await ArchiveState.updateOne({ archiveId: flaggedArchive.id }, { $inc: { deletedCount: backupMsg.messageIds.length } })
        } catch (error) {
            console.log(error)
        }
        try {
            await BackupMessages.deleteOne({ _id: backupMsg._id })
        } catch (error) {
            console.log(error)
        }
    }
}

exports.removeGmailArchive = async (gmailArchive) => {
    for (let j = 0; j < gmailArchive.backups.length; j++) {
        const backupMsg = await BackupMessages.findOne({ dataId: gmailArchive.backups[j] })
        // TO-DO bug fix
        if (backupMsg && backupMsg.messageIds) {
            for (const message of backupMsg.messageIds) {
                const indexId = `${gmailArchive._id}_${message.id}`
                try {
                    console.log("Deleting ElasticSearch messages");
                    await deleteGmailIndex(indexId)
                } catch (error) {
                    console.log(error);
                }
    
                // Delete attachments from S3 bucket
                if (message.attachments && message.attachments.length > 0) {
                    for (let attachment of message.attachments) {
                        await AWS.deleteS3File(config.AWS.OUTLOOK_BUCKET, attachment?.s3Key)
                    }
                }
            }
        }

        try {
            console.log("Deleting GridFS messages");
            await exports.deleteLargeData(backupMsg.dataId)
        } catch (error) {
            console.log(error);
        }

        // Update Archive State for deleting
        try {
            // Remove backupmsg
            await ArchiveState.updateOne({ archiveId: gmailArchive.id }, { $inc: { deletedCount: backupMsg.messageIds.length } })
        } catch (error) {
            console.log(error)
        }
        try {
            await BackupMessages.deleteOne({ _id: backupMsg._id })
        } catch (error) {
            console.log(error)
        }
    }
}

exports.removeOneDriveArchive = async (oneDriveArchive) => {
    const nodes = await exports.getLargeData(oneDriveArchive.dataId);
    const deleteS3Files = async (node) => {
        console.log("--------------")
        console.log(node)
        console.log("--------------")
        if (!node) return;

        if (!node.isFolder && node.versions) {

            // Deprecated
            if (node.s3Key) {
                await AWS.deleteS3File(config.AWS.OUTLOOK_BUCKET, node.s3Key);
            }

            await deleteOneDriveIndex(`${oneDriveArchive.id}_${node.id}`)
            for (const version of node.versions) {
                await AWS.deleteS3File(config.AWS.OUTLOOK_BUCKET, version.s3Key);
            }
        }

        if (node.children && node.children.length > 0) {
            for (const childNode of node.children) {
                await deleteS3Files(childNode);
            }
        }
    };
    for (const node of nodes) {
        await deleteS3Files(node);
    }

    // Delete GridFS messages
    try {
        console.log("Deleting GridFS messages");
        await exports.deleteLargeData(oneDriveArchive.dataId);
    } catch (error) {
        console.log(error);
    }
};

exports.removeGoogleDriveArchive = async (googleDriveArchive) => {
    const nodes = await exports.getLargeData(googleDriveArchive.backups[0].dataId);
    const deleteS3Files = async (node) => {
        console.log("--------------")
        console.log(node)
        console.log("--------------")
        if (!node) return;

        if (node.data.type !== 'Folder' && node.data.s3Key) {
            await AWS.deleteS3File(config.AWS.OUTLOOK_BUCKET, node.data.s3Key);
            await exports.deleteGDriveIndex(`${googleDriveArchive.id}_${node.key}`)
            // for (const version of node.versions) {
            //     await AWS.deleteS3File(config.AWS.OUTLOOK_BUCKET, version.s3Key);
            // }
        }

        if (node.children && node.children.length > 0) {
            for (const childNode of node.children) {
                await deleteS3Files(childNode);
            }
        }
    };
    for (const node of nodes) {
        await deleteS3Files(node);
    }

    // Delete GridFS messages
    try {
        console.log("Deleting GridFS messages");
        await exports.deleteLargeData(googleDriveArchive.backups[0].dataId);
    } catch (error) {
        console.log(error);
    }
};

exports.removeDropboxArchive = async (dropboxArchive) => {
    const nodes = await exports.getLargeData(dropboxArchive.backups[0].dataId);
    const deleteS3Files = async (node) => {
        console.log("--------------")
        console.log(node)
        console.log("--------------")
        if (!node) return;

        if (node.data.type !== 'folder' && node.data.s3Key) {
            await AWS.deleteS3File(config.AWS.OUTLOOK_BUCKET, node.data.s3Key);
            await exports.deleteDropboxIndex(`${dropboxArchive.id}_${node.key}`)
            // for (const version of node.versions) {
            //     await AWS.deleteS3File(config.AWS.OUTLOOK_BUCKET, version.s3Key);
            // }
        }

        if (node.children && node.children.length > 0) {
            for (const childNode of node.children) {
                await deleteS3Files(childNode);
            }
        }
    };
    for (const node of nodes.files) {
        await deleteS3Files(node);
    }

    // Delete GridFS messages
    try {
        console.log("Deleting GridFS messages");
        await exports.deleteLargeData(dropboxArchive.backups[0].dataId);
    } catch (error) {
        console.log(error);
    }
};

exports.html2plainText = html => {
    try {
        return parse(html).text
    } catch (error) {
        console.log(error)
    }

    return ''
}

exports.generateEmailContent = (message) => {
    let email = new Email()
        .subject(message.subject || "")
        .bodyText("")
        .bodyHtml(message.content || message.body?.content)
        .sender(message.sender ? message.sender?.emailAddress?.address : '', message.sender ? message.sender?.emailAddress?.name : '')
        .sentOn(new Date(message.sentDateTime))
        .receivedOn(new Date(message.receivedDateTime));

    for (const addr of message.toRecipients) {
        email = email.to(addr.emailAddress.address, addr.emailAddress.name)
    }
    email.iconIndex = 0x00000103;

    return Buffer.from(email.msg(), 'binary');
};

exports.generateArchiveOutlookEml = async (message, archiveId) => {
    
    const attachments = [];

    if (message.attachments && message.attachments.length > 0) {
        for (const attachment of message.attachments) {
            const content = await AWS.downloadFileAsBuffer(config.AWS.OUTLOOK_BUCKET, attachment.s3Key || `Outlook/${archiveId}_${attachment.id}`);
            attachments.push({
                filename: attachment.name,
                content: Buffer.from(content), // already Uint8Array
                encoding: "base64"
            });
        }
    }

    const mailOptions = {
        from: {
            name: message.sender?.emailAddress?.name || "",
            address: message.sender?.emailAddress?.address || ""
        },
        to: message.toRecipients?.map(r => ({
            name: r.emailAddress?.name || "",
            address: r.emailAddress?.address
        })),
        cc: message.ccRecipients?.map(r => ({
            name: r.emailAddress?.name || "",
            address: r.emailAddress?.address
        })),
        bcc: message.bccRecipients?.map(r => ({
            name: r.emailAddress?.name || "",
            address: r.emailAddress?.address
        })),
        subject: message.subject || "",
        html: message.content || message.body?.content || "",
        text: "", // fallback
        date: new Date(message.sentDateTime),
        attachments
    };

    const mail = new MailComposer(mailOptions);

    return new Promise((resolve, reject) => {
        mail.compile().build((err, messageBuffer) => {
            if (err) return reject(err);
            resolve(messageBuffer); // This is a raw .eml buffer
        });
    });
}

exports.generateOutlookEml = async (message, accessToken, userId) => {
    
    const attachments = [];

    if (message.attachments && message.attachments.length > 0) {
        for (const attachment of message.attachments) {
            const content = await exports.getOutlookAttachment(accessToken, userId, message.id, attachment.id);
            attachments.push({
                filename: attachment.name,
                content: Buffer.from(content), // already Uint8Array
                encoding: "base64"
            });
        }
    }

    const mailOptions = {
        from: {
            name: message.sender?.emailAddress?.name || "",
            address: message.sender?.emailAddress?.address || ""
        },
        to: message.toRecipients?.map(r => ({
            name: r.emailAddress?.name || "",
            address: r.emailAddress?.address
        })),
        cc: message.ccRecipients?.map(r => ({
            name: r.emailAddress?.name || "",
            address: r.emailAddress?.address
        })),
        bcc: message.bccRecipients?.map(r => ({
            name: r.emailAddress?.name || "",
            address: r.emailAddress?.address
        })),
        subject: message.subject || "",
        html: message.content || message.body?.content || "",
        text: "", // fallback
        date: new Date(message.sentDateTime),
        attachments
    };

    const mail = new MailComposer(mailOptions);

    return new Promise((resolve, reject) => {
        mail.compile().build((err, messageBuffer) => {
            if (err) return reject(err);
            resolve(messageBuffer); // This is a raw .eml buffer
        });
    });
}

exports.gmailMessageToEml = async (gmail, mailId) => {
    const { data: message } = await gmail.users.messages.get({
        userId: "me",
        id: mailId,
        format: "full",
    });

    const headers = {};
    for (const h of message.payload.headers) {
        headers[h.name.toLowerCase()] = h.value;
    }

    let textBody = "";
    let htmlBody = "";
    const partsToProcess = [message.payload];

    while (partsToProcess.length) {
        const part = partsToProcess.pop();
        if (part.parts) partsToProcess.push(...part.parts);

        if (part.mimeType === "text/plain" && part.body?.data) {
            textBody += Buffer.from(part.body.data, "base64").toString("utf-8");
        }

        if (part.mimeType === "text/html" && part.body?.data) {
            htmlBody += Buffer.from(part.body.data, "base64").toString("utf-8");
        }
    }

    const attachments = [];
    const parts = [message.payload];
    while (parts.length) {
        const part = parts.pop();
        if (part.parts) parts.push(...part.parts);

        if (
            part.filename &&
            part.filename.length > 0 &&
            part.body &&
            part.body.attachmentId
        ) {
            const attRes = await gmail.users.messages.attachments.get({
                userId: "me",
                messageId: mailId,
                id: part.body.attachmentId,
            });

            attachments.push({
                filename: part.filename,
                content: Buffer.from(attRes.data.data, "base64"),
            });
        }
    }

    const mailOptions = {
        from: headers["from"] || "",
        to: headers["to"] || "",
        cc: headers["cc"] || "",
        bcc: headers["bcc"] || "",
        subject: headers["subject"] || "",
        date: headers["date"] ? new Date(headers["date"]) : new Date(),
        text: textBody || "",
        html: htmlBody || textBody || "",
        attachments,
    };

    const mail = new MailComposer(mailOptions);

    return new Promise((resolve, reject) => {
        mail.compile().build((err, messageBuffer) => {
            if (err) return reject(err);
            resolve([messageBuffer, mailOptions.subject]); // raw .eml
        });
    });
}

exports.generateEmlFromGmail = (email) => {
    let emlData = `From: ${email.from}\r\n`;
    try {
        const boundary = '----=_Part_0_123456789.123456789'; // Boundary to separate parts
    
        // Construct the EML content
        emlData += `To: ${email.to}\r\n`;
        emlData += `Subject: ${email.subject}\r\n`;
        emlData += `Date: ${new Date(email.date).toUTCString()}\r\n`;
        emlData += `MIME-Version: 1.0\r\n`;
        emlData += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

        // Add plain text part (as a fallback)
        emlData += `--${boundary}\r\n`;
        emlData += `Content-Type: text/plain; charset=UTF-8\r\n\r\n`;
        emlData += `${email.preview || "This is the plain text version of the email."}\r\n\r\n`;

        // Add HTML part
        emlData += `--${boundary}\r\n`;
        emlData += `Content-Type: text/html; charset=UTF-8\r\n\r\n`;
        emlData += `${email.msg || "<p>This is the HTML version of the email.</p>"}\r\n\r\n`;

        // End the MIME boundary
        emlData += `--${boundary}--\r\n`;

        // // Generate a hash of the EML content (before including the hash itself)
        // const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(emlData));
        // const hashArray = Array.from(new Uint8Array(hashBuffer));
        // const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // // Include the hash as a custom header
        // emlData = `X-Email-Hash: ${hashHex}\r\n` + emlData;
    } catch (error) {
        console.log("Generating EML from gmail: ", error)
        emlData = null        
    }
    
    return emlData
};

exports.generateArchiveGmailEml = async (email) => {
    try {
        const attachments = [];

        // Handle attachments if they exist
        if (email.attachments && email.attachments.length > 0) {
            for (const attachment of email.attachments) {
                const content = await AWS.downloadFileAsBuffer(config.AWS.OUTLOOK_BUCKET, attachment.s3Key);
                attachments.push({
                    filename: attachment.filename,
                    content: Buffer.from(content),
                    encoding: "base64"
                });
            }
        }

        const mailOptions = {
            from: {
                name: email.fromName || "",
                address: email.from
            },
            to: Array.isArray(email.to) ? email.to.map(addr => ({
                name: "", // Gmail API doesn't typically provide separate name fields
                address: addr
            })) : [{
                name: "",
                address: email.to
            }],
            cc: email.cc ? (Array.isArray(email.cc) ? email.cc.map(addr => ({
                name: "",
                address: addr
            })) : [{
                name: "",
                address: email.cc
            }]) : undefined,
            bcc: email.bcc ? (Array.isArray(email.bcc) ? email.bcc.map(addr => ({
                name: "",
                address: addr
            })) : [{
                name: "",
                address: email.bcc
            }]) : undefined,
            subject: email.subject || "",
            html: email.msg || email.html || email.body || "",
            text: email.preview || email.text || email.body || "",
            date: new Date(email.date),
            attachments
        };

        const mail = new MailComposer(mailOptions);

        return new Promise((resolve, reject) => {
            mail.compile().build((err, messageBuffer) => {
                if (err) return reject(err);
                resolve(messageBuffer.toString('utf8')); // Convert buffer to string to match original return type
            });
        });

    } catch (error) {
        console.log("Error generating EML from Gmail: ", error);
        return null;
    }
};

exports.getGmailAttachments = (parts) => {
    if (!parts) return [];
    const attachments = [];

    parts.forEach((part) => {
        if (part.body?.attachmentId) {
            attachments.push({
                attachmentId: part.body.attachmentId,
                filename: part.filename,
                mimeType: part.mimeType,
                size: part.body.size
            });
        } else if (part.parts) {
            attachments.push(...exports.getGmailAttachments(part.parts));
        }
    });

    return attachments;
};

const decodeBase64 = (base64) => {
    return Buffer.from(base64, 'base64').toString('utf-8');
}

const decodeGmailData = (encodedData) => {
    const base64 = base64urlToBase64(encodedData);
    return decodeBase64(base64);
}

const base64urlToBase64 = (base64url) => {
    if (typeof base64url !== 'string') return '';

    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    return base64;
}

exports.genOriginalGmail2Eml = (fullMessage) => {

    let emlData = `From: ${fullMessage.payload.headers.find(h => h.name === 'From')?.value || 'Unknown'}\r\n`;
    console.log(fullMessage)
    try {
        if (!fullMessage || !fullMessage.payload) {
            throw 'Failed to fetch full message content';
        }

        const boundary = '----=_Part_0_123456789.123456789';
        
        emlData += `To: ${fullMessage.payload.headers.find(h => h.name === 'To')?.value || 'Unknown'}\r\n`;
        emlData += `Subject: ${fullMessage.payload.headers.find(h => h.name === 'Subject')?.value || 'No Subject'}\r\n`;
        emlData += `Date: ${fullMessage.payload.headers.find(h => h.name === 'Date')?.value || new Date().toString()}\r\n`;
        emlData += `MIME-Version: 1.0\r\n`;
        emlData += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

        emlData += `--${boundary}\r\n`;
        emlData += `Content-Type: text/plain; charset=UTF-8\r\n\r\n`;
        // emlData += `${fullMessage.snippet || ''}\r\n\r\n`;
        let encodedHtml = ''
        if (fullMessage.payload?.mimeType === 'text/html') {
            encodedHtml = fullMessage.payload.body.data;
        } else {
            encodedHtml = getHtmlPart(fullMessage.payload.parts);
        }
        console.log("Encoded html: ", encodedHtml)
        if (encodedHtml) {
            emlData += `--${boundary}\r\n`;
            emlData += `Content-Type: text/html; charset=UTF-8\r\n\r\n`;
            emlData += `${decodeGmailData(encodedHtml)}\r\n\r\n`;
        }
        if (fullMessage.payload.parts) {
            fullMessage.payload.parts.forEach(part => {
                if (part.filename && part.body && part.body.data) {
                    console.log("Gmail Attachment")
                    console.log(part.body.data)
                    const attachmentData = base64urlToBase64(part.body.data);
                    emlData += `--${boundary}\r\n` +
                               `Content-Type: ${part.mimeType}; name="${part.filename}"\r\n` +
                               `Content-Transfer-Encoding: base64\r\n` +
                               `Content-Disposition: attachment; filename="${part.filename}"\r\n\r\n` +
                               `${attachmentData}\r\n\r\n`;
                }
            });
        }

        emlData += `--${boundary}--\r\n`;
    } catch (error) {
        console.error('Error downloading EML:', error);
        throw error
    }

    return emlData
}

exports.genGmail2Eml = (fullMessage) => {

    let emlData = `From: ${fullMessage.payload.headers.find(h => h.name === 'From')?.value || 'Unknown'}\r\n`;
    try {
        if (!fullMessage || !fullMessage.payload) {
            throw 'Failed to fetch full message content';
        }

        const boundary = '----=_Part_0_123456789.123456789';
        
        emlData += `To: ${fullMessage.payload.headers.find(h => h.name === 'To')?.value || 'Unknown'}\r\n`;
        emlData += `Subject: ${fullMessage.payload.headers.find(h => h.name === 'Subject')?.value || 'No Subject'}\r\n`;
        emlData += `Date: ${fullMessage.payload.headers.find(h => h.name === 'Date')?.value || new Date().toString()}\r\n`;
        emlData += `MIME-Version: 1.0\r\n`;
        emlData += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

        emlData += `--${boundary}\r\n`;
        emlData += `Content-Type: text/plain; charset=UTF-8\r\n\r\n`;
        if (fullMessage.html) {
            emlData += `--${boundary}\r\n`;
            emlData += `Content-Type: text/html; charset=UTF-8\r\n\r\n`;
            emlData += `${fullMessage.html}\r\n\r\n`;
        }

        emlData += `--${boundary}--\r\n`;
    } catch (error) {
        console.error('Error downloading EML:', error);
        throw error
    }

    return emlData
}

// Function to get attachments
exports.getOutlookAttachments = async (accessToken, messageId, userId) => {
    const url = `https://graph.microsoft.com/v1.0/users/${userId}/messages/${messageId}/attachments`;
    const response = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
    return response.data.value;
}

// Function to get the content of a specific attachment
exports.getAttachmentContent = async (accessToken, userId, messageId, attachmentId) => {
    const url = `https://graph.microsoft.com/v1.0/users/${userId}/messages/${messageId}/attachments/${attachmentId}/$value`;
    const response = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        },
        responseType: 'arraybuffer'
    });

    return response.data.toString('base64');
}

exports.getOutlookAttachment = async (accessToken, userId, messageId, attachmentId) => {
    const url = `https://graph.microsoft.com/v1.0/users/${userId}/messages/${messageId}/attachments/${attachmentId}/$value`;
    const response = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        },
        responseType: 'arraybuffer'
    });

    return response.data;
}

exports.getOutlookAttachmentBuffer = async (accessToken, userId, messageId, attachmentId) => {
    const url = `https://graph.microsoft.com/v1.0/users/${userId}/messages/${messageId}/attachments/${attachmentId}/$value`;
    const response = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        },
        responseType: 'arraybuffer'
    });

    return Buffer.from(response.data);
}

exports.generateHash = (object) => {
    const objectString = JSON.stringify(object);

    const hash = crypto.createHash('sha256');
    hash.update(objectString);

    return hash.digest('hex');
}

exports.sendPushNotification = async ({email, title, message}) => {
    try {
        // Convert email to array if it's a string
        const emails = Array.isArray(email) ? email : [email];
        
        // Find all tokens for all emails
        const cdsecureTokens = await CDSecureToken.find({ userId: { $in: emails }, enableNotification: true });

        if (!cdsecureTokens || cdsecureTokens.length === 0) {
            console.log('No tokens found for the provided email(s)');
            return;
        }

        // Send notifications to all tokens
        const sendPromises = cdsecureTokens.map(async (cdsecureToken) => {
            const payload = {
                to: cdsecureToken.token,
                sound: 'default',
                title,
                body: message,
                data: { extraData: 'optional data' },
            };

            try {
                const response = await axios.post('https://exp.host/--/api/v2/push/send?useFcmV1=true', payload, {
                    headers: {
                        'Accept': 'application/json',
                        'Accept-encoding': 'gzip, deflate',
                        'Content-Type': 'application/json',
                    },
                });

                if (response.status === 200) {
                    console.log('Notification sent successfully to token:', cdsecureToken.token);
                    return { success: true, token: cdsecureToken.token, data: response.data };
                } else {
                    console.error('Error sending notification to token:', cdsecureToken.token, response.data);
                    return { success: false, token: cdsecureToken.token, error: response.data };
                }
            } catch (error) {
                console.error('Error sending notification to token:', cdsecureToken.token, error.response ? error.response.data : error.message);
                return { success: false, token: cdsecureToken.token, error: error.response ? error.response.data : error.message };
            }
        });

        const results = await Promise.all(sendPromises);
        return results;
    } catch (error) {
        console.error('Error in sendPushNotification:', error);
        throw error;
    }
};

exports.sendInvitationEmail = async (to, inviteLink, inviterName) => {
    const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You Are Invited to Join Workspaces</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
            }
    
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
            }
    
            .header {
                text-align: center;
                margin-bottom: 20px;
            }
            .button {
              display: block;
              width: max-content;
              background-color: #28a745;
              color: #ffffff;
              padding: 10px 20px;
              text-align: center;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px auto;
            }
            .footer {
                text-align: center;
                font-size: 12px;
                color: #888;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="${config.SITE_URL}/static/media/gdf-logo.f06a8a21.png" alt="Complete Discovery">
                <h2>You have been invited to join</h2>
                <p>${inviterName} has invited you to join their workspace. To accept this invitation and join the workspace, please click the following button:</p>
            </div>
            <div class="code">
                <a href="${inviteLink}" class="button">Join Now</a>
            </div>
            <div class="footer">
                <p>If you did not expect this invitation, please ignore this email. This link will expire in 7 days.</p>
                <p>&copy; 2023 Complete Discovery. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `
  
    const mailOptions = {
      from: `approvals@ediscoverycloud.com`,
      to: to,
      subject: `Invitation to Join Workspaces`,
      html: html
    }
  
    try {
      await mailTransport.sendMail(mailOptions)
      console.log('Invitation email sent successfully')
      return true
    } catch (error) {
      console.log('Invitation email failed', error)
      return false
    }
  }
  
  exports.invitedWorkspaces = async (userId, type) => {
    const user = await User.findById(userId)
    if (!user) return null
    const invites = await InviteUsers.find({invitedUser: user.email})
    if (!invites) return null
    let result = []
    for (const invite of invites) {
        if (type === 'slack') {
            if (invite.status !== 'Accepted') continue

            if (invite.permissionType === 'global') {
                const slackTeams = await SlackTeam.find({clientId: invite.userId})
                if (slackTeams)
                    result = result.concat(slackTeams)
            } else {
                const slackIds = invite.workspacePermissions.slack
                if (slackIds && slackIds.length > 0) {
                    const ids = []
                    for (const slackId of slackIds) {
                        if (slackId.permission.toLowerCase() !== 'none')
                            ids.push(slackId.id)
                    }
                    const slackTeams = await SlackTeam.find({_id: {$in: ids}})
                    if (slackTeams)
                        result = result.concat(slackTeams)
                }
            }
        } else if (type === 'google') {
            if (invite.status !== 'Accepted') continue

            if (invite.permissionType === 'global') {
                const workspaces = await GoogleWorkspace.find({clientId: invite.userId});
                if (workspaces) {
                    for (let i = 0; i < workspaces.length; i++) {
                        const users = await GoogleUsers.find({ workspaceId: workspaces[i]._id });
                        result.push({
                            workspace: workspaces[i],
                            users,
                        });
                    }
                }
            } else {
                const googleIds = invite.workspacePermissions.google
                if (googleIds && googleIds.length > 0) {
                    const ids = []
                    for (const id of googleIds) {
                        if (id.permission.toLowerCase() !== 'none')
                            ids.push(id.id)
                    }
                    console.log("googleIds: ", ids)
                    const workspaces = await GoogleWorkspace.find({_id: {$in: ids}});
                    console.log("invited google workspaces: ", workspaces)
                    if (workspaces) {
                        for (let i = 0; i < workspaces.length; i++) {
                            const users = await GoogleUsers.find({ workspaceId: workspaces[i]._id });
                            result.push({
                                workspace: workspaces[i],
                                users,
                            });
                        }
                    }
                }
            }
        } else if (type === 'ms365') {
            if (invite.status !== 'Accepted') continue

            if (invite.permissionType === 'global') {
                const workspaces = await MS365Workspace.find({clientId: invite.userId});
                if (workspaces) {
                    for (let i = 0; i < workspaces.length; i++) {
                        const users = await MS365Users.find({ workspaceId: workspaces[i]._id });
                        result.push({
                            workspace: workspaces[i],
                            users,
                        });
                    }
                }
            } else {
                const ms365Ids = invite.workspacePermissions.ms365
                if (ms365Ids && ms365Ids.length > 0) {
                    const ids = []
                    for (const id of ms365Ids) {
                        if (id.permission.toLowerCase() !== 'none')
                            ids.push(id.id)
                    }
                    const workspaces = await MS365Workspace.find({_id: {$in: ids}});
                    if (workspaces) {
                        for (let i = 0; i < workspaces.length; i++) {
                            const users = await MS365Users.find({ workspaceId: workspaces[i]._id });
                            result.push({
                                workspace: workspaces[i],
                                users,
                            });
                        }
                    }
                }
            }
        } else if (type === 'dropbox') {
            if (invite.status !== 'Accepted') continue

            if (invite.permissionType === 'global') {
                const workspaces = await DropboxWorkspace.find({owner: invite.userId});
                if (workspaces) {
                    for (let i = 0; i < workspaces.length; i++) {
                        const users = await DropboxMembers.find({ workspaceId: workspaces[i]._id });
                        result.push({
                            workspace: workspaces[i],
                            users,
                        });
                    }
                }
            } else {
                const dropboxIds = invite.workspacePermissions.dropbox
                if (dropboxIds && dropboxIds.length > 0) {
                    const ids = []
                    for (const id of dropboxIds) {
                        if (id.permission.toLowerCase() !== 'none')
                            ids.push(id.id)
                    }
                    console.log("dropboxIds: ", ids)
                    const workspaces = await DropboxWorkspace.find({_id: {$in: ids}});
                    console.log("invited dropbox workspaces: ", workspaces)
                    if (workspaces) {
                        for (let i = 0; i < workspaces.length; i++) {
                            const users = await DropboxMembers.find({ workspaceId: workspaces[i]._id });
                            result.push({
                                workspace: workspaces[i],
                                users,
                            });
                        }
                    }
                }
            }
        } else if (type === 'box') {
            if (invite.status !== 'Accepted') continue

            if (invite.permissionType === 'global') {
                const workspaces = await BoxWorkspace.find({owner: invite.userId});
                if (workspaces) {
                    for (let i = 0; i < workspaces.length; i++) {
                        const users = await BoxMember.find({ workspaceId: workspaces[i]._id });
                        result.push({
                            workspace: workspaces[i],
                            users,
                        });
                    }
                }
            } else {
                const boxIds = invite.workspacePermissions.box
                if (boxIds && boxIds.length > 0) {
                    const ids = []
                    for (const id of boxIds) {
                        if (id.permission.toLowerCase() !== 'none')
                            ids.push(id.id)
                    }
                    console.log("boxIds: ", ids)
                    const workspaces = await BoxWorkspace.find({_id: {$in: ids}});
                    console.log("invited box workspaces: ", workspaces)
                    if (workspaces) {
                        for (let i = 0; i < workspaces.length; i++) {
                            const users = await BoxMember.find({ workspaceId: workspaces[i]._id });
                            result.push({
                                workspace: workspaces[i],
                                users,
                            });
                        }
                    }
                }
            }
        }
    }

    return result
  }

  exports.slackArchives = async (userId, workspaceId) => {
    const teams = await SlackTeam.aggregate([
        {
            $addFields: {
                userId: { $toString: '$clientId' },
                id: { $toString: '$_id' }
            }
        },
        {
            $match: (workspaceId ? {
                userId,
                id: workspaceId
            }: {
                userId
            })
        },
        {
            $lookup: {
                from: "slackarchive2",
                let: { team: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: [
                                    "$team",
                                    { $toString: "$$team" }
                                ]
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: "archivestates",
                            let: {
                                archiveId: { $toString: "$_id" }
                            },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $eq: [
                                                "$archiveId",
                                                "$$archiveId"
                                            ]
                                        }
                                    }
                                }
                            ],
                            as: "archiveState"
                        }
                    },
                    {
                        $unwind: {
                            path: "$archiveState",
                            preserveNullAndEmptyArrays: true // Preserve archives even if no state is found
                        }
                    }
                ],
                as: "archives"
            }
        }
    ])

    return teams
  }

  exports.outlookArchives = async (userId, workspaceId) => {
    const outlook = await MS365Workspace.aggregate([
        {
            $addFields: {
                id: { $toString: '$_id' }
            }
        },
        {
            $match: (workspaceId ? {
                clientId: userId,
                id: workspaceId
                
            }:{
                clientId: userId
            })
        },
        {
            $lookup: {
                from: 'outlookarchives',
                let: { workspaceId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$workspaceId', { $toString: '$$workspaceId' }]
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: 'archivestates',
                            let: { archiveId: { $toString: '$_id' } },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $eq: ['$archiveId', '$$archiveId']
                                        }
                                    }
                                }
                            ],
                            as: 'archiveState'
                        }
                    },
                    {
                        $unwind: {
                            path: '$archiveState',
                            preserveNullAndEmptyArrays: true // Preserve archives even if no state is found
                        }
                    },
                    {
                        $project: {
                            id: '$_id',
                            filters: 1,
                            size: 1,
                            createdAt: 1,
                            backedAt: '$updatedAt',
                            archiveState: 1
                        }
                    }
                ],
                as: 'archives'
            }
        }
    ]);

    return outlook
  }

  exports.flaggedArchives = async (userId) => {
    const flagged = await CollectionList.aggregate([
        {
            $addFields: {
                id: { $toString: '$_id' }
            }
        },
        {
            $match: {
                userId
            }
        },
        {
            $lookup: {
                from: 'flaggedarchives',
                let: { jobId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$jobId', { $toString: '$$jobId' }]
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: 'archivestates',
                            let: { archiveId: { $toString: '$_id' } },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $eq: ['$archiveId', '$$archiveId']
                                        }
                                    }
                                }
                            ],
                            as: 'archiveState'
                        }
                    },
                    {
                        $unwind: {
                            path: '$archiveState',
                            preserveNullAndEmptyArrays: true // Preserve archives even if no state is found
                        }
                    },
                    {
                        $project: {
                            id: '$_id',
                            filters: 1,
                            size: 1,
                            createdAt: 1,
                            backedAt: '$updatedAt',
                            archiveState: 1,
                            version: 1
                        }
                    }
                ],
                as: 'archives'
            }
        }
    ]);

    return flagged
  }

  exports.onedriveArchives = async (userId, workspaceId) => {
    const onedrive = await MS365Workspace.aggregate([
        {
            $addFields: {
                id: { $toString: '$_id' }
            }
        },
        {
            $match: (workspaceId ? {
                clientId: userId,
                id: workspaceId
            } : {
                clientId: userId
            })
        },
        {
            $lookup: {
                from: 'onedrivearchives',
                let: { workspaceId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$workspaceId', { $toString: '$$workspaceId' }]
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: 'archivestates',
                            let: { archiveId: { $toString: '$_id' } },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $eq: ['$archiveId', '$$archiveId']
                                        }
                                    }
                                }
                            ],
                            as: 'archiveState'
                        }
                    },
                    {
                        $unwind: {
                            path: '$archiveState',
                            preserveNullAndEmptyArrays: true // Preserve archives even if no state is found
                        }
                    },
                    {
                        $project: {
                            id: '$_id',
                            filters: 1,
                            size: 1,
                            _id: 0,
                            createdAt: 1,
                            backedAt: '$updatedAt',
                            archiveState: 1
                        }
                    }
                ],
                as: 'archives'
            }
        }
    ])

    return onedrive
  }

  exports.gmailArchives = async (userId, workspaceId) => {
    const gmail = await GoogleWorkspace.aggregate([
        {
            $addFields: {
                id: { $toString: '$_id' }
            }
        },
        {
            $match: (workspaceId ? {
                clientId: userId,
                id: workspaceId
            } : {
                clientId: userId
            })
        },
        {
            $lookup: {
                from: 'gmailarchives',
                let: { workspaceId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$workspaceId', { $toString: '$$workspaceId' }]
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: 'archivestates',
                            let: { archiveId: { $toString: '$_id' } },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $eq: ['$archiveId', '$$archiveId']
                                        }
                                    }
                                }
                            ],
                            as: 'archiveState'
                        }
                    },
                    {
                        $unwind: {
                            path: '$archiveState',
                            preserveNullAndEmptyArrays: true // Preserve archives even if no state is found
                        }
                    },
                    {
                        $project: {
                            id: '$_id',
                            filters: 1,
                            size: 1,
                            _id: 0,
                            createdAt: 1,
                            backedAt: '$updatedAt',
                            archiveState: 1
                        }
                    }
                ],
                as: 'archives'
            }
        }
    ])

    return gmail
  }

  exports.gdriveArchives = async (userId, workspaceId) => {
    const drive = await GoogleWorkspace.aggregate([
        {
            $addFields: {
                id: { $toString: '$_id' }
            }
        },
        {
            $match: workspaceId ? {
                clientId: userId,
                id: workspaceId
            } : {
                clientId: userId
            }
        },
        {
            $lookup: {
                from: 'drivearchives',
                let: { workspaceId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$workspaceId', { $toString: '$$workspaceId' }]
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: 'archivestates',
                            let: { archiveId: { $toString: '$_id' } },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $eq: ['$archiveId', '$$archiveId']
                                        }
                                    }
                                }
                            ],
                            as: 'archiveState'
                        }
                    },
                    {
                        $unwind: {
                            path: '$archiveState',
                            preserveNullAndEmptyArrays: true // Preserve archives even if no state is found
                        }
                    },
                    {
                        $project: {
                            id: '$_id',
                            filters: 1,
                            size: 1,
                            _id: 0,
                            createdAt: 1,
                            backedAt: '$updatedAt',
                            archiveState: 1
                        }
                    }
                ],
                as: 'archives'
            }
        }
    ])

    return drive
  }

  exports.dropboxArchives = async (userId, workspaceId) => {
    const dropbox = await DropboxWorkspace.aggregate([
        {
            $addFields: {
                id: { $toString: '$_id' }
            }
        },
        {
            $match: (workspaceId ? {
                owner: userId,
                id: workspaceId
            } : {
                owner: userId
            })
        },
        {
            $lookup: {
                from: 'dropboxarchives',
                let: { workspaceId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$workspaceId', { $toString: '$$workspaceId' }]
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: 'archivestates',
                            let: { archiveId: { $toString: '$_id' } },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $eq: ['$archiveId', '$$archiveId']
                                        }
                                    }
                                }
                            ],
                            as: 'archiveState'
                        }
                    },
                    {
                        $unwind: {
                            path: '$archiveState',
                            preserveNullAndEmptyArrays: true // Preserve archives even if no state is found
                        }
                    },
                    {
                        $project: {
                            id: '$_id',
                            filters: 1,
                            size: 1,
                            _id: 0,
                            createdAt: 1,
                            backedAt: '$updatedAt',
                            archiveState: 1
                        }
                    }
                ],
                as: 'archives'
            }
        }
    ])

    return dropbox
  }

  exports.invitedArchives = async (userId, type) => {
    const user = await User.findById(userId)
    if (!user) return null
    const invites = await InviteUsers.find({invitedUser: user.email})
    if (!invites) return null
    let result = []
    for (const invite of invites) {
        if (type === 'slack') {
            if (invite.status !== 'Accepted') continue

            if (invite.permissionType === 'global') {
                let slackTeams = await exports.slackArchives(invite.userId)
                if (slackTeams) {
                    slackTeams = slackTeams.map((team) => {
                        team.permission = invite.globalPermission
                        return team
                    })
                    result = result.concat(slackTeams)
                }
            } else {
                const slackIds = invite.workspacePermissions.slack
                if (slackIds && slackIds.length > 0) {
                    for (const slackId of slackIds) {
                        if (slackId.permission.toLowerCase() !== 'none') {
                            let slackTeams = await exports.slackArchives(invite.userId, slackId.id)
                            if (slackTeams) {
                                slackTeams = slackTeams.map((team) => {
                                    team.permission = slackId.permission
                                    return team
                                })
                                result = result.concat(slackTeams)
                            }
                        }
                    }
                    
                }
            }
        } else if (type === 'gmail' || type === 'gdrive') {
            if (invite.status !== 'Accepted') continue

            if (invite.permissionType === 'global') {
                let archives = null
                if (type === 'gmail') {
                    archives = await exports.gmailArchives(invite.userId);
                } else if (type === 'gdrive') {
                    archives = await exports.gdriveArchives(invite.userId);
                }
                if (archives) {
                    archives = archives.map((team) => {
                        team.permission = invite.globalPermission
                        return team
                    })
                    result = result.concat(archives)
                }
            } else {
                const ids = invite.workspacePermissions.google
                if (ids && ids.length > 0) {
                    for (const id of ids) {
                        if (id.permission.toLowerCase() !== 'none') {
                            let archvies = null
                            if (type === 'gmail') {
                                archvies = await exports.gmailArchives(invite.userId, id.id)
                            } else if (type === 'gdrive') {
                                archvies = await exports.gdriveArchives(invite.userId, id.id)
                            }
                            if (archvies) {
                                archvies = archvies.map((team) => {
                                    team.permission = id.permission
                                    return team
                                })
                                result = result.concat(archvies)
                            }
                        }
                    }
                    
                }
            }
        } else if (type === 'outlook' || type === 'onedrive') {
            if (invite.status !== 'Accepted') continue

            if (invite.permissionType === 'global') {
                let archives = null
                if (type === 'outlook') {
                    archives = await exports.outlookArchives(invite.userId);
                } else if (type === 'onedrive') {
                    archives = await exports.onedriveArchives(invite.userId);
                }
                if (archives) {
                    archives = archives.map((team) => {
                        team.permission = invite.globalPermission
                        return team
                    })
                    result = result.concat(archives)
                }
            } else {
                const ids = invite.workspacePermissions.ms365
                if (ids && ids.length > 0) {
                    for (const id of ids) {
                        if (id.permission.toLowerCase() !== 'none') {
                            let archvies = null
                            if (type === 'outlook') {
                                archvies = await exports.outlookArchives(invite.userId, id.id)
                            } else if (type === 'onedrive') {
                                archvies = await exports.onedriveArchives(invite.userId, id.id)
                            }
                            if (archvies) {
                                archvies = archvies.map((team) => {
                                    team.permission = id.permission
                                    return team
                                })
                                result = result.concat(archvies)
                            }
                        }
                    }
                    
                }
            }
        } else if (type === 'dropbox') {
            if (invite.status !== 'Accepted') continue

            if (invite.permissionType === 'global') {
                let archives = null
                if (type === 'dropbox') {
                    archives = await exports.dropboxArchives(invite.userId);
                }
                if (archives) {
                    archives = archives.map((team) => {
                        team.permission = invite.globalPermission
                        return team
                    })
                    result = result.concat(archives)
                }
            } else {
                const ids = invite.workspacePermissions.dropbox
                if (ids && ids.length > 0) {
                    for (const id of ids) {
                        if (id.permission.toLowerCase() !== 'none') {
                            let archvies = null
                            if (type === 'dropbox') {
                                archvies = await exports.dropboxArchives(invite.userId, id.id)
                            }
                            if (archvies) {
                                archvies = archvies.map((team) => {
                                    team.permission = id.permission
                                    return team
                                })
                                result = result.concat(archvies)
                            }
                        }
                    }
                    
                }
            }
        }
    }

    return result
  }
  
  exports.outlookFolders = async (accessToken, userId) => {
    const url = `https://graph.microsoft.com/v1.0/users/${userId}/mailFolders`;

    // Helper function to delay
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // Recursive function to fetch folder hierarchy with retry and backoff for rate limits
    const fetchFolders = async (parentFolderId = null, retries = 5, delayMs = 1000) => {
        try {
            const folderUrl = parentFolderId 
                ? `${url}/${parentFolderId}/childFolders` 
                : url;

            const response = await axios.get(folderUrl, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            // Fetch subfolders recursively and build the tree structure
            const folders = await Promise.all(
                response.data.value.map(async (folder) => ({
                    id: folder.id,
                    name: folder.displayName,
                    parentFolderId: folder.parentFolderId,
                    unreadItemCount: folder.unreadItemCount,
                    totalItemCount: folder.totalItemCount,
                    size: folder.sizeInBytes,
                    childFolders: await fetchFolders(folder.id)  // Recursive call for child folders
                }))
            );

            return folders;
        } catch (error) {
            // Check for rate limit error
            if (error.response && error.response.status === 429 && retries > 0) {
                const retryAfter = error.response.headers['retry-after'];
                const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delayMs;
                console.warn(`Rate limit hit, retrying in ${waitTime / 1000} seconds...`);

                // Wait and retry with increased delay
                await delay(waitTime);
                return fetchFolders(parentFolderId, retries - 1, delayMs * 2);
            } else {
                console.error('utils.js outlookFolders error ->', error);
                return [];
            }
        }
    };

    // Start with top-level folders
    return await fetchFolders();
};

exports.outlookFolderMessages = async (accessToken, userId, folderId, page, limit, searchParams = {}) => {
    const skip = (page - 1) * limit;
    
    // Build the filter query
    const filterParts = [];
    
    // Keyword search (subject or body)
    if (searchParams.keywords) {
        filterParts.push(`(contains(subject,'${searchParams.keywords}') or contains(body/content,'${searchParams.keywords}'))`);
    }
    
    // From filter
    if (searchParams.from) {
        filterParts.push(`from/emailAddress/address eq '${searchParams.from}'`);
    }
    
    // To filter
    if (searchParams.to) {
        filterParts.push(`toRecipients/any(t:t/emailAddress/address eq '${searchParams.to}')`);
    }
    
    // Date range filters
    if (searchParams.start) {
        filterParts.push(`receivedDateTime ge ${new Date(searchParams.start).toISOString()}`);
    }
    if (searchParams.end) {
        filterParts.push(`receivedDateTime le ${new Date(searchParams.end).toISOString()}`);
    }
    
    // Combine all filters with AND
    const filterQuery = filterParts.length > 0 
        ? `&$filter=${filterParts.join(' and ')}` 
        : '';
    
    const url = `https://graph.microsoft.com/v1.0/users/${userId}/mailFolders/${folderId}/messages?$top=${limit}&$skip=${skip}${filterQuery}&$count=true&$expand=attachments($select=id,name,size,contentType)`;
    
    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                ConsistencyLevel: "eventual"
            }
        });

        return {
            messages: response.data.value,
            totalCount: response.data['@odata.count']
        };
    } catch (error) {
        console.error('Error fetching messages:', error.response?.data || error.message);
        throw error;
    }
};

exports.fetchGraphDropboxAPIData = async (filters, dbx, dropboxWorkspace, addElasticIndex, updateProgress) => {
    let totalFileSize = 0
    const keywordList = filters.keywords?.toLowerCase().split(",").map(k => k.trim()) || [];
    const filterByDateRange = filters.filterByDateRange
    const startDate = filterByDateRange ? new Date(filters.dateRange.start) : null
    const endDate = filterByDateRange ? new Date(filters.dateRange.end) : null
    try {
        //files
        const fetchVersionHistory = async (path) => {
            try {
                const revisionsResponse = await dbx.filesListRevisions({ path, limit: 10 });
                return revisionsResponse.result.entries.map((rev) => ({
                    id: rev.rev,
                    modifiedTime: rev.server_modified,
                    size: rev.size,
                }));
            } catch (error) {
                console.error(`Error fetching version history for ${path}:`, error);
                throw error
            }
        };

        const fetchAllFiles = async (path = '') => {
            try {
                const response = await dbx.filesListFolder({ path });

                const items = (
                    await Promise.all(
                        response.result.entries.map(async (item) => {
                            const size = item.size || 0;

                            const matchesKeyword =
                                keywordList.length === 0 ||
                                keywordList.some((keyword) =>
                                    item.name.toLowerCase().includes(keyword)
                                );
                            let matchDateRange = !filterByDateRange
                            const versionHistory =
                                item['.tag'] === 'file' ? await fetchVersionHistory(item.path_lower) : [];

                            let s3Key = undefined

                            // store the file if item is a file not folder
                            if (item['.tag'] === 'file') {
                                if (!matchesKeyword) return null;
                                if (filterByDateRange) {
                                    const fileDate = new Date(item.client_modified);
                                    if (fileDate >= startDate && fileDate <= endDate) {
                                        matchDateRange = true;
                                    } else {
                                        return null
                                    }
                                }
                                try {
                                    const fileArr = item.name.split(".");
                                    const fileType = fileArr[fileArr.length-1];
                                    // TODO handle large files
                                    const resp = await dbx.filesDownload({ path: item.path_lower });
                                    s3Key = `Dropbox/${filters.archiveId}/${item.id}/${item.name}`;
                                    await AWS.uploadFile(config.AWS.OUTLOOK_BUCKET, s3Key, resp.result.fileBinary);
                                    totalFileSize += size
                                    await updateProgress()
                                    
                                    //Add indexing
                                    await exports.addIndexQueue('Dropbox', {
                                        workspaceId: dropboxWorkspace.id,
                                        archiveId: filters.archiveId,
                                        fileId: item.id,
                                        fileName: item.name,
                                        fileType: fileType,
                                        size: item.size,
                                        s3Key,
                                        owner: filters.owner,
                                        collectedBy: filters.createdBy
                                    })                                
                                } catch (error) {
                                    console.log(`utils.js LN: 4186-> Error uploading to S3 bucket from dopbox\n filepath: ${item.path_lower}`, error)   
                                    throw error
                                }
                            }

                            // Indexing to ElasticSearch
                            if (matchesKeyword && matchDateRange) {
                                addElasticIndex({
                                    id: item.id,
                                    name: item.name,
                                    mimeType: item['.tag'],
                                    md5Checksum: item.content_hash,
                                    createdTime: item.server_created_time,
                                    modifiedTime: item.server_modified_time,
                                    path: item.path_lower,
                                    size,
                                    s3Key,
                                    isDeleted: false
                                })
                            }

                            const formattedItem = {
                                key: item.id,
                                label: item.name,
                                data: {
                                    label: item.name,
                                    size: size,
                                    formattedSize: `${(size / 1024 / 1024).toFixed(2)} MB`,
                                    type: item['.tag'],
                                    path: item.path_lower,
                                    createdTime: item.server_created_time || null,
                                    modifiedTime: item.server_modified_time || null,
                                    md5Checksum: item.content_hash || 'N/A',
                                    thumbnailLink: item.thumbnail
                                        ? `https://content.dropboxapi.com/2/files/get_thumbnail/${item.id}`
                                        : null,
                                    versionHistory,
                                    s3Key,
                                },
                                icon: item['.tag'] === 'folder' ? 'pi pi-fw pi-folder' : 'pi pi-fw pi-file',
                                children: [],
                            };

                            if (item['.tag'] === 'folder') {
                                const children = await fetchAllFiles(item.path_lower);
                                if (children.length === 0) {
                                    return null;
                                }
                                formattedItem.children = children;
                            }

                            if (item[".tag"] === "file" && (!matchesKeyword || !matchDateRange)) {
                                return null;
                            }

                            return formattedItem;
                        })
                    )
                ).filter(Boolean);
                
                let cursor = response.result.cursor;
                while (response.result.has_more) {
                    const continueResponse = await dbx.filesListFolderContinue({ cursor });
                    cursor = continueResponse.result.cursor;
                    items.push(...await fetchAllFiles(cursor));
                }

                return items;
            } catch (error) {
                if (error.status === 429) {
                    const retryAfter = error.headers['retry-after'] || 2;
                    console.warn(`Rate limited. Retrying after ${retryAfter} seconds.`);
                    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
                    return fetchAllFiles(path);
                } else {
                    throw error;
                }
            }
        };

        const filesAndFolders = await fetchAllFiles();

        //shared
        const fetchSharedLinks = async (cursor = null) => {
            let sharedItems = [];
            try {
                let response;

                // Check if it's the first fetch or a continuation
                if (cursor) {
                    response = await dbx.sharingListSharedLinks({ cursor });
                } else {
                    response = await dbx.sharingListSharedLinks();
                }

                const { links, has_more, cursor: nextCursor } = response.result;
                // Format the shared links
                

                sharedItems.push(...links);

                // Fetch additional pages if available
                if (has_more) {
                    const additionalItems = await fetchSharedLinks(nextCursor);
                    sharedItems = sharedItems.concat(additionalItems);
                }
            } catch (error) {
                if (error.status === 429) {
                    const retryAfter = error.headers['retry-after'] || 2;
                    console.warn(`Rate limited. Retrying after ${retryAfter} seconds.`);
                    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
                    return fetchSharedLinks(cursor);
                }
                console.log("Dropbox Shared Items Error->", error)
                throw error;
            }
            sharedItems.forEach((item) => addElasticIndex({
                id: item.id,
                name: item.name,
                mimeType: item['.tag'],
                md5Checksum: item.content_hash,
                createdTime: item.client_modified,
                modifiedTime: item.server_modified,
                path: item.path_lower,
                url: item.url,
                size: item.size,
                isDeleted: false
            }))
            
            return sharedItems;
        };

        // const sharedFilesAndFolders = await fetchSharedLinks();
        const sharedFilesAndFolders = (await fetchSharedLinks()).filter(item =>
            keywordList.length === 0 ||
            keywordList.some(keyword => item.name.toLowerCase().includes(keyword))
        );

        //deleted
        const fetchDeletedItems = async (cursor = null) => {
            let deletedItems = [];
            try {
                let response;

                if (cursor) {
                    // Continue fetching deleted items using the cursor
                    response = await dbx.filesListFolderContinue({ cursor });
                } else {
                    // Initial fetch of deleted items
                    response = await dbx.filesListFolder({
                        path: '',
                        recursive: true,
                        include_deleted: true,
                    });
                }

                const { entries, has_more, cursor: nextCursor } = response.result;

                // Filter out only deleted files and folders
                const deletedEntries = entries.filter((entry) => entry['.tag'] === 'deleted');
                deletedItems.push(...deletedEntries);

                // Fetch additional pages if available
                if (has_more) {
                    const additionalItems = await fetchDeletedItems(nextCursor);
                    deletedItems = deletedItems.concat(additionalItems);
                }
               
                
            } catch (error) {
                if (error.status === 429) {
                    const retryAfter = error.headers['retry-after'] || 2;
                    console.warn(`Rate limited. Retrying after ${retryAfter} seconds.`);
                    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
                    return fetchDeletedItems(cursor);
                }
                console.log("Dropbox deleted items error-> ", error)
                throw error;
            }

            // Indexing to ElasticSearch
            deletedItems.forEach((item) => addElasticIndex({
                name: item.name,
                mimeType: item['.tag'],
                path: item.path_display,
                isDeleted: true
            }))

            return deletedItems;
        };

        // const deletedFilesAndFolders = await fetchDeletedItems();
        const deletedFilesAndFolders = (await fetchDeletedItems()).filter(item =>
            keywordList.length === 0 ||
            keywordList.some(keyword => item.name.toLowerCase().includes(keyword))
        );

         

        return {files:filesAndFolders, shared:sharedFilesAndFolders, deleted:deletedFilesAndFolders, totalFileSize};
    } catch {
        return {files:[], shared:[], deleted:[], totalFileSize};
    }
};

exports.extractKeywordsFromFile =  async (fileContent, fileType) => {
    let textContent = '';

    if (fileType === 'application/pdf') {
        // Parse PDF
        const pdfData = await pdfParse(fileContent);
        textContent = pdfData.text;
    } else if (fileType.startsWith('image/')) {
        // Perform OCR on images
        const ocrResult = await tesseract.recognize(fileContent);
        textContent = ocrResult.data.text;
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Parse DOCX
        textContent = await extractTextFromDocx(fileContent);
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        // Parse XLSX
        textContent = await extractTextFromXlsx(fileContent);
    } else if (fileType === 'text/csv' || fileType === 'application/vnd.ms-excel') {
        // Parse CSV
        textContent = await extractTextFromCSV(fileContent);
    } else if (fileType === 'text/plain') {
        // Plain text
        textContent = fileContent.toString('utf8');
    } else {
        throw new Error('Unsupported file type for keyword extraction');
    }

    // Extract keywords using natural library
    // const tokenizer = new natural.WordTokenizer();
    // const words = tokenizer.tokenize(textContent);
    // const keywords = [...new Set(words)].slice(0, 50); // Extract top 50 unique keywords

    return textContent;
};