const cron = require('node-cron');
const { WebClient, retryPolicies } = require("@slack/web-api");
const SlackTeam = require('./models/slack_team');
const Archive = require('./models/archive');
const ArchiveLog = require('./models/archive_log');
const ArchiveCron = require('./models/archive_cron');
const Utils = require('./controller/utils');
const archiveController = require('./controller/archive');

const getClient = (token) => {
    return new WebClient(token, {
      retryConfig: retryPolicies.rapidRetryPolicy
    });
}

const processArchive = async () => {
  let New_York_datetime_str = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
  let date_New_York = new Date(New_York_datetime_str);
  const hour = date_New_York.getHours();
  const archive_cron_list = await ArchiveCron.find({time: hour});
  for (const cronRow of archive_cron_list) {
    const userid = cronRow.userid;
    const archiveList = await SlackTeam.find({clientId: userid});
    console.log('cronjob archive start:', archiveList);
    const queue = [];
    for (const item of archiveList) {
        item.id = item._id;
        item.type = 'Slack';
        queue.push(item);
    }

    if (queue.length > 0) {
        archiveController.processArchive2(queue, 'Daily scheduled archive');
    }

    console.log('cronjob archive end');
  }
}

// Define your cron job function
const archiveCronJob = async () => {
  await processArchive();
};

// Schedule the cron job to run every hour at 0 minute
cron.schedule('0 * * * *', archiveCronJob);
archiveCronJob();
console.log("Archive CronJob started!");