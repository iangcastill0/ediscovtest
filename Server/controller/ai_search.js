const { Client } = require('@elastic/elasticsearch')
const { ELASTIC_INFO } = require('../config/app.config')
const OutlookDownloadLog = require('../models/outlook_download_log')
const GmailDownloadLog = require('../models/gmail_download_log')
const elasticClient = new Client({ node: ELASTIC_INFO.SERVER })

elasticClient.indices
    .exists({ index: ELASTIC_INFO.SLACK_INDEX })
    .then(response => {
        if (response.body) {
            console.log(`Index ${ELASTIC_INFO.SLACK_INDEX} already exists`)
            return Promise.resolve()
        } else {
            return elasticClient.indices.create({
                index: ELASTIC_INFO.SLACK_INDEX,
                body: {
                    mappings: {
                        properties: {
                            userId: { type: 'keyword' },// deprecated
                            owner: {type: 'keyword'},
                            createdBy: {type: 'keyword'},
                            teamId: { type: 'keyword' },
                            teamName: { type: 'keyword' },
                            channelId: { type: 'keyword' },
                            channelName: { type: 'keyword' },
                            message: { type: 'text' },
                            startedBy: { type: 'keyword' },
                            realname: { type: 'keyword' },
                            created: { type: 'date', format: 'yyyy-MM-dd HH:mm:ss||strict_date_optional_time||epoch_millis' },
                            files: {
                                type: 'nested',
                                properties: {
                                    id: { type: 'keyword' },
                                    filetype: { type: 'keyword' },
                                    name: { type: 'text' },
                                    url_private: { type: 'text' },
                                    created: { type: 'keyword' },
                                    size: { type: 'keyword' }
                                }
                            },
                            replies: {
                                type: 'nested',
                                properties: {
                                    text: { type: 'text' },
                                    ts: { type: 'keyword' },
                                    user: { type: 'keyword' }
                                }
                            }
                        }
                    }
                }
            })
        }
    })
    .then(response => {
        if (response) {
            console.log(`Index ${ELASTIC_INFO.SLACK_INDEX} created`)
        }
    })
    .catch(error => {
        console.error('Error in index operation:', error)
    })

elasticClient.indices
    .exists({ index: ELASTIC_INFO.OUTLOOK_INDEX })
    .then(response => {
        if (response.body) {
            console.log(`Index ${ELASTIC_INFO.OUTLOOK_INDEX} already exists`)
            return Promise.resolve()
        } else {
            return elasticClient.indices.create({
                index: ELASTIC_INFO.OUTLOOK_INDEX,
                body: {
                    mappings: {
                        properties: {
                            userId: { type: 'keyword' },// deprecated
                            owner: {type: 'keyword'},
                            createdBy: {type: 'keyword'},
                            id: { type: 'keyword' },
                            createdDateTime: { type: 'date' },
                            subject: { type: 'text' },
                            bodyPreview: { type: 'text' },
                            body: { type: 'text' },
                            receivedDateTime: { type: 'date' },
                            sentDateTime: { type: 'date' },
                            hasAttachments: { type: 'keyword' },
                            sender: {
                                properties: {
                                    emailAddress: {
                                        properties: {
                                            name: { type: 'text' },
                                            address: { type: 'keyword' }
                                        }
                                    }
                                }
                            },
                            from: {
                                properties: {
                                    emailAddress: {
                                        properties: {
                                            name: { type: 'text' },
                                            address: { type: 'keyword' }
                                        }
                                    }
                                }
                            },
                            toRecipients: {
                                type: 'nested',
                                properties: {
                                    emailAddress: {
                                        properties: {
                                            name: { type: 'text' },
                                            address: { type: 'keyword' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            })
        }
    })
    .then(response => {
        if (response) {
            console.log(`Index ${ELASTIC_INFO.OUTLOOK_INDEX} created`)
        }
    })
    .catch(error => {
        console.error('Error in index operation:', error)
    })

elasticClient.indices
    .exists({ index: ELASTIC_INFO.FLAGGED_INDEX })
    .then(response => {
        if (response.body) {
            console.log(`Index ${ELASTIC_INFO.FLAGGED_INDEX} already exists`)
            return Promise.resolve()
        } else {
            return elasticClient.indices.create({
                index: ELASTIC_INFO.FLAGGED_INDEX,
                body: {
                    mappings: {
                        properties: {
                            userId: { type: 'keyword' },// deprecated
                            owner: {type: 'keyword'},
                            createdBy: {type: 'keyword'},
                            id: { type: 'keyword' },
                            createdDateTime: { type: 'date' },
                            archiveId: {type: 'keyword'},
                            workspaceName: {type: 'text'},
                            archiveName: {type: 'text'},
                            body: { type: 'text' },
                            collectionId: {type: 'keyword'},
                            type: { type: 'keyword'},
                            data: { type: 'nested'},
                            fileName: { type: 'text' },
                        }
                    }
                }
            })
        }
    })
    .then(response => {
        if (response) {
            console.log(`Index ${ELASTIC_INFO.FLAGGED_INDEX} created`)
        }
    })
    .catch(error => {
        console.error('Error in index operation:', error)
    })

elasticClient.indices
    .exists({ index: ELASTIC_INFO.GMAIL_INDEX })
    .then(response => {
        if (response.body) {
            console.log(`Index ${ELASTIC_INFO.GMAIL_INDEX} already exists`)
            return Promise.resolve()
        } else {
            return elasticClient.indices.create({
                index: ELASTIC_INFO.GMAIL_INDEX,
                body: {
                    mappings: {
                        properties: {
                            userId: { type: 'keyword' },// deprecated
                            owner: {type: 'keyword'},
                            createdBy: {type: 'keyword'},
                            id: { type: 'keyword' },
                            date: { type: 'date' },
                            subject: { type: 'text' },
                            preview: { type: 'text' },
                            body: { type: 'text' },
                            from: { type: 'text'},
                            to: { type: 'text'},
                            attachments: {
                                type: 'nested',
                                properties: {
                                    filename: {type: 'text'},
                                    mimeType: {type: 'text'},
                                    attachmentId: {type: 'keyword'},
                                    s3Key: {type: 'keyword'}
                                }
                            }
                        }
                    }
                }
            })
        }
    })
    .then(response => {
        if (response) {
            console.log(`Index ${ELASTIC_INFO.OUTLOOK_INDEX} created`)
        }
    })
    .catch(error => {
        console.error('Error in index operation:', error)
    })

elasticClient.indices
    .exists({ index: ELASTIC_INFO.ONEDRIVE_INDEX })
    .then(response => {
        if (response.body) {
            console.log(`Index ${ELASTIC_INFO.ONEDRIVE_INDEX} already exists`)
            return Promise.resolve()
        } else {
            return elasticClient.indices.create({
                index: ELASTIC_INFO.ONEDRIVE_INDEX,
                body: {
                    mappings: {
                        properties: {
                            userId: { type: 'keyword' },// deprecated
                            owner: {type: 'keyword'},
                            collectedBy: {type: 'keyword'},
                            id: { type: 'keyword' },
                            name: { type: 'text' },
                            createdDateTime: { type: 'date' },
                            createdBy: {
                                properties : {
                                    user: {
                                        properties: {
                                            email: { type: 'text' },
                                            id: { type: 'keyword' },
                                            displayName: { type: 'text' }
                                        }
                                    }
                                }
                            },
                            lastModifiedDateTime: { type: 'date' },
                            lastModifiedBy: {
                                properties : {
                                    user: {
                                        properties: {
                                            email: { type: 'text' },
                                            id: { type: 'keyword' },
                                            displayName: { type: 'text' }
                                        }
                                    }
                                }
                            },
                            fileSystemInfo: {
                                properties: {
                                    createdDateTime: { type: 'date' },
                                    lastModifiedDateTime: { type: 'date' }
                                }
                            },
                            size: { type: 'integer'}
                        }
                    }
                }
            })
        }
    })
    .then(response => {
        if (response) {
            console.log(`Index ${ELASTIC_INFO.ONEDRIVE_INDEX} created`)
        }
    })
    .catch(error => {
        console.error('Error in index operation:', error)
    })

elasticClient.indices
    .exists({ index: ELASTIC_INFO.DROPBOX_INDEX })
    .then(response => {
        if (response.body) {
            console.log(`Index ${ELASTIC_INFO.DROPBOX_INDEX} already exists`)
            return Promise.resolve()
        } else {
            return elasticClient.indices.create({
                index: ELASTIC_INFO.DROPBOX_INDEX,
                body: {
                    mappings: {
                        properties: {
                            userId: { type: 'keyword' },// deprecated
                            owner: {type: 'keyword'},
                            createdBy: {type: 'keyword'},
                            id: { type: 'keyword' },
                            name: { type: 'text' },
                            mimeType: { type: 'keyword'},
                            md5Checksum: {type: 'keyword'},
                            createdTime: { type: 'date' },
                            modifiedTime: { type: 'date' },
                            path: {type: 'text'},
                            size: { type: 'integer'},
                            isDeleted: {type: 'keyword'} 
                        }
                    }
                }
            })
        }
    })
    .then(response => {
        if (response) {
            console.log(`Index ${ELASTIC_INFO.DROPBOX_INDEX} created`)
        }
    })
    .catch(error => {
        console.error('Error in index operation:', error)
    })

    elasticClient.indices
    .exists({ index: ELASTIC_INFO.GOOOGLEDRIVE_INDEX })
    .then(response => {
        if (response.body) {
            console.log(`Index ${ELASTIC_INFO.GOOOGLEDRIVE_INDEX} already exists`)
            return Promise.resolve()
        } else {
            return elasticClient.indices.create({
                index: ELASTIC_INFO.GOOOGLEDRIVE_INDEX,
                body: {
                    mappings: {
                        properties: {
                            userId: { type: 'keyword' },// deprecated
                            owner: {type: 'keyword'},
                            createdBy: {type: 'keyword'},
                            id: { type: 'keyword' },
                            name: { type: 'text' },
                            mimeType: { type: 'keyword'},
                            md5Checksum: {type: 'keyword'},
                            createdTime: { type: 'date' },
                            modifiedTime: { type: 'date' },
                            size: { type: 'integer'}
                        }
                    }
                }
            })
        }
    })
    .then(response => {
        if (response) {
            console.log(`Index ${ELASTIC_INFO.GOOOGLEDRIVE_INDEX} created`)
        }
    })
    .catch(error => {
        console.error('Error in index operation:', error)
    })

elasticClient.indices
.exists({ index: ELASTIC_INFO.FILES_INDEX }) // Check if the index already exists
.then(response => {
    if (response.body) {
        console.log(`Index ${ELASTIC_INFO.FILES_INDEX} already exists`);
        return Promise.resolve();
    } else {
        return elasticClient.indices.create({
            index: ELASTIC_INFO.FILES_INDEX,
            body: {
                mappings: {
                    properties: {
                        workspaceId: { type: 'keyword' },  // Workspace ID for organization
                        archiveId: { type: 'keyword' },    // Archive ID if applicable
                        fileId: { type: 'keyword' },       // Unique identifier for the file
                        fileName: { type: 'text' },        // File name, searchable
                        fileType: { type: 'keyword' },     // MIME type or file type
                        hash: { type: 'keyword' },         // File hash for integrity checks
                        size: { type: 'integer' },         // File size in bytes
                        s3Key: { type: 'keyword' },        // S3 storage key
                        owner: { type: 'keyword' },        // File owner
                        collectedBy: { type: 'keyword' },  // User/system that collected the file
                        createdAt: { type: 'date' },       // Creation timestamp
                        updatedAt: { type: 'date' },       // Last updated timestamp
                        content: { 
                            type: 'text',                 // File content for full-text search
                            analyzer: 'standard'          // Standard text analyzer
                        }
                    }
                },
                settings: {
                    analysis: {
                        analyzer: {
                            content_analyzer: {
                                type: 'standard',
                                stopwords: '_english_'    // Custom stopwords for better text indexing
                            }
                        }
                    }
                }
            }
        });
    }
})
.then(response => {
    if (response) {
        console.log('Index "FilesIndex" created successfully');
    }
})
.catch(error => {
    console.error('Error in index operation:', error);
});


exports.addIndex = data => {
    elasticClient
        .index(data)
        .then(response => {
            console.log('Indexed')
        })
        .catch(err => {
            console.log('Error indexing document:', err)
        })
}

exports.deleteSlackIndex = async (id) => {
    try {
        const response = await elasticClient.delete({
            index: ELASTIC_INFO.SLACK_INDEX,
            id: id
        });
        console.log('Document deleted:', response);
    } catch (error) {
        if (error.meta && error.meta.body && error.meta.body.result === 'not_found') {
            console.error('Document of Outlook not found');
        } else {
            console.error('Error deleting document in Outlook:', error);
        }
    }
}

exports.deleteOutlookIndex = async (id) => {
    try {
        const response = await elasticClient.delete({
            index: ELASTIC_INFO.OUTLOOK_INDEX,
            id: id
        });
        console.log('Document deleted:', response);
    } catch (error) {
        if (error.meta && error.meta.body && error.meta.body.result === 'not_found') {
            console.error('Document of Outlook not found');
        } else {
            console.error('Error deleting document in Outlook:', error);
        }
    }
}

exports.deleteFlaggedCollectionsIndex = async (id) => {
    try {
        const response = await elasticClient.delete({
            index: ELASTIC_INFO.FLAGGED_INDEX,
            id: id
        });
        console.log('Document deleted:', response);
    } catch (error) {
        if (error.meta && error.meta.body && error.meta.body.result === 'not_found') {
            console.error('Document of FlaggedCollections not found');
        } else {
            console.error('Error deleting document in FlaggedCollections:', error);
        }
    }
}

exports.deleteOneDriveIndex = async (id) => {
    try {
        const response = await elasticClient.delete({
            index: ELASTIC_INFO.ONEDRIVE_INDEX,
            id: id
        });
        console.log('Document deleted:', response);
    } catch (error) {
        if (error.meta && error.meta.body && error.meta.body.result === 'not_found') {
            console.error('Document of Onedrive not found');
        } else {
            console.error('Error deleting document in OneDrive:', error);
        }
    }
}

exports.deleteGmailIndex = async (id) => {
    try {
        const response = await elasticClient.delete({
            index: ELASTIC_INFO.GMAIL_INDEX,
            id: id
        });
        console.log('Document deleted:', response);
    } catch (error) {
        if (error.meta && error.meta.body && error.meta.body.result === 'not_found') {
            console.error('Document of Gmail not found');
        } else {
            console.error('Error deleting document in Gmail:', error);
        }
    }
}

exports.deleteGDriveIndex = async (id) => {
    try {
        const response = await elasticClient.delete({
            index: ELASTIC_INFO.GOOOGLEDRIVE_INDEX,
            id: id
        });
        console.log('Document deleted:', response);
    } catch (error) {
        if (error.meta && error.meta.body && error.meta.body.result === 'not_found') {
            console.error('Document of Google drive not found');
        } else {
            console.error('Error deleting document in Google drive:', error);
        }
    }
}

exports.deleteDropboxIndex = async (id) => {
    try {
        const response = await elasticClient.delete({
            index: ELASTIC_INFO.DROPBOX_INDEX,
            id: id
        });
        console.log('Document deleted:', response);
    } catch (error) {
        if (error.meta && error.meta.body && error.meta.body.result === 'not_found') {
            console.error('Document of Dropbox not found');
        } else {
            console.error('Error deleting document in Dropbox:', error);
        }
    }
}


exports.slackSearch = async (parameterObj, userId, pageNumber = 0, pageSize = 10) => {
    try {

        const mustConditions = [
            {
                bool: {
                    should: [
                        { term: { owner: userId } },
                        { term: { createdBy: userId } }
                    ],
                    minimum_should_match: 1
                }
            }
        ];

        // Add full-text search if query exists
        if (parameterObj.query) {
            mustConditions.push({
                bool: {
                    should: [
                        { 
                            match: { 
                                message: {
                                    query: parameterObj.query,
                                    fuzziness: 'AUTO'
                                }
                            } 
                        },
                        { 
                            match: { 
                                "files.name": {
                                    query: parameterObj.query
                                }
                            } 
                        }
                    ],
                    minimum_should_match: 1
                }
            });
        }

        // // Filter by sender email
        // if (parameterObj.from) {
        //     mustConditions.push({ 
        //         term: { 
        //             'from.emailAddress.address.keyword': parameterObj.from 
        //         } 
        //     });
        // }

        // // Filter by recipient email (using nested query)
        // if (parameterObj.to) {
        //     mustConditions.push({
        //         nested: {
        //             path: 'toRecipients',
        //             query: {
        //                 term: {
        //                     'toRecipients.emailAddress.address.keyword': parameterObj.to
        //                 }
        //             }
        //         }
        //     });
        // }

        // Date range filter
        if (parameterObj.start || parameterObj.end) {
            const rangeQuery = { 
                created: {} 
            };
            if (parameterObj.start) rangeQuery.created.gte = parameterObj.start;
            if (parameterObj.end) rangeQuery.created.lte = parameterObj.end;
            mustConditions.push({ range: rangeQuery });
        }

        // Archive filter
        if (parameterObj.archives) {
            const archivedArr = parameterObj.archives.split(',').filter(Boolean);
            if (archivedArr.length > 0) {
                mustConditions.push({
                    terms: {
                        backupId: archivedArr
                    }
                });
            }
        }

        const response = await elasticClient.search({
            index: ELASTIC_INFO.SLACK_INDEX,
            from: pageNumber * pageSize,
            size: pageSize,
            body: {
                query: {
                    bool: {
                        must: mustConditions
                    }
                },
            }
        });

        return {
            total: response.hits.total.value,
            results: response.hits.hits
        };
    } catch (error) {
        console.error('Error during search:', error);
        return {
            total: 0,
            results: []
        };
    }
};

exports.outlookSearch = async (parameterObj, userId, pageNumber = 0, pageSize = 10) => {
    try {
        // Base conditions - include userId as either owner or createdBy
        const mustConditions = [
            {
                bool: {
                    should: [
                        { term: { owner: userId } },
                        { term: { createdBy: userId } }
                    ],
                    minimum_should_match: 1
                }
            }
        ];

        // Add full-text search if query exists
        if (parameterObj.query) {
            mustConditions.push({
                bool: {
                    should: [
                        { 
                            match: { 
                                body: {
                                    query: parameterObj.query,
                                    fuzziness: 'AUTO'
                                }
                            } 
                        },
                        { 
                            match: { 
                                subject: {
                                    query: parameterObj.query,
                                    boost: 2.0
                                }
                            } 
                        },
                        { 
                            match: { 
                                bodyPreview: parameterObj.query 
                            } 
                        }
                    ],
                    minimum_should_match: 1
                }
            });
        }

        // Filter by sender email
        if (parameterObj.from) {
            mustConditions.push({ 
                term: { 
                    'from.emailAddress.address.keyword': parameterObj.from 
                } 
            });
        }

        // Filter by recipient email (using nested query)
        if (parameterObj.to) {
            mustConditions.push({
                nested: {
                    path: 'toRecipients',
                    query: {
                        term: {
                            'toRecipients.emailAddress.address.keyword': parameterObj.to
                        }
                    }
                }
            });
        }

        // Date range filter
        if (parameterObj.start || parameterObj.end) {
            const rangeQuery = { 
                createdDateTime: {} 
            };
            if (parameterObj.start) rangeQuery.createdDateTime.gte = parameterObj.start;
            if (parameterObj.end) rangeQuery.createdDateTime.lte = parameterObj.end;
            mustConditions.push({ range: rangeQuery });
        }

        // Archive filter
        if (parameterObj.archives) {
            const archivedArr = parameterObj.archives.split(',').filter(Boolean);
            if (archivedArr.length > 0) {
                mustConditions.push({
                    terms: {
                        archiveId: archivedArr
                    }
                });
            }
        }

        const response = await elasticClient.search({
            index: ELASTIC_INFO.OUTLOOK_INDEX,
            from: pageNumber * pageSize,
            size: pageSize,
            body: {
                query: {
                    bool: {
                        must: mustConditions
                    }
                },
                highlight: {
                    fields: {
                        subject: {},
                        body: {},
                        bodyPreview: {}
                    }
                }
            }
        });

        // Process results with download logs
        const messages = await Promise.all(response.hits.hits.map(async (hit) => {
            const downloadLog = await OutlookDownloadLog.findOne({ messageId: hit._source.id });
            return {
                ...hit._source,
                highlight: hit.highlight,
                downloadLogs: downloadLog ? downloadLog.logs : []
            };
        }));

        return {
            total: response.hits.total.value,
            results: messages
        };
    } catch (error) {
        console.error('Error during search:', error);
        return {
            total: 0,
            results: []
        };
    }
};

exports.oneDriveSearch = async (parameterObj, userId, pageNumber = 0, pageSize = 10) => {
    try {
        const mustConditions = [
            {
                bool: {
                    should: [
                        { term: { owner: userId } },
                        { term: { collectedBy: userId } }
                    ],
                    minimum_should_match: 1
                }
            }
        ];

        // Add full-text search if query exists
        if (parameterObj.query) {
            mustConditions.push({
                bool: {
                    should: [
                        { 
                            match: { 
                                name: {
                                    query: parameterObj.query,
                                    fuzziness: 'AUTO'
                                }
                            } 
                        }
                    ],
                    minimum_should_match: 1
                }
            });
        }

        // // Filter by sender email
        // if (parameterObj.from) {
        //     mustConditions.push({ 
        //         term: { 
        //             'from.emailAddress.address.keyword': parameterObj.from 
        //         } 
        //     });
        // }

        // // Filter by recipient email (using nested query)
        // if (parameterObj.to) {
        //     mustConditions.push({
        //         nested: {
        //             path: 'toRecipients',
        //             query: {
        //                 term: {
        //                     'toRecipients.emailAddress.address.keyword': parameterObj.to
        //                 }
        //             }
        //         }
        //     });
        // }

        // Date range filter
        if (parameterObj.start || parameterObj.end) {
            const rangeQuery = { 
                createdDateTime: {} 
            };
            if (parameterObj.start) rangeQuery.createdDateTime.gte = parameterObj.start;
            if (parameterObj.end) rangeQuery.createdDateTime.lte = parameterObj.end;
            mustConditions.push({ range: rangeQuery });
        }

        // Archive filter
        if (parameterObj.archives) {
            const archivedArr = parameterObj.archives.split(',').filter(Boolean);
            if (archivedArr.length > 0) {
                mustConditions.push({
                    terms: {
                        archiveId: archivedArr
                    }
                });
            }
        }
        const response = await elasticClient.search({
            index: ELASTIC_INFO.ONEDRIVE_INDEX,
            from: pageNumber * pageSize, // Calculate the starting point
            size: pageSize, // Set the number of results to return
            body: {
                query: {
                    bool: {
                        must: mustConditions
                    }
                }
            }
        });

        // const messages = await Promise.all(response.hits.hits.map(async (msg) => {
        //     const downloadLog = await OutlookDownloadLog.findOne({ messageId: msg._source.id });
        //     msg._source.downloadLogs = downloadLog ? downloadLog.logs : [];
        //     return msg;
        // }));

        return {
            total: response.hits.total.value,
            results: response.hits.hits
        };
    } catch (error) {
        console.error('Error during search:', error);
        return {
            total: 0,
            results: []
        };
    }
};

exports.gmailSearch = async (parameterObj, userId, pageNumber = 0, pageSize = 10) => {
    try {
        const mustConditions = [
            {
                bool: {
                    should: [
                        { term: { owner: userId } },
                        { term: { createdBy: userId } }
                    ],
                    minimum_should_match: 1
                }
            }
        ];

        // Add full-text search if query exists
        if (parameterObj.query) {
            mustConditions.push({
                bool: {
                    should: [
                        { 
                            match: { 
                                body: {
                                    query: parameterObj.query,
                                    fuzziness: 'AUTO'
                                }
                            } 
                        },
                        { 
                            match: { 
                                subject: {
                                    query: parameterObj.query,
                                    boost: 2.0
                                }
                            } 
                        },
                        { 
                            match: { 
                                preview: parameterObj.query 
                            } 
                        }
                    ],
                    minimum_should_match: 1
                }
            });
        }

        // Filter by sender email
        if (parameterObj.from) {
            mustConditions.push({ 
                term: { 
                    from: parameterObj.from 
                } 
            });
        }

        // Filter by recipient email (using nested query)
        if (parameterObj.to) {
            mustConditions.push({
                nested: {
                    path: 'toRecipients',
                    query: {
                        term: {
                            to: parameterObj.to
                        }
                    }
                }
            });
        }

        // Date range filter
        if (parameterObj.start || parameterObj.end) {
            const rangeQuery = { 
                date: {} 
            };
            if (parameterObj.start) rangeQuery.date.gte = parameterObj.start;
            if (parameterObj.end) rangeQuery.date.lte = parameterObj.end;
            mustConditions.push({ range: rangeQuery });
        }

        // Archive filter
        if (parameterObj.archives) {
            const archivedArr = parameterObj.archives.split(',').filter(Boolean);
            if (archivedArr.length > 0) {
                mustConditions.push({
                    terms: {
                        archiveId: archivedArr
                    }
                });
            }
        }

        const response = await elasticClient.search({
            index: ELASTIC_INFO.GMAIL_INDEX,
            from: pageNumber * pageSize, // Calculate the starting point
            size: pageSize, // Set the number of results to return
            body: {
                query: {
                    bool: {
                        must: mustConditions
                    }
                }
            }
        });

        const messages = await Promise.all(response.hits.hits.map(async (msg) => {
            const downloadLog = await GmailDownloadLog.findOne({ messageId: msg._source.id });
            msg._source.downloadLogs = downloadLog ? downloadLog.logs : [];
            return msg;
        }));

        return {
            total: response.hits.total.value,
            results: messages
        };
    } catch (error) {
        console.error('Error during search:', error);
        return {
            total: 0,
            results: []
        };
    }
};

exports.gDriveSearch = async (parameterObj, userId, pageNumber = 0, pageSize = 10) => {
    try {
        // Base conditions - include userId as either owner or createdBy
        const mustConditions = [
            {
                bool: {
                    should: [
                        { term: { owner: userId } },
                        { term: { createdBy: userId } }
                    ],
                    minimum_should_match: 1
                }
            }
        ];

        // Add full-text search if query exists
        if (parameterObj.query) {
            mustConditions.push({
                bool: {
                    should: [
                        { 
                            match: { 
                                name: {
                                    query: parameterObj.query,
                                    fuzziness: 'AUTO'
                                }
                            } 
                        },
                        { 
                            match: { 
                                mimeType: {
                                    query: parameterObj.query,
                                    boost: 2.0
                                }
                            } 
                        }
                    ],
                    minimum_should_match: 1
                }
            });
        }

        // // Filter by sender email
        // if (parameterObj.from) {
        //     mustConditions.push({ 
        //         term: { 
        //             'from.emailAddress.address.keyword': parameterObj.from 
        //         } 
        //     });
        // }

        // // Filter by recipient email (using nested query)
        // if (parameterObj.to) {
        //     mustConditions.push({
        //         nested: {
        //             path: 'toRecipients',
        //             query: {
        //                 term: {
        //                     'toRecipients.emailAddress.address.keyword': parameterObj.to
        //                 }
        //             }
        //         }
        //     });
        // }

        // Date range filter
        if (parameterObj.start || parameterObj.end) {
            const rangeQuery = { 
                createdTime: {} 
            };
            if (parameterObj.start) rangeQuery.createdTime.gte = parameterObj.start;
            if (parameterObj.end) rangeQuery.createdTime.lte = parameterObj.end;
            mustConditions.push({ range: rangeQuery });
        }

        // Archive filter
        if (parameterObj.archives) {
            const archivedArr = parameterObj.archives.split(',').filter(Boolean);
            if (archivedArr.length > 0) {
                mustConditions.push({
                    terms: {
                        archiveId: archivedArr
                    }
                });
            }
        }
        const response = await elasticClient.search({
            index: ELASTIC_INFO.GOOOGLEDRIVE_INDEX,
            from: pageNumber * pageSize, // Calculate the starting point
            size: pageSize, // Set the number of results to return
            body: {
                query: {
                    bool: {
                        must: mustConditions
                    }
                }
            }
        });

        // const messages = await Promise.all(response.hits.hits.map(async (msg) => {
        //     const downloadLog = await OutlookDownloadLog.findOne({ messageId: msg._source.id });
        //     msg._source.downloadLogs = downloadLog ? downloadLog.logs : [];
        //     return msg;
        // }));

        return {
            total: response.hits.total.value,
            results: response.hits.hits
        };
    } catch (error) {
        console.error('Error during search:', error);
        return {
            total: 0,
            results: []
        };
    }
};

exports.dropboxSearch = async (parameterObj, userId, pageNumber = 0, pageSize = 10) => {
    try {
        // Base conditions - include userId as either owner or createdBy
        const mustConditions = [
            {
                bool: {
                    should: [
                        { term: { owner: userId } },
                        { term: { createdBy: userId } }
                    ],
                    minimum_should_match: 1
                }
            }
        ];

        // Add full-text search if query exists
        if (parameterObj.query) {
            mustConditions.push({
                bool: {
                    should: [
                        { 
                            match: { 
                                name: {
                                    query: parameterObj.query,
                                    fuzziness: 'AUTO'
                                }
                            } 
                        },
                        { 
                            match: { 
                                mimeType: {
                                    query: parameterObj.query,
                                    boost: 2.0
                                }
                            } 
                        }
                    ],
                    minimum_should_match: 1
                }
            });
        }

        // // Filter by sender email
        // if (parameterObj.from) {
        //     mustConditions.push({ 
        //         term: { 
        //             'from.emailAddress.address.keyword': parameterObj.from 
        //         } 
        //     });
        // }

        // // Filter by recipient email (using nested query)
        // if (parameterObj.to) {
        //     mustConditions.push({
        //         nested: {
        //             path: 'toRecipients',
        //             query: {
        //                 term: {
        //                     'toRecipients.emailAddress.address.keyword': parameterObj.to
        //                 }
        //             }
        //         }
        //     });
        // }

        // Date range filter
        if (parameterObj.start || parameterObj.end) {
            const rangeQuery = { 
                createdTime: {} 
            };
            if (parameterObj.start) rangeQuery.createdTime.gte = parameterObj.start;
            if (parameterObj.end) rangeQuery.createdTime.lte = parameterObj.end;
            mustConditions.push({ range: rangeQuery });
        }

        // Archive filter
        if (parameterObj.archives) {
            const archivedArr = parameterObj.archives.split(',').filter(Boolean);
            if (archivedArr.length > 0) {
                mustConditions.push({
                    terms: {
                        archiveId: archivedArr
                    }
                });
            }
        }
        const response = await elasticClient.search({
            index: ELASTIC_INFO.DROPBOX_INDEX,
            from: pageNumber * pageSize, // Calculate the starting point
            size: pageSize, // Set the number of results to return
            body: {
                query: {
                    bool: {
                        must: mustConditions
                    }
                }
            }
        });

        // const messages = await Promise.all(response.hits.hits.map(async (msg) => {
        //     const downloadLog = await OutlookDownloadLog.findOne({ messageId: msg._source.id });
        //     msg._source.downloadLogs = downloadLog ? downloadLog.logs : [];
        //     return msg;
        // }));

        return {
            total: response.hits.total.value,
            results: response.hits.hits
        };
    } catch (error) {
        console.error('Error during search:', error);
        return {
            total: 0,
            results: []
        };
    }
};

exports.filesSearch = async (query, userId, pageNumber = 0, pageSize = 10) => {
    try {
        const response = await elasticClient.search({
            index: ELASTIC_INFO.FILES_INDEX,
            from: pageNumber * pageSize, // Calculate the starting point
            size: pageSize, // Set the number of results to return
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                bool: {
                                    should: [
                                        { term: { owner: userId } },
                                        { term: { collectedBy: userId } }
                                    ],
                                    minimum_should_match: 1
                                }
                            },
                            {
                                bool: {
                                    should: [
                                        { match: { fileName: query } },
                                        { match: { fileContent: query } }
                                    ],
                                    minimum_should_match: 1
                                }
                            }
                        ]
                    }
                }
            }
        });

        return {
            total: response.hits.total.value,
            results: response.hits.hits
        };
    } catch (error) {
        console.error('Error during search:', error);
        return {
            total: 0,
            results: []
        };
    }
};

exports.flaggedCollectionsSearch = async (query, userId, pageNumber = 0, pageSize = 10) => {
    console.log(userId, query)
    try {
        const response = await elasticClient.search({
            index: ELASTIC_INFO.FLAGGED_INDEX,
            from: pageNumber * pageSize,
            size: pageSize,
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                bool: {
                                    should: [
                                        { term: { owner: userId } },
                                        { term: { createdBy: userId } }
                                    ],
                                    minimum_should_match: 1
                                }
                            },
                            {
                                bool: {
                                    should: [
                                        // Search in top-level fields
                                        { match: { body: query } },
                                        
                                        // Outlook/email fields
                                        {
                                            nested: {
                                                path: 'data',
                                                query: {
                                                    bool: {
                                                        should: [
                                                            { match: { 'data.subject': query } },
                                                            { match: { 'data.preview': query } },
                                                            { match: { 'data.content': query } },
                                                            { match: { 'data.from': query } },
                                                            { match: { 'data.to': query } }
                                                        ]
                                                    }
                                                }
                                            }
                                        },
                                        
                                        // Gmail fields (excluding the nested headers to avoid errors)
                                        {
                                            nested: {
                                                path: 'data',
                                                query: {
                                                    bool: {
                                                        should: [
                                                            { match: { 'data.snippet': query } },
                                                            { exists: { field: 'data.payload' } }
                                                        ]
                                                    }
                                                }
                                            }
                                        },
                                        
                                        // Drive/OneDrive fields
                                        {
                                            nested: {
                                                path: 'data',
                                                query: {
                                                    bool: {
                                                        should: [
                                                            { match: { 'data.label': query } },
                                                            { match: { 'data.name': query } }
                                                        ]
                                                    }
                                                }
                                            }
                                        },
                                        
                                        // Slack fields
                                        {
                                            nested: {
                                                path: 'data',
                                                query: {
                                                    bool: {
                                                        should: [
                                                            { match: { 'data.message': query } },
                                                        ]
                                                    }
                                                }
                                            }
                                        }
                                    ],
                                    minimum_should_match: 1
                                }
                            }
                        ]
                    }
                }
            }
        });
        console.log(response)
        return {
            total: response.hits.total.value,
            results: response.hits.hits
        };
    } catch (error) {
        console.error('Error during search:', error);
        return {
            total: 0,
            results: []
        };
    }
};

