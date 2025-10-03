const cron = require('node-cron');
const { WebClient, retryPolicies } = require("@slack/web-api");
const SlackTeam = require('./models/slack_team');
const SlackMember = require('./models/slack_member');
const ArchiveState = require('./models/archive_state');
const archiveController = require('./controller/archive');
const User = require('./models/user');
const FileQueue = require('./models/file_queue');
const { downloadFileAsBuffer } = require('./controller/aws');
const config = require('./config/app.config');
const { extractKeywordsFromFile } = require('./controller/utils');
const { addIndex } = require('./controller/ai_search');

cron.schedule('* * * * *', async () => {
    //check archive queued apps
    const inProgressApps = await ArchiveState.find({state: 'progress'});
    if (inProgressApps.length > 0) {
        console.log("==============In Progress Apps=================");
        console.log(inProgressApps);
    }
    if (inProgressApps && inProgressApps.length > 2)
        return;
    const limit = !inProgressApps ? 3 : 3 - inProgressApps.length;
    
    const queuedApps = await ArchiveState.find({state: 'queued'}).sort({createdAt: -1}).limit(limit).exec();
    if (queuedApps.length > 0) {
        console.log("==============Queued Apps=================");
        console.log(queuedApps);
    }
    queuedApps.forEach(async (app) => {
        app.state = 'progress';
        await app.save();

        // Test Microsoft graph api
        archiveController.progress4(app);
    });
});

cron.schedule('* * * * *', async () => {
    // console.log('Starting cron job to process queued files...');

    try {
        // Check the number of files in progress
        const inProgressCount = await FileQueue.countDocuments({ state: 'progress' });

        if (inProgressCount >= 10) {
            console.log('10 files are already being processed. Waiting for the next cycle.');
            return;
        }

        // Determine how many more files can be processed
        const availableSlots = 10 - inProgressCount;

        // Fetch up to `availableSlots` files in the 'queued' state
        const queuedFiles = await FileQueue.find({ state: 'queued' }).sort({ createdAt: -1 }).limit(availableSlots);

        if (queuedFiles.length === 0) {
            // console.log('No queued files to process.');
            return;
        }

        // Update state to 'progress' for the selected files
        const fileIds = queuedFiles.map(file => file._id);
        await FileQueue.updateMany({ _id: { $in: fileIds } }, { $set: { state: 'progress' } });

        console.log(`Marked ${fileIds.length} files as "progress". Processing...`);

        // Process each file
        for (const fileInfo of queuedFiles) {
            try {
                console.log(`Processing file: ${fileInfo.fileName} (${fileInfo.fileType})`);

                // Download the file from S3
                const fileContent = await downloadFileAsBuffer(config.AWS.OUTLOOK_BUCKET, fileInfo.s3Key);
                if (!fileContent) continue;
                // Extract keywords from the file content
                const keywords = await extractKeywordsFromFile(fileContent, fileInfo.fileType);
                addIndex({
                    index: config.ELASTIC_INFO.FILES_INDEX,
                    id: `${fileInfo.workspaceId}_${fileInfo.archiveId}_${fileInfo.fileId}`,
                    body: {
                        workspaceId: fileInfo.workspaceId || null,
                        archiveId: fileInfo.archiveId || null,
                        fileId: fileInfo.fileId,
                        fileName: fileInfo.fileName,
                        fileType: fileInfo.fileType,
                        hash: fileInfo.hash || null,
                        size: fileInfo.size || null,
                        s3Key: fileInfo.s3Key,
                        owner: fileInfo.owner || null,
                        collectedBy: fileInfo.collectedBy || null,
                        createdAt: fileInfo.createdAt,
                        updatedAt: fileInfo.updatedAt,
                        fileContent: keywords
                    }
                })

                // Update state to 'completed' in FileQueue
                await FileQueue.updateOne({ _id: fileInfo._id }, { $set: { state: 'completed' } });
                console.log(`Successfully indexed file: ${fileInfo.fileName}`);
            } catch (fileError) {
                console.error(`Error processing file ${fileInfo.fileName}: ${fileError.message}`);
                // Optionally update the state to 'error' for failed files
                await FileQueue.updateOne({ _id: fileInfo._id }, { $set: { state: 'error' } });
            }
        }
    } catch (error) {
        console.error(`Cron job error: ${error.message}`);
    }
    console.log('Cron job completed.');
});

const cleanupUnverifiedAccounts = async () => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);  // Accounts older than 7 days
    
    await User.deleteMany({
        isVerified: false,
        verificationTokenExpires: { $lt: new Date() }
    });
};


cron.schedule('0 0 * * *', cleanupUnverifiedAccounts);  // Run every day at midnight
console.log("CronJob started!");