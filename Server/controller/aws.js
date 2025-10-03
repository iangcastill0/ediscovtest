const AWS = require('aws-sdk');
const fs = require('fs').promises;
const { promisify } = require('util');
const config = require('../config/app.config')

const region = 'us-west-2';
AWS.config.update({ region: region });

const s3 = new AWS.S3();

const createBucket = async (bucketName) => {
    console.log("BucketName: ", bucketName);
    try {
        const data = await s3.listBuckets().promise();
        const bucketExists = data.Buckets.some(bucket => bucket.Name === bucketName);
        console.log("BucketList: ", data.Buckets)
        if (bucketExists) {
            console.log(`Bucket "${bucketName}" already exists.`);
        } else {
            const bucketParams = {
                Bucket: bucketName,
                ACL: 'private'
            };
            await s3.createBucket(bucketParams).promise();
            console.log(`Bucket "${bucketName}" created successfully`);
        }
    } catch (err) {
        console.error('Error:', err);
    }
};

const uploadFileStream = (bucketName, key, bodyStream) => {
    const params = {
        Bucket: bucketName,
        Key: key,
        Body: bodyStream,
        ACL: 'private'
    };

    return new Promise((resolve, reject) => {
        s3.upload(params, (err, data) => {
            if (err) {
                console.error('AWS Upload Error:', err);
                return reject(err);
            }
            console.log(`File uploaded successfully to ${bucketName}/${key}`, data.Location);
            resolve(data);
        });
    });
};

const uploadFile = async (bucketName, fileName, fileContent) => {
    const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: fileContent,
        ACL: 'private'
    };
    try {
        const data = await s3.upload(params).promise();
        console.log(`File uploaded successfully to ${bucketName}/${fileName}`, data.Location);
    } catch (err) {
        console.error('AWS Upload Error:', err);
    }
};

const downloadFileAsBuffer = async (bucketName, fileName) => {
    const params = {
        Bucket: bucketName,
        Key: fileName
    };
    try {
        const data = await s3.getObject(params).promise();
        return data.Body;
    } catch (err) {
        console.error('Error downloading file:', err);
        // throw err;
        return null
    }
};

const streamFileFromS3 = (bucketName, key) => {
    const params = {
        Bucket: bucketName,
        Key: key
    };
    return s3.getObject(params).createReadStream();
};

const deleteFile = async (bucketName, fileName) => {
    const params = {
        Bucket: bucketName,
        Key: fileName
    };
    try {
        await s3.deleteObject(params).promise();
        console.log(`File "${fileName}" deleted successfully from bucket "${bucketName}"`);
    } catch (err) {
        console.error('Error deleting file:', err);
    }
};

const getPresignedUrl= (bucketName, objectKey, expiresIn, mimetype) => {
    const params = {
      Bucket: bucketName,
      Key: objectKey,
      Expires: expiresIn,
      ResponseContentType: mimetype
    };
  
    return s3.getSignedUrl('getObject', params);
  }

(async () => {
    const bucketsToCreate = [config.AWS.OUTLOOK_BUCKET];
    for (const bucketName of bucketsToCreate) {
        await createBucket(bucketName);
    }

    // Example usage
    // const filePath = 'path/to/your/file.txt';
    // const fileContent = await fs.readFile(filePath);
    // await uploadFile('outlook-bucket', 'file.txt', fileContent);

    // try {
    //     const buffer = await downloadFileAsBuffer('outlook-bucket', 'file.txt');
    //     console.log('File downloaded successfully as buffer');
    //     await fs.writeFile('path/to/downloaded/file.txt', buffer);
    // } catch (err) {
    //     console.error('Error:', err);
    // }

    // await deleteFile('outlook-bucket', 'file.txt');
})();

exports.createBucket = createBucket;
exports.uploadFile = uploadFile;
exports.downloadFileAsBuffer = downloadFileAsBuffer;
exports.deleteS3File = deleteFile;
exports.uploadFileStream = uploadFileStream;
exports.streamFileFromS3 = streamFileFromS3;
exports.getPresignedUrl = getPresignedUrl
