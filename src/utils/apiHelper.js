import axiosServices from "./axios";
import JSZip from "jszip";
import { saveAs } from "save-as";
import CryptoJS from 'crypto-js';
import { checkSlackImage, formatSizeUnits } from './utils'

const generateHash = (data) => CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);

const calculateSize = (data) => new Blob([data], { type: 'application/json' }).size;

const exportPublicChannelMessages = async (teamid, channels, startDate = '', endDate = '') => {
    const response = await axiosServices.post(`/slack/team/${teamid}/channels/public/export`, { startDate, endDate, channels });
    const data = response.data;
}

const getPublicChannelMessages = async (teamid, channelId, type = 'slack', startDate = '', endDate = '', backupId = '') => {
    if (type === 'slack') {
        const response = await axiosServices.get(`/slack/team/${teamid}/public-channel/${channelId}?startDate=${startDate}&endDate=${endDate}`);
        const data = response.data;

        return data.result;
    }
    if (type === 'archive') {
        const response = await axiosServices.get(`/archive/slack/${teamid}/public-channel/${channelId}/backup/${backupId}?startDate=${startDate}&endDate=${endDate}`);
        const data = response.data;

        return [data.result, data.nextCursor];
    }
    return [];
}

const getPublicChannelMessages2 = async ({ teamId, userId, channelId, type = 'slack', startDate = '', endDate = '', backupId = '', cursor = '' }) => {
    if (type === 'slack') {
        const response = await axiosServices.get(`/slack/team/${teamId}/users/${userId}/public-channel/${channelId}?cursor=${cursor}&startDate=${startDate}&endDate=${endDate}`);
        const data = response.data;

        return data.result;
    }
    if (type === 'archive') {
        const response = await axiosServices.get(`/archive/slack/${teamId}/public-channel/${channelId}/backup/${backupId}?cursor=${cursor}&startDate=${startDate}&endDate=${endDate}`);
        const data = response.data;

        return [data.result, data.nextCursor];
    }
    return [];
}

const getPrivateChannelMessages = async (teamid, channelId, type = 'slack', startDate = '', endDate = '', backupId = '') => {
    if (type === 'slack') {
        const response = await axiosServices.get(`/slack/team/${teamid}/private-channel/${channelId}?startDate=${startDate}&endDate=${endDate}`);
        const data = response.data;
        console.log("PrivateChannelData: ", data);

        return data.result;
    }
    if (type === 'archive') {
        const response = await axiosServices.get(`/archive/slack/${teamid}/private-channel/${channelId}/backup/${backupId}?startDate=${startDate}&endDate=${endDate}`);
        const data = response.data;
        console.log("Archive PrivateChannelData: ", data);

        return data.result;
    }
    return [];
}

const getPrivateChannelMessages2 = async ({ teamId, channelId, userId, type = 'slack', startDate = '', endDate = '', backupId = '', cursor = '' }) => {
    if (type === 'slack') {
        const response = await axiosServices.get(`/slack/team/${teamId}/users/${userId}/private-channel/${channelId}?cursor=${cursor}&startDate=${startDate}&endDate=${endDate}`);
        const data = response.data;
        console.log("PrivateChannelData: ", data);

        return data.result;
    }
    if (type === 'archive') {
        const response = await axiosServices.get(`/archive/slack/${teamId}/private-channel/${channelId}/backup/${backupId}?cursor=${cursor}&startDate=${startDate}&endDate=${endDate}`);
        const data = response.data;
        console.log("Archive PrivateChannelData: ", data);

        return [data.result, data.nextCursor];
    }
    return [];
}

const getGroupChannelMessages2 = async ({ teamId, channelId, userId, type = 'slack', startDate = '', endDate = '', backupId = '', cursor = '' }) => {
    if (type === 'slack') {
        const response = await axiosServices.get(`/slack/team/${teamId}/users/${userId}/group-channel/${channelId}?cursor=${cursor}&startDate=${startDate}&endDate=${endDate}`);
        const data = response.data;
        console.log("PrivateChannelData: ", data);

        return data.result;
    }
    if (type === 'archive') {
        const response = await axiosServices.get(`/archive/slack/${teamId}/group-channel/${channelId}/backup/${backupId}?cursor=${cursor}&startDate=${startDate}&endDate=${endDate}`);
        const data = response.data;
        console.log("Archive PrivateChannelData: ", data);

        return data.result;
    }
    return [];
}

const getExportAll = async (teamId, userId, type = 'slack', startDate = '', endDate = '', backupId = '') => {
    if (type === 'slack') {
        const response = await axiosServices.get(`/slack/team/${teamId}/export-all/${userId}?startDate=${startDate}&endDate=${endDate}`);
        const data = response.data;
        console.log("Export All: ", data);

        return data.data;
    }
    if (type === 'archive') {
        const response = await axiosServices.get(`/archive/slack/${teamId}/export-all/${userId}/backup/${backupId}?startDate=${startDate}&endDate=${endDate}`);
        const data = response.data;
        console.log("Export ALL from backup: ", data);

        return data.data;
    }
    return [];
}

const getConversationDetails = async (teamid, channelId, accessToken, cursor = '', type = 'slack', startDate = '', endDate = '', backupId = '') => {
    if (type === 'slack') {
        const response = await axiosServices.get(`/slack/team/${teamid}/direct-conversation-detail/${channelId}?accessToken=${accessToken}&cursor=${cursor}&startDate=${startDate}&endDate=${endDate}`);
        const data = response.data;
        console.log("DirectMessages: ", data);

        return data.result;
    }
    if (type === 'archive') {
        const response = await axiosServices.get(`/archive/slack/${teamid}/direct-conversation-detail/${channelId}/backup/${backupId}?accessToken=${accessToken}&cursor=${cursor}&startDate=${startDate}&endDate=${endDate}`);
        const data = response.data;
        console.log("Archive DirectMessages: ", data);

        return data.result;
    }
    return [];
}

const getConversationDetails2 = async (teamid, userId, channelId, cursor = '', type = 'slack', startDate = '', endDate = '', backupId = '') => {
    if (type === 'slack') {
        const response = await axiosServices.get(`/slack/team/${teamid}/users/${userId}/direct-conversation-detail/${channelId}?cursor=${cursor}&startDate=${startDate}&endDate=${endDate}`);
        const data = response.data;
        console.log("DirectMessages: ", data);

        return data.result;
    }
    if (type === 'archive') {
        const response = await axiosServices.get(`/archive/slack/${teamid}/users/${userId}/direct-conversation-detail/${channelId}/backup/${backupId}?cursor=${cursor}&startDate=${startDate}&endDate=${endDate}`);
        const data = response.data;
        console.log("Archive DirectMessages: ", data);

        return data.result;
    }
    return [];
}

const getConversationDetails3 = async ({ teamId, userId, channelId, cursor = '', type = 'slack', startDate = '', endDate = '', backupId = '' }) => {
    if (type === 'slack') {
        const response = await axiosServices.get(`/slack/team/${teamId}/users/${userId}/direct-conversation-detail/${channelId}?cursor=${cursor}&startDate=${startDate}&endDate=${endDate}`);
        const data = response.data;
        console.log("DirectMessages: ", data);

        return data.result;
    }
    if (type === 'archive') {
        const response = await axiosServices.get(`/archive/slack/${teamId}/direct-conversation-detail/${channelId}/backup/${backupId}?cursor=${cursor}&startDate=${startDate}&endDate=${endDate}`);
        const data = response.data;
        console.log("Archive DirectMessages: ", data);

        return [data.result, data.nextCursor];
    }
    return [];
}

const getDirectConversationList = async (teamId, userId, accessToken, type = 'slack', backupId = '') => {
    if (type === 'slack') {
        const response = await axiosServices.get(`/slack/team/${teamId}/direct-conversation-list/${userId}?accessToken=${accessToken}`);
        const data = response.data;
        console.log("DirectChannelData: ", data);

        return data.data;
    }
    if (type === 'archive') {
        const response = await axiosServices.get(`/archive/slack/${teamId}/direct-conversation-list/${userId}/backup/${backupId}?accessToken=${accessToken}`);
        const data = response.data;
        console.log("Archive DirectChannelData: ", data);

        return data.data;
    }
    return [];
}

const sendRequestEmail = async (teamId, to) => {
    const response = await axiosServices.post(`/slack/request-authenticate`, { teamId, to });
    const data = response.data;
    console.log("Export Data: ", data);
}

const exportToFolderZipMultiple = async (files) => {
    try {
        const zip = new JSZip();

        const promises = files.map(async (file) =>
            axiosServices.get(file.url, { responseType: 'arraybuffer' })
                .then(response => {
                    zip.file(file.folder, response.data, { binary: true });
                })
                .catch(error => {
                    console.error(`Error downloading ${file.url}: ${error}`);
                })
        );

        await Promise.all(promises);

        const content = await zip.generateAsync({
            type: "blob", compression: "DEFLATE",
            compressionOptions: {
                level: 9
            }
        });
        const date = new Date();
        saveAs(content, `export-${date.getTime()}.zip`);

        return { result: true, error: undefined };
    } catch (e) {
        console.log("Exporting Error, ", e);
        return { result: false, error: 'Error ouccurred while exporting!' };
    }
}

const generateHtml = (data, members, metaData) => {
    let title = "";
    if (metaData && metaData.isDirect) {
        title = `Conversations of ${metaData.title}`;
    }
    console.log("Export Data: ", data, members, metaData);
    let beforeUser = '';
    let isLeft = false;
    const hmtlMsgs = data.map((message) => {
        const member = members[message.started_by] || message.started_by;
        message.files = message.files || [];
        if (beforeUser !== member.user_id) {
            isLeft = !isLeft;
        }
        beforeUser = member.user_id;
        return isLeft ? `
        <li class="d-flex justify-content-between mb-2">
            <img src="${member.avatar}" alt="${member.user_id}"
              class="rounded-circle d-flex align-self-start me-3 shadow-1-strong" width="40">
            <div class="card w-100">
              <div class="card-header d-flex justify-content-between p-3">
                <p class="fw-bold mb-0">${member.display_name || member.real_name}</p>
                <p class="text-muted small mb-0"><i class="far fa-clock"></i> ${message.created}</p>
              </div>
              <div class="card-body p-2">
                <p class="mb-0">
                    ${message.messageObj.map(e => {
            if (e.type === 'text') {
                return e.text.replaceAll('\n', '<br />');
            }
            if (e.type === 'emoji') {
                return `<span className="slack-emoji"><img className="slack-emoji-img" src="https://a.slack-edge.com/production-standard-emoji-assets/14.0/google-medium/${e.unicode}.png" alt="${e.name}"/></span>`;
            }
            return '';
        })}
                    ${message.files ? (message.files.map(file => file.thumb ? `<img src="${file.thumb}" alt="${file.name}"/>` : `<a href="${file.url_private}">${file.name}</a>`
        )) : ''}
                </p>
              </div>
            </div>
          </li>
        ` : `
        <li class="d-flex justify-content-between mb-2">
            <div class="card w-100">
              <div class="card-header d-flex justify-content-between p-3">
                <p class="text-muted small mb-0"><i class="far fa-clock"></i> ${message.created}</p>
                <p class="fw-bold mb-0">${member.display_name || member.real_name}</p>
              </div>
              <div class="card-body p-2">
                <p class="mb-0">
                ${message.messageObj.map(e => {
            if (e.type === 'text') {
                return e.text.replaceAll('\n', '<br />');
            }
            if (e.type === 'emoji') {
                return `<span className="slack-emoji"><img className="slack-emoji-img" src="https://a.slack-edge.com/production-standard-emoji-assets/14.0/google-medium/${e.unicode}.png" alt="${e.name}"/></span>`;
            }
            return '';
        })}
                ${message.files ? (message.files.map(file => file.thumb ? `<img src="${file.thumb}" alt="${file.name}"/>` : `<a href="${file.url_private}">${file.name}</a>`
        )) : ''}
                </p>
              </div>
            </div>
            <img src="${member.avatar}" alt="${member.real_name}"
              class="rounded-circle d-flex align-self-start ms-3 shadow-1-strong" width="40">
          </li>
        `
    });

    const htmlDoc = `
    <!DOCTYPE html>
<html>
  <head>
    <title${title}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="https://mdbcdn.b-cdn.net/wp-content/themes/mdbootstrap4/docs-app/css/dist/mdb5/standard/core.min.css">
  </head>
  <body>
      <section style="background-color: #eee;">
  <div class="container py-5">

    <div class="row">
      <div class="col-md-10 col-lg-10 col-xl-10">

        <ul class="list-unstyled">
            ${hmtlMsgs.join('')}
        </ul>

      </div>

    </div>

  </div>
</section>
  </body>
</html>
    `;

    return htmlDoc;
}

const exportToZip = async (messages, members, filename, metaData) => {
    try {
        const data = generateHtml(messages, members, metaData);
        const zip = new JSZip();
        zip.file(filename, data, { binary: true });
        const hash = generateHash(data);
        const size = calculateSize(data);
        const datetime = new Date().toISOString();
        const metadata = {
            filename,
            hash,
            size,
            datetime
        };
        // Add meta information as "metadata.json" to zip
        zip.file('metadata.json', JSON.stringify(metadata, null, 2), { binary: true });

        const content = await zip.generateAsync({
            type: "blob", compression: "DEFLATE",
            compressionOptions: {
                level: 9
            }
        });
        // .then((content) => {
        const date = new Date();
        saveAs(content, `export-${date.getTime()}.zip`);

        return { result: true, error: undefined };
    } catch (e) {
        console.log("Exporting Error, ", e);
        return { result: false, error: 'Error ouccurred while exporting!' };
    }

    // });
}

const exportToZipMultiple = async (messages, members, filenames, zipname) => {
    try {
        const zip = new JSZip();
        const metadata = [];
        for (let i = 0; i < messages.length; i += 1) {
            const data = generateHtml(messages[i], members);
            // Add meta information
            const hash = generateHash(data);
            const size = calculateSize(data);
            const datetime = new Date().toISOString();
            metadata.push({
                filename: filenames[i],
                hash,
                size,
                datetime
            });

            zip.file(filenames[i], data, { binary: true });
        }
        // Add meta information as "metadata.json" to zip
        zip.file('metadata.json', JSON.stringify(metadata, null, 2), { binary: true });

        const content = await zip.generateAsync({
            type: "blob", compression: "DEFLATE",
            compressionOptions: {
                level: 9
            }
        });
        // .then((content) => {
        const date = new Date();
        saveAs(content, `${zipname || `export-${date.getTime()}`}.zip`);

        return { result: true, error: undefined };
    } catch (e) {
        console.log("Exporting Error, ", e);
        return { result: false, error: 'Error ouccurred while exporting!' };
    }
}

const exportToZipMultipleMail = async (messages, filenames, zipname) => {
    try {
        const zip = new JSZip();
        const metadata = [];
        for (let i = 0; i < messages.length; i += 1) {
            const data = messages[i];
            // Add meta information
            const hash = generateHash(data);
            const size = calculateSize(data);
            const datetime = new Date().toISOString();
            metadata.push({
                filename: filenames[i],
                hash,
                size,
                datetime
            });

            zip.file(filenames[i], data, { binary: true });
        }
        // Add meta information as "metadata.json" to zip
        zip.file('metadata.json', JSON.stringify(metadata, null, 2), { binary: true });

        const content = await zip.generateAsync({
            type: "blob", compression: "DEFLATE",
            compressionOptions: {
                level: 9
            }
        });
        // .then((content) => {
        const date = new Date();
        saveAs(content, `${zipname || `export-${date.getTime()}`}.zip`);

        return { result: true, error: undefined };
    } catch (e) {
        console.log("Exporting Error, ", e);
        return { result: false, error: 'Error ouccurred while exporting!' };
    }
}

const exportToPDF = async (messages, members, filename) => {
    try {
        console.log("exportToPDF", messages, members);
        const data = generateHtml(messages, members);

        const response = await axiosServices.post('/slack/generate-pdf', {
            html: data
        }, {
            responseType: 'blob'
        });

        const zip = new JSZip();
        zip.file(filename, response.data, { binary: true });
        const hash = generateHash(response.data);
        const size = calculateSize(response.data);
        const datetime = new Date().toISOString();
        const metadata = {
            filename,
            hash,
            size,
            datetime
        };
        // Add meta information as "metadata.json" to zip
        zip.file('metadata.json', JSON.stringify(metadata, null, 2), { binary: true });

        const content = await zip.generateAsync({
            type: "blob", compression: "DEFLATE",
            compressionOptions: {
                level: 9
            }
        });
        // .then((content) => {
        const date = new Date();
        saveAs(content, `export-${date.getTime()}.zip`);

        // const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        // const link = document.createElement('a');
        // link.href = url;
        // link.setAttribute('download', `${filename}.pdf`);
        // document.body.appendChild(link);
        // link.click();

        return { result: true, error: undefined };
    } catch (e) {
        console.log("Exporting Error, ", e);
        return { result: false, error: 'Error ouccurred while exporting!' };
    }

    // });
}

const exportToZipMultiplePDF = async (messages, members, filenames, zipname) => {
    try {
        const zip = new JSZip();
        const metadata = [];
        /* eslint-disable no-await-in-loop */
        for (let i = 0; i < messages.length; i += 1) {
            const data = generateHtml(messages[i], members);
            // const pdf = await html2pdf().set({ filename: 'message.pdf', html2canvas:  { scale: 2,useCORS: true }, image:        { type: 'jpeg', quality: 0.98 }, }).from(data).outputPdf();
            const response = await axiosServices.post('/slack/generate-pdf', {
                html: data
            }, {
                responseType: 'blob'
            });

            // Add meta information
            const hash = generateHash(response.data);
            const size = calculateSize(response.data);
            const datetime = new Date().toISOString();
            metadata.push({
                filename: filenames[i],
                hash,
                size,
                datetime
            });

            // const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            // You can convert it to a Blob if required
            // const blob = new Blob([pdf], { type: 'application/pdf' });
            zip.file(filenames[i], response.data, { binary: true });
        }
        // Add meta information as "metadata.json" to zip
        zip.file('metadata.json', JSON.stringify(metadata, null, 2), { binary: true });
        const content = await zip.generateAsync({
            type: "blob", compression: "DEFLATE",
            compressionOptions: {
                level: 9
            }
        });
        // .then((content) => {
        const date = new Date();
        saveAs(content, `${zipname || `export-${date.getTime()}`}.zip`);

        return { result: true, error: undefined };
    } catch (e) {
        return { result: false, error: 'Error ouccurred while exporting!' };
    }
}

const exportToZipMultipleMailPDF = async (messages, filenames, zipname) => {
    try {
        const zip = new JSZip();
        const metadata = [];
        /* eslint-disable no-await-in-loop */
        for (let i = 0; i < messages.length; i += 1) {
            const data = messages[i];
            // const pdf = await html2pdf().set({ filename: 'message.pdf', html2canvas:  { scale: 2,useCORS: true }, image:        { type: 'jpeg', quality: 0.98 }, }).from(data).outputPdf();
            const response = await axiosServices.post('/slack/generate-pdf', {
                html: data
            }, {
                responseType: 'blob'
            });

            // Add meta information
            const hash = generateHash(response.data);
            const size = calculateSize(response.data);
            const datetime = new Date().toISOString();
            metadata.push({
                filename: filenames[i],
                hash,
                size,
                datetime
            });

            // const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            // You can convert it to a Blob if required
            // const blob = new Blob([pdf], { type: 'application/pdf' });
            zip.file(filenames[i], response.data, { binary: true });
        }
        // Add meta information as "metadata.json" to zip
        zip.file('metadata.json', JSON.stringify(metadata, null, 2), { binary: true });
        const content = await zip.generateAsync({
            type: "blob", compression: "DEFLATE",
            compressionOptions: {
                level: 9
            }
        });
        // .then((content) => {
        const date = new Date();
        saveAs(content, `${zipname || `export-${date.getTime()}`}.zip`);

        return { result: true, error: undefined };
    } catch (e) {
        return { result: false, error: 'Error ouccurred while exporting!' };
    }
}

const exportToJSON = async (messages, members, filename) => {
    try {
        // const data = generateHtml(messages, members, metaData);
        const data = JSON.stringify(messages, null, 2);
        const zip = new JSZip();
        zip.file(filename, data, { binary: true });

        const hash = generateHash(data);
        const size = calculateSize(data);
        const datetime = new Date().toISOString();
        const metadata = {
            filename,
            hash,
            size,
            datetime
        };
        // Add meta information as "metadata.json" to zip
        zip.file('metadata.json', JSON.stringify(metadata, null, 2), { binary: true });

        const content = await zip.generateAsync({
            type: "blob", compression: "DEFLATE",
            compressionOptions: {
                level: 9
            }
        });
        const date = new Date();
        saveAs(content, `export-${date.getTime()}.zip`);

        return { result: true, error: undefined };
    } catch (e) {
        console.log("Exporting Error, ", e);
        return { result: false, error: 'Error ouccurred while exporting!' };
    }

    // });
}

const exportToZipMultipleJSON = async (messages, members, filenames) => {
    try {
        const zip = new JSZip();
        const metadata = [];

        for (let i = 0; i < messages.length; i += 1) {
            const data = JSON.stringify(messages[i], null, 2);

            // Add meta information
            const hash = generateHash(data);
            const size = calculateSize(data);
            const datetime = new Date().toISOString();
            metadata.push({
                filename: filenames[i],
                hash,
                size,
                datetime
            });

            // Add JSON file to zip
            zip.file(filenames[i], data, { binary: true });
        }

        // Add meta information as "metadata.json" to zip
        zip.file('metadata.json', JSON.stringify(metadata, null, 2), { binary: true });

        // Generate and save the zip file
        const content = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 } });
        const date = new Date();
        saveAs(content, `export-${date.getTime()}.zip`);

        return { result: true, error: undefined };
    } catch (e) {
        console.error(e); // It's useful to log errors for debugging purposes
        return { result: false, error: 'Error occurred while exporting!' };
    }
}

const exportToZipMultipleMailJSON = async (messages, filenames) => {
    try {
        const zip = new JSZip();
        const metadata = [];

        for (let i = 0; i < messages.length; i += 1) {
            const data = JSON.stringify(messages[i], null, 2);

            // Add meta information
            const hash = generateHash(data);
            const size = calculateSize(data);
            const datetime = new Date().toISOString();
            metadata.push({
                filename: filenames[i],
                hash,
                size,
                datetime
            });

            // Add JSON file to zip
            zip.file(filenames[i], data, { binary: true });
        }

        // Add meta information as "metadata.json" to zip
        zip.file('metadata.json', JSON.stringify(metadata, null, 2), { binary: true });

        // Generate and save the zip file
        const content = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 } });
        const date = new Date();
        saveAs(content, `export-${date.getTime()}.zip`);

        return { result: true, error: undefined };
    } catch (e) {
        console.error(e); // It's useful to log errors for debugging purposes
        return { result: false, error: 'Error occurred while exporting!' };
    }
}

const getArchive = async () => {
    const response = await axiosServices.get('/archives');
    const result = [];
    try {
        const data = response.data.data;
        const keys = Object.keys(data);
        let index = 0;
        keys.forEach(key => {
            data[key].forEach(item => {
                const obj = {};
                obj.index = index;
                obj.type = key;
                if (key === 'Slack') {
                    obj.name = item.name;
                    obj.status = true;
                    obj.members = item.members;
                    obj.archives = item.archives.map((archive) => {
                        archive.id = archive._id
                        return archive
                    });
                    obj.fileSize = 0;
                } else if (key === 'Outlook') {
                    obj.name = item.displayName;
                    obj.status = true;
                    obj.archives = item.archives;
                    obj.fileSize = 0;
                } else if (key === 'FlaggedCollections') {
                    obj.name = item.name;
                    obj.status = true;
                    obj.archives = item.archives;
                    obj.fileSize = 0;
                } else if (key === 'OneDrive') {
                    obj.name = item.displayName;
                    obj.status = true;
                    obj.archives = item.archives;
                    obj.fileSize = 0;
                } else if (key === 'Gmail') {
                    obj.name = item.displayName;
                    obj.status = true;
                    obj.archives = item.archives;
                    obj.fileSize = 0;
                } else if (key === 'Drive') {
                    obj.name = item.displayName;
                    obj.status = true;
                    obj.archives = item.archives;
                    obj.fileSize = 0;
                } else if (key === 'Dropbox') {
                    obj.name = item.displayName;
                    obj.status = true;
                    obj.archives = item.archives;
                    obj.fileSize = 0;
                }
                obj.id = item._id;
                obj.updated = item.updatedAt
                obj.archiveState = item.archiveState || {};
                let totalSize = 0;
                obj.archives.forEach(e => {
                    totalSize += e.size;
                });
                obj.chatContentSize = totalSize;
                obj.totalSize = formatSizeUnits(totalSize);
                if (obj.archives.length > 0)
                    result.push(obj);
                index += 1;
            })
        });
    } catch (error) {
        console.log(error);
    }

    return result;
}

const getArchiveCronTime = async () => {
    const result = await axiosServices.get('/getArchiveCronTime');
    return result;
}

const setArchiveCronTime = async (time) => {
    const msg = await axiosServices.post('/setArchiveCronTime', time);
    return msg;
}

const applyArchive = async (archiveList) => {
    const msg = await axiosServices.post('/archives', archiveList);
    return msg;
}

const slackArchiveMembers = async (teamId, members) => {
    const result = await axiosServices.post(`/archive/slack/team/${teamId}`, { members });
    return result.data;
}

const getArchiveLog = async () => {
    const result = await axiosServices.get('/archivesLog');
    return result;
}

const getSlackImage = async (files, teamId, token) => {
    const imageInfos = []
    files.forEach((file) => {
        if (file.thumb) {
            imageInfos.push({ filetype: file.filetype, url: file.url_private });
        }
    });
    const response = await axiosServices.post('/slack/images-base64', { imageInfos, teamId, token });
    console.log("Images: ", response.data.data);
    return response.data.data;
}

const getSlackImage2 = async (files, teamId, userId) => {
    const imageInfos = []
    files.forEach((file) => {
        if (file.thumb) {
            imageInfos.push({ filetype: file.filetype, url: file.url_private });
        }
    });
    const response = await axiosServices.post('/slack/images-base64', { imageInfos, teamId, userId });
    console.log("Images: ", response.data.data);
    return response.data.data;
}

// Get slack image from s3 bucket
const getSlackImage3 = async (files, archiveId) => {
    const imageInfos = []
    files.forEach((file) => {
        if (checkSlackImage(file)) {
            imageInfos.push({ filetype: file.filetype, s3Key: `Slack/${archiveId}/${file.id}/${file.name}` });
        }
    });
    const response = await axiosServices.post('/v1.1/slack/images-base64', { imageInfos });
    console.log("Images: ", response.data.data);
    return response.data.data;
}

const removeSlackWorkspace = async (teamId) => {
    const response = await axiosServices.delete(`/slack/remove-workspace/${teamId}`);
    return response.data.data;
}

const removeMS365Workspace = async (teamId) => {
    const response = await axiosServices.delete(`/ms365/remove-workspace/${teamId}`);
    return response.data.data;
}

const removeGoogleWorkspace = async (teamId) => {
    const response = await axiosServices.delete(`/google/remove-workspace/${teamId}`);
    return response.data.data;
}

const refreshTeams = async (teamId) => {
    const response = await axiosServices.get(`/slack/teams/${teamId}/refresh`);
    return response.data.data;
}

const downloadSlackFile = async (teamId, filename, downloadName) => {
    axiosServices.get(`/slack/download/${teamId}/${filename}`, { responseType: 'blob' }).then(response => {
        // Create a blob from the response data
        const blob = new Blob([response.data], { type: response.headers['content-type'] });

        // Create an object URL for the blob
        const url = URL.createObjectURL(blob);

        // Create a new anchor element and trigger a click to download
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadName; // You can dynamically set the filename if needed
        a.click();

        // Release the object URL to free up memory
        URL.revokeObjectURL(url);
    })
        .catch(error => {
            console.error('File download error:', error);
        });
}

const resendTwoFactorCode = async (email) => {
    const res = await axiosServices.post(`/auth/resend-code`, { email });
    return res;
}

const resendPhoneOtp = async (email) => await axiosServices.post(`/auth/resend-phone-code`, {email})

const verifyEmail = async (email, code) => {
    const res = await axiosServices.post(`/v2/auth/verify-email`, { email, code });
    return res;
}

const verify2FaCode = async (email, code) => {
    const res = await axiosServices.post(`/auth/validate-2fa-token`, { email, code });
    return res;
}

const verifyPhoneNumberCode = async (email, phoneOTP) => await axiosServices.post(`/auth/verifyPhoneOTP`, {email, phoneOTP})

const sendPhoneNumberVerificationCode = async (email, phoneNumber, countryCode) => await axiosServices.post(`/auth/sendPhoneOTP`, {email, phoneNumber, countryCode})

const updateSecurity = async (isEmail, isPhone, password) => await axiosServices.post('/auth/update-security', {isEmail, isPhone, password})
const generateSecret = async (email, password) => await axiosServices.post(`/auth/generate-secret`, {email, password})
const verifyTOTP = async (email, token) => await axiosServices.post(`/auth/verify-totp`, {email, token})
const verifyTOTP2 = async (email, token) => await axiosServices.post(`/auth/verify-totp2`, {email, token})
const removeAuthenticator = async (password) => await axiosServices.post(`/auth/remove-authenticator`, {password})
const sendOtpUpdate = async (phoneNumber, countryCode) => await axiosServices.post(`/auth/send-phone-otp-update`, {phoneNumber, countryCode})
const updatePhoneNumber = async (phoneOTP) => await axiosServices.post(`/auth/update-phone`, {phoneOTP})

const postLogoutAction = async () => {
    await axiosServices.post('/auth/logout');
}

const updateProfile = async (name, company, country, phone) => {
    const resp = await axiosServices.post(`/user/profile`, { name, company, country, phone });

    return resp.data;
}

const changePassword = async (oldPassword, newPassword) => {
    const resp = await axiosServices.post(`/user/change-password`, { oldPassword, newPassword });

    return resp.data;
}

const deactivateAccount = async () => {
    const resp = await axiosServices.post(`/user/deactivate`);

    return resp.data;
}

const getUserActions = async () => {
    const response = await axiosServices.get(`/user/actions`);
    return response.data;
}

const getSubscriptionPlanStatus = async () => {
    const response = await axiosServices.get(`/user/subscriptionPlanStatus`);
    return response.data;
}

const getBillingPlans = async () => {
    const response = await axiosServices.get(`/billing/plans`);
    return response.data;
}

const unsubscribe = async () => {
    const response = await axiosServices.post(`/billing/unsubscribe`);
    return response.data;
}

const searchAll = async (parameterObj, pageNumber, pageSize, selectedType) => {
    let parameterText = `q=${parameterObj.query}`;
    if (parameterObj.start) {
        parameterText += `&start=${parameterObj.start}`;
    }
    if (parameterObj.end) {
        parameterText += `&end=${parameterObj.end}`;
    }
    if (parameterObj.from) {
        parameterText += `&from=${parameterObj.from}`;
    }
    if (parameterObj.to) {
        parameterText += `&to=${parameterObj.to}`;
    }
    if (parameterObj.archives) {
        parameterText += `&archives=${parameterObj.archives}`;
    }
    const response = await axiosServices.get(`/archive/search?${parameterText}&pageNumber=${pageNumber}&pageSize=${pageSize}&selectedType=${selectedType}`);
    return response.data;
}

const deleteBackups = async (type, teamId, backupIds) => {
    const response = await axiosServices.post(`/archive/delete`, { type, teamId, backupIds });
    return response.data;
}

//  Call microsoft365 apis

const getMS365UsersApi = async (workspaceId) => {
    const response = await axiosServices.get(`/ms365/workspace/${workspaceId}/users`);
    return response.data;
}

const sendMS365RequestAuth = async (workspaceId, to) => {
    const response = await axiosServices.post(`/ms365/request-authentication`, { workspaceId, to });
    const data = response.data;
    console.log("Export Data: ", data);
}

const archiveMSOutlook = async (workspaceId, filters) => {
    const response = await axiosServices.post(`/archive/outlook`, { workspaceId, filters });
    const data = response.data;
    console.log("outlook result: ", data);
}

const getOutlookArchive = async (archiveId, param) => {
    const response = await axiosServices.get(`/archive/outlook/${archiveId}?page=${param.page}&limit=${param.limit}`);
    return response.data;
}

const archiveMSOneDrive = async (workspaceId, filters) => {
    const response = await axiosServices.post(`/archive/onedrive`, { workspaceId, filters });
    const data = response.data;
    console.log("outlook result: ", data);
}

const getOneDriveArchive = async (archiveId) => {
    const response = await axiosServices.get(`/archive/onedrive/${archiveId}`);
    return response.data?.data;
}

const downloadArchiveOnedrive = async (archiveId, s3Key, filename, onProgress) => {
    try {
        const response = await axiosServices.post(`/archive/${archiveId}/onedrive/download`, { s3Key }, {
            responseType: 'blob',
            onDownloadProgress: (progressEvent) => {
                if (onProgress) {
                    onProgress(progressEvent)
                }
            }
        });

        const blob = new Blob([response.data], { type: response.headers['content-type'] });

        const link = document.createElement('a');

        link.href = window.URL.createObjectURL(blob);
        link.download = filename;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);
    } catch (error) {
        console.error('Error downloading file:', error);
    }
};

const downloadArchiveGmailAttachment = async (archiveId, s3Key, filename, onProgress) => {
    try {
        const response = await axiosServices.post(`/archive/${archiveId}/gmail/download`, { s3Key }, {
            responseType: 'blob',
            onDownloadProgress: (progressEvent) => {
                if (onProgress) {
                    onProgress(progressEvent)
                }
            }
        });

        const blob = new Blob([response.data], { type: response.headers['content-type'] });

        const link = document.createElement('a');

        link.href = window.URL.createObjectURL(blob);
        link.download = filename;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);
    } catch (error) {
        console.error('Error downloading file:', error);
    }
};

const downloadArchiveOutlookAttachment = async (archiveId, s3Key, filename, onProgress) => {
    try {
        const response = await axiosServices.post(`/archive/${archiveId}/outlook/download`, { s3Key }, {
            responseType: 'blob',
            onDownloadProgress: (progressEvent) => {
                if (onProgress) {
                    onProgress(progressEvent)
                }
            }
        });

        const blob = new Blob([response.data], { type: response.headers['content-type'] });

        const link = document.createElement('a');

        link.href = window.URL.createObjectURL(blob);
        link.download = filename;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);
    } catch (error) {
        console.error('Error downloading file:', error);
    }
};


const archiveMSJob = async (workspaceId, filters, totalCount) => {
    const response = await axiosServices.post(`/archive/msArchive`, { workspaceId, filters, totalCount });
    const data = response.data;
}

const getOutlookContent = async (archiveId, messageId) => {
    const response = await axiosServices.get(`/archive/outlook/${archiveId}/body/${messageId}`);
    const data = response.data;
    return data.data;
}

const getGmailContent = async (archiveId, messageId) => {
    const response = await axiosServices.get(`/archive/gmail/${archiveId}/messages/${messageId}`);
    const data = response.data;
    return data.data;
}

const getArchiveOutlookDownload = async (archiveId, messageId, filename) => {
    try {
        const response = await axiosServices.get(`/archive/outlook/${archiveId}/download/${messageId}`, {
            responseType: 'blob' // This ensures the response is handled as a Blob
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error downloading the file:', error);
    }
};

const getArchiveOutlookBulkDownload = async (archiveId, messageIds, filename) => {
    try {
        const response = await axiosServices.post(`/archive/outlook/${archiveId}/bulkDownload`, { messageIds }, {
            responseType: 'blob' // This ensures the response is handled as a Blob
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error downloading the file:', error);
    }
};

const downloadArchiveGmail = async (archiveId, messageId, filename) => {
    const response = await axiosServices.get(`/archive/gmail/${archiveId}/messages/${messageId}`);
    return response
};

const bulkDownloadArchiveGmail = async (archiveId, messageIds, filename) => {
    try {
        const response = await axiosServices.post(`/archive/outlook/${archiveId}/bulkDownload`, { messageIds }, {
            responseType: 'blob' // This ensures the response is handled as a Blob
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error downloading the file:', error);
    }
};

const getArchiveOutlookSearchBulkDownload = async (messages, filename) => {
    try {
        const response = await axiosServices.post(`/archive/outlook/search-result/bulk-download`, { messages }, {
            responseType: 'blob' // This ensures the response is handled as a Blob
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error downloading the file:', error);
    }
};

const bulkDownloadGmailFromSearch = async (messages, filename) => {
    try {
        const response = await axiosServices.post(`/archive/gmail/search-result/bulk-download`, { messages }, {
            responseType: 'blob' // This ensures the response is handled as a Blob
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error downloading the file:', error);
    }
};

//  Call Google apis

const getGoogleUsersApi = async (workspaceId) => {
    const response = await axiosServices.get(`/google/workspace/${workspaceId}/users`);
    return response.data;
}

const archiveGoogleJob = async (workspaceId, filters, totalCount) => {
    const response = await axiosServices.post(`/archive/googleArchive`, { workspaceId, filters, totalCount });
    const data = response.data;
    console.log("archiveGoogleJob result: ", data);
}

const archiveDropboxJob = async (workspaceId, filters, totalCount) => {
    const response = await axiosServices.post(`/archive/dropboxArchive`, { workspaceId, filters, totalCount });
    const data = response.data;
    console.log("archiveDropboxJob result: ", data);
}

const archiveSlackJob = async (workspaceId, filters, data) => {
    await axiosServices.post(`/archive/slackArchive`, { workspaceId, filters, totalCount: data.totalItems, totalSize: (data.fileSize + data.estimateMsgSize) });
}

const getGmailArchive = async (archiveId, param) => {
    const response = await axiosServices.get(`/archive/gmail/${archiveId}?page=${param.page}&limit=${param.limit}`);
    return response.data;
}

const getDriveArchive = async (archiveId) => {
    const response = await axiosServices.get(`/archive/drive/${archiveId}`);
    return response.data?.data;
}

const getS3PreSignedImageUrl = async (s3Key, mimetype) => {
    const response = await axiosServices.post(`/archive/s3-signed-url`, {s3Key, mimetype})
    return response.data?.fileUrl
}

const getS3Image = async (s3Key, filetype) => {
    const response = await axiosServices.post(`/archive/s3-image`, {s3Key, filetype})
    return response.data?.data
}

const addDownloadGmailLog = async (gmailId) => {
    const response = await axiosServices.post(`/archive/gmail/addDownloadLog`, {id: gmailId});
    return response.data;
}

const getStoredCollectionMap = async (type) => {
    const response = await axiosServices.get(`/flagged-collections/storedCollectionsMap/${type}`)

    return response.data?.data || {}
}


const emojis = {
    "100": "1f4af",
    "1234": "1f522",
    "grinning": "1f600",
    "smiley": "1f603",
    "smile": "1f604",
    "grin": "1f601",
    "laughing": "1f606",
    "sweat_smile": "1f605",
    "rolling_on_the_floor_laughing": "1f923",
    "joy": "1f602",
    "slightly_smiling_face": "1f642",
    "upside_down_face": "1f643",
    "melting_face": "1fae0",
    "wink": "1f609",
    "blush": "1f60a",
    "innocent": "1f607",
    "smiling_face_with_3_hearts": "1f970",
    "heart_eyes": "1f60d",
    "star-struck": "1f929",
    "kissing_heart": "1f618",
    "kissing": "1f617",
    "relaxed": "263a-fe0f",
    "kissing_closed_eyes": "1f61a",
    "kissing_smiling_eyes": "1f619",
    "smiling_face_with_tear": "1f972",
    "yum": "1f60b",
    "stuck_out_tongue": "1f61b",
    "stuck_out_tongue_winking_eye": "1f61c",
    "zany_face": "1f92a",
    "stuck_out_tongue_closed_eyes": "1f61d",
    "money_mouth_face": "1f911",
    "hugging_face": "1f917",
    "face_with_hand_over_mouth": "1f92d",
    "face_with_open_eyes_and_hand_over_mouth": "1fae2",
    "face_with_peeking_eye": "1fae3",
    "shushing_face": "1f92b",
    "thinking_face": "1f914",
    "saluting_face": "1fae1",
    "zipper_mouth_face": "1f910",
    "face_with_raised_eyebrow": "1f928",
    "neutral_face": "1f610",
    "expressionless": "1f611",
    "no_mouth": "1f636",
    "dotted_line_face": "1fae5",
    "face_in_clouds": "1f636-200d-1f32b-fe0f",
    "smirk": "1f60f",
    "unamused": "1f612",
    "face_with_rolling_eyes": "1f644",
    "grimacing": "1f62c",
    "face_exhaling": "1f62e-200d-1f4a8",
    "lying_face": "1f925",
    "relieved": "1f60c",
    "pensive": "1f614",
    "sleepy": "1f62a",
    "drooling_face": "1f924",
    "sleeping": "1f634",
    "mask": "1f637",
    "face_with_thermometer": "1f912",
    "face_with_head_bandage": "1f915",
    "nauseated_face": "1f922",
    "face_vomiting": "1f92e",
    "sneezing_face": "1f927",
    "hot_face": "1f975",
    "cold_face": "1f976",
    "woozy_face": "1f974",
    "dizzy_face": "1f635",
    "face_with_spiral_eyes": "1f635-200d-1f4ab",
    "exploding_head": "1f92f",
    "face_with_cowboy_hat": "1f920",
    "partying_face": "1f973",
    "disguised_face": "1f978",
    "sunglasses": "1f60e",
    "nerd_face": "1f913",
    "face_with_monocle": "1f9d0",
    "confused": "1f615",
    "face_with_diagonal_mouth": "1fae4",
    "worried": "1f61f",
    "slightly_frowning_face": "1f641",
    "white_frowning_face": "2639-fe0f",
    "open_mouth": "1f62e",
    "hushed": "1f62f",
    "astonished": "1f632",
    "flushed": "1f633",
    "pleading_face": "1f97a",
    "face_holding_back_tears": "1f979",
    "frowning": "1f626",
    "anguished": "1f627",
    "fearful": "1f628",
    "cold_sweat": "1f630",
    "disappointed_relieved": "1f625",
    "cry": "1f622",
    "sob": "1f62d",
    "scream": "1f631",
    "confounded": "1f616",
    "persevere": "1f623",
    "disappointed": "1f61e",
    "sweat": "1f613",
    "weary": "1f629",
    "tired_face": "1f62b",
    "yawning_face": "1f971",
    "triumph": "1f624",
    "rage": "1f621",
    "angry": "1f620",
    "face_with_symbols_on_mouth": "1f92c",
    "smiling_imp": "1f608",
    "imp": "1f47f",
    "skull": "1f480",
    "skull_and_crossbones": "2620-fe0f",
    "hankey": "1f4a9",
    "clown_face": "1f921",
    "japanese_ogre": "1f479",
    "japanese_goblin": "1f47a",
    "ghost": "1f47b",
    "alien": "1f47d",
    "space_invader": "1f47e",
    "robot_face": "1f916",
    "smiley_cat": "1f63a",
    "smile_cat": "1f638",
    "joy_cat": "1f639",
    "heart_eyes_cat": "1f63b",
    "smirk_cat": "1f63c",
    "kissing_cat": "1f63d",
    "scream_cat": "1f640",
    "crying_cat_face": "1f63f",
    "pouting_cat": "1f63e",
    "see_no_evil": "1f648",
    "hear_no_evil": "1f649",
    "speak_no_evil": "1f64a",
    "kiss": "1f48b",
    "love_letter": "1f48c",
    "cupid": "1f498",
    "gift_heart": "1f49d",
    "sparkling_heart": "1f496",
    "heartpulse": "1f497",
    "heartbeat": "1f493",
    "revolving_hearts": "1f49e",
    "two_hearts": "1f495",
    "heart_decoration": "1f49f",
    "heavy_heart_exclamation_mark_ornament": "2763-fe0f",
    "broken_heart": "1f494",
    "heart_on_fire": "2764-fe0f-200d-1f525",
    "mending_heart": "2764-fe0f-200d-1fa79",
    "heart": "2764-fe0f",
    "orange_heart": "1f9e1",
    "yellow_heart": "1f49b",
    "green_heart": "1f49a",
    "blue_heart": "1f499",
    "purple_heart": "1f49c",
    "brown_heart": "1f90e",
    "black_heart": "1f5a4",
    "white_heart": "1f90d",
    "anger": "1f4a2",
    "boom": "1f4a5",
    "dizzy": "1f4ab",
    "sweat_drops": "1f4a6",
    "dash": "1f4a8",
    "hole": "1f573-fe0f",
    "bomb": "1f4a3",
    "speech_balloon": "1f4ac",
    "eye-in-speech-bubble": "1f441-fe0f-200d-1f5e8-fe0f",
    "left_speech_bubble": "1f5e8-fe0f",
    "right_anger_bubble": "1f5ef-fe0f",
    "thought_balloon": "1f4ad",
    "zzz": "1f4a4",
    "wave": "1f44b",
    "raised_back_of_hand": "1f91a",
    "raised_hand_with_fingers_splayed": "1f590-fe0f",
    "hand": "270b",
    "spock-hand": "1f596",
    "rightwards_hand": "1faf1",
    "leftwards_hand": "1faf2",
    "palm_down_hand": "1faf3",
    "palm_up_hand": "1faf4",
    "ok_hand": "1f44c",
    "pinched_fingers": "1f90c",
    "pinching_hand": "1f90f",
    "v": "270c-fe0f",
    "crossed_fingers": "1f91e",
    "hand_with_index_finger_and_thumb_crossed": "1faf0",
    "i_love_you_hand_sign": "1f91f",
    "the_horns": "1f918",
    "call_me_hand": "1f919",
    "point_left": "1f448",
    "point_right": "1f449",
    "point_up_2": "1f446",
    "middle_finger": "1f595",
    "point_down": "1f447",
    "point_up": "261d-fe0f",
    "index_pointing_at_the_viewer": "1faf5",
    "+1": "1f44d",
    "-1": "1f44e",
    "fist": "270a",
    "facepunch": "1f44a",
    "left-facing_fist": "1f91b",
    "right-facing_fist": "1f91c",
    "clap": "1f44f",
    "raised_hands": "1f64c",
    "heart_hands": "1faf6",
    "open_hands": "1f450",
    "palms_up_together": "1f932",
    "handshake": "1f91d",
    "pray": "1f64f",
    "writing_hand": "270d-fe0f",
    "nail_care": "1f485",
    "selfie": "1f933",
    "muscle": "1f4aa",
    "mechanical_arm": "1f9be",
    "mechanical_leg": "1f9bf",
    "leg": "1f9b5",
    "foot": "1f9b6",
    "ear": "1f442",
    "ear_with_hearing_aid": "1f9bb",
    "nose": "1f443",
    "brain": "1f9e0",
    "anatomical_heart": "1fac0",
    "lungs": "1fac1",
    "tooth": "1f9b7",
    "bone": "1f9b4",
    "eyes": "1f440",
    "eye": "1f441-fe0f",
    "tongue": "1f445",
    "lips": "1f444",
    "biting_lip": "1fae6",
    "baby": "1f476",
    "child": "1f9d2",
    "boy": "1f466",
    "girl": "1f467",
    "adult": "1f9d1",
    "person_with_blond_hair": "1f471",
    "man": "1f468",
    "bearded_person": "1f9d4",
    "man_with_beard": "1f9d4-200d-2642-fe0f",
    "woman_with_beard": "1f9d4-200d-2640-fe0f",
    "red_haired_man": "1f468-200d-1f9b0",
    "curly_haired_man": "1f468-200d-1f9b1",
    "white_haired_man": "1f468-200d-1f9b3",
    "bald_man": "1f468-200d-1f9b2",
    "woman": "1f469",
    "red_haired_woman": "1f469-200d-1f9b0",
    "red_haired_person": "1f9d1-200d-1f9b0",
    "curly_haired_woman": "1f469-200d-1f9b1",
    "curly_haired_person": "1f9d1-200d-1f9b1",
    "white_haired_woman": "1f469-200d-1f9b3",
    "white_haired_person": "1f9d1-200d-1f9b3",
    "bald_woman": "1f469-200d-1f9b2",
    "bald_person": "1f9d1-200d-1f9b2",
    "blond-haired-woman": "1f471-200d-2640-fe0f",
    "blond-haired-man": "1f471-200d-2642-fe0f",
    "older_adult": "1f9d3",
    "older_man": "1f474",
    "older_woman": "1f475",
    "person_frowning": "1f64d",
    "man-frowning": "1f64d-200d-2642-fe0f",
    "woman-frowning": "1f64d-200d-2640-fe0f",
    "person_with_pouting_face": "1f64e",
    "man-pouting": "1f64e-200d-2642-fe0f",
    "woman-pouting": "1f64e-200d-2640-fe0f",
    "no_good": "1f645",
    "man-gesturing-no": "1f645-200d-2642-fe0f",
    "woman-gesturing-no": "1f645-200d-2640-fe0f",
    "ok_woman": "1f646",
    "man-gesturing-ok": "1f646-200d-2642-fe0f",
    "woman-gesturing-ok": "1f646-200d-2640-fe0f",
    "information_desk_person": "1f481",
    "man-tipping-hand": "1f481-200d-2642-fe0f",
    "woman-tipping-hand": "1f481-200d-2640-fe0f",
    "raising_hand": "1f64b",
    "man-raising-hand": "1f64b-200d-2642-fe0f",
    "woman-raising-hand": "1f64b-200d-2640-fe0f",
    "deaf_person": "1f9cf",
    "deaf_man": "1f9cf-200d-2642-fe0f",
    "deaf_woman": "1f9cf-200d-2640-fe0f",
    "bow": "1f647",
    "man-bowing": "1f647-200d-2642-fe0f",
    "woman-bowing": "1f647-200d-2640-fe0f",
    "face_palm": "1f926",
    "man-facepalming": "1f926-200d-2642-fe0f",
    "woman-facepalming": "1f926-200d-2640-fe0f",
    "shrug": "1f937",
    "man-shrugging": "1f937-200d-2642-fe0f",
    "woman-shrugging": "1f937-200d-2640-fe0f",
    "health_worker": "1f9d1-200d-2695-fe0f",
    "male-doctor": "1f468-200d-2695-fe0f",
    "female-doctor": "1f469-200d-2695-fe0f",
    "student": "1f9d1-200d-1f393",
    "male-student": "1f468-200d-1f393",
    "female-student": "1f469-200d-1f393",
    "teacher": "1f9d1-200d-1f3eb",
    "male-teacher": "1f468-200d-1f3eb",
    "female-teacher": "1f469-200d-1f3eb",
    "judge": "1f9d1-200d-2696-fe0f",
    "male-judge": "1f468-200d-2696-fe0f",
    "female-judge": "1f469-200d-2696-fe0f",
    "farmer": "1f9d1-200d-1f33e",
    "male-farmer": "1f468-200d-1f33e",
    "female-farmer": "1f469-200d-1f33e",
    "cook": "1f9d1-200d-1f373",
    "male-cook": "1f468-200d-1f373",
    "female-cook": "1f469-200d-1f373",
    "mechanic": "1f9d1-200d-1f527",
    "male-mechanic": "1f468-200d-1f527",
    "female-mechanic": "1f469-200d-1f527",
    "factory_worker": "1f9d1-200d-1f3ed",
    "male-factory-worker": "1f468-200d-1f3ed",
    "female-factory-worker": "1f469-200d-1f3ed",
    "office_worker": "1f9d1-200d-1f4bc",
    "male-office-worker": "1f468-200d-1f4bc",
    "female-office-worker": "1f469-200d-1f4bc",
    "scientist": "1f9d1-200d-1f52c",
    "male-scientist": "1f468-200d-1f52c",
    "female-scientist": "1f469-200d-1f52c",
    "technologist": "1f9d1-200d-1f4bb",
    "male-technologist": "1f468-200d-1f4bb",
    "female-technologist": "1f469-200d-1f4bb",
    "singer": "1f9d1-200d-1f3a4",
    "male-singer": "1f468-200d-1f3a4",
    "female-singer": "1f469-200d-1f3a4",
    "artist": "1f9d1-200d-1f3a8",
    "male-artist": "1f468-200d-1f3a8",
    "female-artist": "1f469-200d-1f3a8",
    "pilot": "1f9d1-200d-2708-fe0f",
    "male-pilot": "1f468-200d-2708-fe0f",
    "female-pilot": "1f469-200d-2708-fe0f",
    "astronaut": "1f9d1-200d-1f680",
    "male-astronaut": "1f468-200d-1f680",
    "female-astronaut": "1f469-200d-1f680",
    "firefighter": "1f9d1-200d-1f692",
    "male-firefighter": "1f468-200d-1f692",
    "female-firefighter": "1f469-200d-1f692",
    "cop": "1f46e",
    "male-police-officer": "1f46e-200d-2642-fe0f",
    "female-police-officer": "1f46e-200d-2640-fe0f",
    "sleuth_or_spy": "1f575-fe0f",
    "male-detective": "1f575-fe0f-200d-2642-fe0f",
    "female-detective": "1f575-fe0f-200d-2640-fe0f",
    "guardsman": "1f482",
    "male-guard": "1f482-200d-2642-fe0f",
    "female-guard": "1f482-200d-2640-fe0f",
    "ninja": "1f977",
    "construction_worker": "1f477",
    "male-construction-worker": "1f477-200d-2642-fe0f",
    "female-construction-worker": "1f477-200d-2640-fe0f",
    "person_with_crown": "1fac5",
    "prince": "1f934",
    "princess": "1f478",
    "man_with_turban": "1f473",
    "man-wearing-turban": "1f473-200d-2642-fe0f",
    "woman-wearing-turban": "1f473-200d-2640-fe0f",
    "man_with_gua_pi_mao": "1f472",
    "person_with_headscarf": "1f9d5",
    "person_in_tuxedo": "1f935",
    "man_in_tuxedo": "1f935-200d-2642-fe0f",
    "woman_in_tuxedo": "1f935-200d-2640-fe0f",
    "bride_with_veil": "1f470",
    "man_with_veil": "1f470-200d-2642-fe0f",
    "woman_with_veil": "1f470-200d-2640-fe0f",
    "pregnant_woman": "1f930",
    "pregnant_man": "1fac3",
    "pregnant_person": "1fac4",
    "breast-feeding": "1f931",
    "woman_feeding_baby": "1f469-200d-1f37c",
    "man_feeding_baby": "1f468-200d-1f37c",
    "person_feeding_baby": "1f9d1-200d-1f37c",
    "angel": "1f47c",
    "santa": "1f385",
    "mrs_claus": "1f936",
    "mx_claus": "1f9d1-200d-1f384",
    "superhero": "1f9b8",
    "male_superhero": "1f9b8-200d-2642-fe0f",
    "female_superhero": "1f9b8-200d-2640-fe0f",
    "supervillain": "1f9b9",
    "male_supervillain": "1f9b9-200d-2642-fe0f",
    "female_supervillain": "1f9b9-200d-2640-fe0f",
    "mage": "1f9d9",
    "male_mage": "1f9d9-200d-2642-fe0f",
    "female_mage": "1f9d9-200d-2640-fe0f",
    "fairy": "1f9da",
    "male_fairy": "1f9da-200d-2642-fe0f",
    "female_fairy": "1f9da-200d-2640-fe0f",
    "vampire": "1f9db",
    "male_vampire": "1f9db-200d-2642-fe0f",
    "female_vampire": "1f9db-200d-2640-fe0f",
    "merperson": "1f9dc",
    "merman": "1f9dc-200d-2642-fe0f",
    "mermaid": "1f9dc-200d-2640-fe0f",
    "elf": "1f9dd",
    "male_elf": "1f9dd-200d-2642-fe0f",
    "female_elf": "1f9dd-200d-2640-fe0f",
    "genie": "1f9de",
    "male_genie": "1f9de-200d-2642-fe0f",
    "female_genie": "1f9de-200d-2640-fe0f",
    "zombie": "1f9df",
    "male_zombie": "1f9df-200d-2642-fe0f",
    "female_zombie": "1f9df-200d-2640-fe0f",
    "troll": "1f9cc",
    "massage": "1f486",
    "man-getting-massage": "1f486-200d-2642-fe0f",
    "woman-getting-massage": "1f486-200d-2640-fe0f",
    "haircut": "1f487",
    "man-getting-haircut": "1f487-200d-2642-fe0f",
    "woman-getting-haircut": "1f487-200d-2640-fe0f",
    "walking": "1f6b6",
    "man-walking": "1f6b6-200d-2642-fe0f",
    "woman-walking": "1f6b6-200d-2640-fe0f",
    "standing_person": "1f9cd",
    "man_standing": "1f9cd-200d-2642-fe0f",
    "woman_standing": "1f9cd-200d-2640-fe0f",
    "kneeling_person": "1f9ce",
    "man_kneeling": "1f9ce-200d-2642-fe0f",
    "woman_kneeling": "1f9ce-200d-2640-fe0f",
    "person_with_probing_cane": "1f9d1-200d-1f9af",
    "man_with_probing_cane": "1f468-200d-1f9af",
    "woman_with_probing_cane": "1f469-200d-1f9af",
    "person_in_motorized_wheelchair": "1f9d1-200d-1f9bc",
    "man_in_motorized_wheelchair": "1f468-200d-1f9bc",
    "woman_in_motorized_wheelchair": "1f469-200d-1f9bc",
    "person_in_manual_wheelchair": "1f9d1-200d-1f9bd",
    "man_in_manual_wheelchair": "1f468-200d-1f9bd",
    "woman_in_manual_wheelchair": "1f469-200d-1f9bd",
    "runner": "1f3c3",
    "man-running": "1f3c3-200d-2642-fe0f",
    "woman-running": "1f3c3-200d-2640-fe0f",
    "dancer": "1f483",
    "man_dancing": "1f57a",
    "man_in_business_suit_levitating": "1f574-fe0f",
    "dancers": "1f46f",
    "men-with-bunny-ears-partying": "1f46f-200d-2642-fe0f",
    "women-with-bunny-ears-partying": "1f46f-200d-2640-fe0f",
    "person_in_steamy_room": "1f9d6",
    "man_in_steamy_room": "1f9d6-200d-2642-fe0f",
    "woman_in_steamy_room": "1f9d6-200d-2640-fe0f",
    "person_climbing": "1f9d7",
    "man_climbing": "1f9d7-200d-2642-fe0f",
    "woman_climbing": "1f9d7-200d-2640-fe0f",
    "fencer": "1f93a",
    "horse_racing": "1f3c7",
    "skier": "26f7-fe0f",
    "snowboarder": "1f3c2",
    "golfer": "1f3cc-fe0f",
    "man-golfing": "1f3cc-fe0f-200d-2642-fe0f",
    "woman-golfing": "1f3cc-fe0f-200d-2640-fe0f",
    "surfer": "1f3c4",
    "man-surfing": "1f3c4-200d-2642-fe0f",
    "woman-surfing": "1f3c4-200d-2640-fe0f",
    "rowboat": "1f6a3",
    "man-rowing-boat": "1f6a3-200d-2642-fe0f",
    "woman-rowing-boat": "1f6a3-200d-2640-fe0f",
    "swimmer": "1f3ca",
    "man-swimming": "1f3ca-200d-2642-fe0f",
    "woman-swimming": "1f3ca-200d-2640-fe0f",
    "person_with_ball": "26f9-fe0f",
    "man-bouncing-ball": "26f9-fe0f-200d-2642-fe0f",
    "woman-bouncing-ball": "26f9-fe0f-200d-2640-fe0f",
    "weight_lifter": "1f3cb-fe0f",
    "man-lifting-weights": "1f3cb-fe0f-200d-2642-fe0f",
    "woman-lifting-weights": "1f3cb-fe0f-200d-2640-fe0f",
    "bicyclist": "1f6b4",
    "man-biking": "1f6b4-200d-2642-fe0f",
    "woman-biking": "1f6b4-200d-2640-fe0f",
    "mountain_bicyclist": "1f6b5",
    "man-mountain-biking": "1f6b5-200d-2642-fe0f",
    "woman-mountain-biking": "1f6b5-200d-2640-fe0f",
    "person_doing_cartwheel": "1f938",
    "man-cartwheeling": "1f938-200d-2642-fe0f",
    "woman-cartwheeling": "1f938-200d-2640-fe0f",
    "wrestlers": "1f93c",
    "man-wrestling": "1f93c-200d-2642-fe0f",
    "woman-wrestling": "1f93c-200d-2640-fe0f",
    "water_polo": "1f93d",
    "man-playing-water-polo": "1f93d-200d-2642-fe0f",
    "woman-playing-water-polo": "1f93d-200d-2640-fe0f",
    "handball": "1f93e",
    "man-playing-handball": "1f93e-200d-2642-fe0f",
    "woman-playing-handball": "1f93e-200d-2640-fe0f",
    "juggling": "1f939",
    "man-juggling": "1f939-200d-2642-fe0f",
    "woman-juggling": "1f939-200d-2640-fe0f",
    "person_in_lotus_position": "1f9d8",
    "man_in_lotus_position": "1f9d8-200d-2642-fe0f",
    "woman_in_lotus_position": "1f9d8-200d-2640-fe0f",
    "bath": "1f6c0",
    "sleeping_accommodation": "1f6cc",
    "people_holding_hands": "1f9d1-200d-1f91d-200d-1f9d1",
    "two_women_holding_hands": "1f46d",
    "man_and_woman_holding_hands": "1f46b",
    "two_men_holding_hands": "1f46c",
    "couplekiss": "1f48f",
    "woman-kiss-man": "1f469-200d-2764-fe0f-200d-1f48b-200d-1f468",
    "man-kiss-man": "1f468-200d-2764-fe0f-200d-1f48b-200d-1f468",
    "woman-kiss-woman": "1f469-200d-2764-fe0f-200d-1f48b-200d-1f469",
    "couple_with_heart": "1f491",
    "woman-heart-man": "1f469-200d-2764-fe0f-200d-1f468",
    "man-heart-man": "1f468-200d-2764-fe0f-200d-1f468",
    "woman-heart-woman": "1f469-200d-2764-fe0f-200d-1f469",
    "family": "1f46a",
    "man-woman-boy": "1f468-200d-1f469-200d-1f466",
    "man-woman-girl": "1f468-200d-1f469-200d-1f467",
    "man-woman-girl-boy": "1f468-200d-1f469-200d-1f467-200d-1f466",
    "man-woman-boy-boy": "1f468-200d-1f469-200d-1f466-200d-1f466",
    "man-woman-girl-girl": "1f468-200d-1f469-200d-1f467-200d-1f467",
    "man-man-boy": "1f468-200d-1f468-200d-1f466",
    "man-man-girl": "1f468-200d-1f468-200d-1f467",
    "man-man-girl-boy": "1f468-200d-1f468-200d-1f467-200d-1f466",
    "man-man-boy-boy": "1f468-200d-1f468-200d-1f466-200d-1f466",
    "man-man-girl-girl": "1f468-200d-1f468-200d-1f467-200d-1f467",
    "woman-woman-boy": "1f469-200d-1f469-200d-1f466",
    "woman-woman-girl": "1f469-200d-1f469-200d-1f467",
    "woman-woman-girl-boy": "1f469-200d-1f469-200d-1f467-200d-1f466",
    "woman-woman-boy-boy": "1f469-200d-1f469-200d-1f466-200d-1f466",
    "woman-woman-girl-girl": "1f469-200d-1f469-200d-1f467-200d-1f467",
    "man-boy": "1f468-200d-1f466",
    "man-boy-boy": "1f468-200d-1f466-200d-1f466",
    "man-girl": "1f468-200d-1f467",
    "man-girl-boy": "1f468-200d-1f467-200d-1f466",
    "man-girl-girl": "1f468-200d-1f467-200d-1f467",
    "woman-boy": "1f469-200d-1f466",
    "woman-boy-boy": "1f469-200d-1f466-200d-1f466",
    "woman-girl": "1f469-200d-1f467",
    "woman-girl-boy": "1f469-200d-1f467-200d-1f466",
    "woman-girl-girl": "1f469-200d-1f467-200d-1f467",
    "speaking_head_in_silhouette": "1f5e3-fe0f",
    "bust_in_silhouette": "1f464",
    "busts_in_silhouette": "1f465",
    "people_hugging": "1fac2",
    "footprints": "1f463",
    "monkey_face": "1f435",
    "monkey": "1f412",
    "gorilla": "1f98d",
    "orangutan": "1f9a7",
    "dog": "1f436",
    "dog2": "1f415",
    "guide_dog": "1f9ae",
    "service_dog": "1f415-200d-1f9ba",
    "poodle": "1f429",
    "wolf": "1f43a",
    "fox_face": "1f98a",
    "raccoon": "1f99d",
    "cat": "1f431",
    "cat2": "1f408",
    "black_cat": "1f408-200d-2b1b",
    "lion_face": "1f981",
    "tiger": "1f42f",
    "tiger2": "1f405",
    "leopard": "1f406",
    "horse": "1f434",
    "racehorse": "1f40e",
    "unicorn_face": "1f984",
    "zebra_face": "1f993",
    "deer": "1f98c",
    "bison": "1f9ac",
    "cow": "1f42e",
    "ox": "1f402",
    "water_buffalo": "1f403",
    "cow2": "1f404",
    "pig": "1f437",
    "pig2": "1f416",
    "boar": "1f417",
    "pig_nose": "1f43d",
    "ram": "1f40f",
    "sheep": "1f411",
    "goat": "1f410",
    "dromedary_camel": "1f42a",
    "camel": "1f42b",
    "llama": "1f999",
    "giraffe_face": "1f992",
    "elephant": "1f418",
    "mammoth": "1f9a3",
    "rhinoceros": "1f98f",
    "hippopotamus": "1f99b",
    "mouse": "1f42d",
    "mouse2": "1f401",
    "rat": "1f400",
    "hamster": "1f439",
    "rabbit": "1f430",
    "rabbit2": "1f407",
    "chipmunk": "1f43f-fe0f",
    "beaver": "1f9ab",
    "hedgehog": "1f994",
    "bat": "1f987",
    "bear": "1f43b",
    "polar_bear": "1f43b-200d-2744-fe0f",
    "koala": "1f428",
    "panda_face": "1f43c",
    "sloth": "1f9a5",
    "otter": "1f9a6",
    "skunk": "1f9a8",
    "kangaroo": "1f998",
    "badger": "1f9a1",
    "feet": "1f43e",
    "turkey": "1f983",
    "chicken": "1f414",
    "rooster": "1f413",
    "hatching_chick": "1f423",
    "baby_chick": "1f424",
    "hatched_chick": "1f425",
    "bird": "1f426",
    "penguin": "1f427",
    "dove_of_peace": "1f54a-fe0f",
    "eagle": "1f985",
    "duck": "1f986",
    "swan": "1f9a2",
    "owl": "1f989",
    "dodo": "1f9a4",
    "feather": "1fab6",
    "flamingo": "1f9a9",
    "peacock": "1f99a",
    "parrot": "1f99c",
    "frog": "1f438",
    "crocodile": "1f40a",
    "turtle": "1f422",
    "lizard": "1f98e",
    "snake": "1f40d",
    "dragon_face": "1f432",
    "dragon": "1f409",
    "sauropod": "1f995",
    "t-rex": "1f996",
    "whale": "1f433",
    "whale2": "1f40b",
    "dolphin": "1f42c",
    "seal": "1f9ad",
    "fish": "1f41f",
    "tropical_fish": "1f420",
    "blowfish": "1f421",
    "shark": "1f988",
    "octopus": "1f419",
    "shell": "1f41a",
    "coral": "1fab8",
    "snail": "1f40c",
    "butterfly": "1f98b",
    "bug": "1f41b",
    "ant": "1f41c",
    "bee": "1f41d",
    "beetle": "1fab2",
    "ladybug": "1f41e",
    "cricket": "1f997",
    "cockroach": "1fab3",
    "spider": "1f577-fe0f",
    "spider_web": "1f578-fe0f",
    "scorpion": "1f982",
    "mosquito": "1f99f",
    "fly": "1fab0",
    "worm": "1fab1",
    "microbe": "1f9a0",
    "bouquet": "1f490",
    "cherry_blossom": "1f338",
    "white_flower": "1f4ae",
    "lotus": "1fab7",
    "rosette": "1f3f5-fe0f",
    "rose": "1f339",
    "wilted_flower": "1f940",
    "hibiscus": "1f33a",
    "sunflower": "1f33b",
    "blossom": "1f33c",
    "tulip": "1f337",
    "seedling": "1f331",
    "potted_plant": "1fab4",
    "evergreen_tree": "1f332",
    "deciduous_tree": "1f333",
    "palm_tree": "1f334",
    "cactus": "1f335",
    "ear_of_rice": "1f33e",
    "herb": "1f33f",
    "shamrock": "2618-fe0f",
    "four_leaf_clover": "1f340",
    "maple_leaf": "1f341",
    "fallen_leaf": "1f342",
    "leaves": "1f343",
    "empty_nest": "1fab9",
    "nest_with_eggs": "1faba",
    "grapes": "1f347",
    "melon": "1f348",
    "watermelon": "1f349",
    "tangerine": "1f34a",
    "lemon": "1f34b",
    "banana": "1f34c",
    "pineapple": "1f34d",
    "mango": "1f96d",
    "apple": "1f34e",
    "green_apple": "1f34f",
    "pear": "1f350",
    "peach": "1f351",
    "cherries": "1f352",
    "strawberry": "1f353",
    "blueberries": "1fad0",
    "kiwifruit": "1f95d",
    "tomato": "1f345",
    "olive": "1fad2",
    "coconut": "1f965",
    "avocado": "1f951",
    "eggplant": "1f346",
    "potato": "1f954",
    "carrot": "1f955",
    "corn": "1f33d",
    "hot_pepper": "1f336-fe0f",
    "bell_pepper": "1fad1",
    "cucumber": "1f952",
    "leafy_green": "1f96c",
    "broccoli": "1f966",
    "garlic": "1f9c4",
    "onion": "1f9c5",
    "mushroom": "1f344",
    "peanuts": "1f95c",
    "beans": "1fad8",
    "chestnut": "1f330",
    "bread": "1f35e",
    "croissant": "1f950",
    "baguette_bread": "1f956",
    "flatbread": "1fad3",
    "pretzel": "1f968",
    "bagel": "1f96f",
    "pancakes": "1f95e",
    "waffle": "1f9c7",
    "cheese_wedge": "1f9c0",
    "meat_on_bone": "1f356",
    "poultry_leg": "1f357",
    "cut_of_meat": "1f969",
    "bacon": "1f953",
    "hamburger": "1f354",
    "fries": "1f35f",
    "pizza": "1f355",
    "hotdog": "1f32d",
    "sandwich": "1f96a",
    "taco": "1f32e",
    "burrito": "1f32f",
    "tamale": "1fad4",
    "stuffed_flatbread": "1f959",
    "falafel": "1f9c6",
    "egg": "1f95a",
    "fried_egg": "1f373",
    "shallow_pan_of_food": "1f958",
    "stew": "1f372",
    "fondue": "1fad5",
    "bowl_with_spoon": "1f963",
    "green_salad": "1f957",
    "popcorn": "1f37f",
    "butter": "1f9c8",
    "salt": "1f9c2",
    "canned_food": "1f96b",
    "bento": "1f371",
    "rice_cracker": "1f358",
    "rice_ball": "1f359",
    "rice": "1f35a",
    "curry": "1f35b",
    "ramen": "1f35c",
    "spaghetti": "1f35d",
    "sweet_potato": "1f360",
    "oden": "1f362",
    "sushi": "1f363",
    "fried_shrimp": "1f364",
    "fish_cake": "1f365",
    "moon_cake": "1f96e",
    "dango": "1f361",
    "dumpling": "1f95f",
    "fortune_cookie": "1f960",
    "takeout_box": "1f961",
    "crab": "1f980",
    "lobster": "1f99e",
    "shrimp": "1f990",
    "squid": "1f991",
    "oyster": "1f9aa",
    "icecream": "1f366",
    "shaved_ice": "1f367",
    "ice_cream": "1f368",
    "doughnut": "1f369",
    "cookie": "1f36a",
    "birthday": "1f382",
    "cake": "1f370",
    "cupcake": "1f9c1",
    "pie": "1f967",
    "chocolate_bar": "1f36b",
    "candy": "1f36c",
    "lollipop": "1f36d",
    "custard": "1f36e",
    "honey_pot": "1f36f",
    "baby_bottle": "1f37c",
    "glass_of_milk": "1f95b",
    "coffee": "2615",
    "teapot": "1fad6",
    "tea": "1f375",
    "sake": "1f376",
    "champagne": "1f37e",
    "wine_glass": "1f377",
    "cocktail": "1f378",
    "tropical_drink": "1f379",
    "beer": "1f37a",
    "beers": "1f37b",
    "clinking_glasses": "1f942",
    "tumbler_glass": "1f943",
    "pouring_liquid": "1fad7",
    "cup_with_straw": "1f964",
    "bubble_tea": "1f9cb",
    "beverage_box": "1f9c3",
    "mate_drink": "1f9c9",
    "ice_cube": "1f9ca",
    "chopsticks": "1f962",
    "knife_fork_plate": "1f37d-fe0f",
    "fork_and_knife": "1f374",
    "spoon": "1f944",
    "hocho": "1f52a",
    "jar": "1fad9",
    "amphora": "1f3fa",
    "earth_africa": "1f30d",
    "earth_americas": "1f30e",
    "earth_asia": "1f30f",
    "globe_with_meridians": "1f310",
    "world_map": "1f5fa-fe0f",
    "japan": "1f5fe",
    "compass": "1f9ed",
    "snow_capped_mountain": "1f3d4-fe0f",
    "mountain": "26f0-fe0f",
    "volcano": "1f30b",
    "mount_fuji": "1f5fb",
    "camping": "1f3d5-fe0f",
    "beach_with_umbrella": "1f3d6-fe0f",
    "desert": "1f3dc-fe0f",
    "desert_island": "1f3dd-fe0f",
    "national_park": "1f3de-fe0f",
    "stadium": "1f3df-fe0f",
    "classical_building": "1f3db-fe0f",
    "building_construction": "1f3d7-fe0f",
    "bricks": "1f9f1",
    "rock": "1faa8",
    "wood": "1fab5",
    "hut": "1f6d6",
    "house_buildings": "1f3d8-fe0f",
    "derelict_house_building": "1f3da-fe0f",
    "house": "1f3e0",
    "house_with_garden": "1f3e1",
    "office": "1f3e2",
    "post_office": "1f3e3",
    "european_post_office": "1f3e4",
    "hospital": "1f3e5",
    "bank": "1f3e6",
    "hotel": "1f3e8",
    "love_hotel": "1f3e9",
    "convenience_store": "1f3ea",
    "school": "1f3eb",
    "department_store": "1f3ec",
    "factory": "1f3ed",
    "japanese_castle": "1f3ef",
    "european_castle": "1f3f0",
    "wedding": "1f492",
    "tokyo_tower": "1f5fc",
    "statue_of_liberty": "1f5fd",
    "church": "26ea",
    "mosque": "1f54c",
    "hindu_temple": "1f6d5",
    "synagogue": "1f54d",
    "shinto_shrine": "26e9-fe0f",
    "kaaba": "1f54b",
    "fountain": "26f2",
    "tent": "26fa",
    "foggy": "1f301",
    "night_with_stars": "1f303",
    "cityscape": "1f3d9-fe0f",
    "sunrise_over_mountains": "1f304",
    "sunrise": "1f305",
    "city_sunset": "1f306",
    "city_sunrise": "1f307",
    "bridge_at_night": "1f309",
    "hotsprings": "2668-fe0f",
    "carousel_horse": "1f3a0",
    "playground_slide": "1f6dd",
    "ferris_wheel": "1f3a1",
    "roller_coaster": "1f3a2",
    "barber": "1f488",
    "circus_tent": "1f3aa",
    "steam_locomotive": "1f682",
    "railway_car": "1f683",
    "bullettrain_side": "1f684",
    "bullettrain_front": "1f685",
    "train2": "1f686",
    "metro": "1f687",
    "light_rail": "1f688",
    "station": "1f689",
    "tram": "1f68a",
    "monorail": "1f69d",
    "mountain_railway": "1f69e",
    "train": "1f68b",
    "bus": "1f68c",
    "oncoming_bus": "1f68d",
    "trolleybus": "1f68e",
    "minibus": "1f690",
    "ambulance": "1f691",
    "fire_engine": "1f692",
    "police_car": "1f693",
    "oncoming_police_car": "1f694",
    "taxi": "1f695",
    "oncoming_taxi": "1f696",
    "car": "1f697",
    "oncoming_automobile": "1f698",
    "blue_car": "1f699",
    "pickup_truck": "1f6fb",
    "truck": "1f69a",
    "articulated_lorry": "1f69b",
    "tractor": "1f69c",
    "racing_car": "1f3ce-fe0f",
    "racing_motorcycle": "1f3cd-fe0f",
    "motor_scooter": "1f6f5",
    "manual_wheelchair": "1f9bd",
    "motorized_wheelchair": "1f9bc",
    "auto_rickshaw": "1f6fa",
    "bike": "1f6b2",
    "scooter": "1f6f4",
    "skateboard": "1f6f9",
    "roller_skate": "1f6fc",
    "busstop": "1f68f",
    "motorway": "1f6e3-fe0f",
    "railway_track": "1f6e4-fe0f",
    "oil_drum": "1f6e2-fe0f",
    "fuelpump": "26fd",
    "wheel": "1f6de",
    "rotating_light": "1f6a8",
    "traffic_light": "1f6a5",
    "vertical_traffic_light": "1f6a6",
    "octagonal_sign": "1f6d1",
    "construction": "1f6a7",
    "anchor": "2693",
    "ring_buoy": "1f6df",
    "boat": "26f5",
    "canoe": "1f6f6",
    "speedboat": "1f6a4",
    "passenger_ship": "1f6f3-fe0f",
    "ferry": "26f4-fe0f",
    "motor_boat": "1f6e5-fe0f",
    "ship": "1f6a2",
    "airplane": "2708-fe0f",
    "small_airplane": "1f6e9-fe0f",
    "airplane_departure": "1f6eb",
    "airplane_arriving": "1f6ec",
    "parachute": "1fa82",
    "seat": "1f4ba",
    "helicopter": "1f681",
    "suspension_railway": "1f69f",
    "mountain_cableway": "1f6a0",
    "aerial_tramway": "1f6a1",
    "satellite": "1f6f0-fe0f",
    "rocket": "1f680",
    "flying_saucer": "1f6f8",
    "bellhop_bell": "1f6ce-fe0f",
    "luggage": "1f9f3",
    "hourglass": "231b",
    "hourglass_flowing_sand": "23f3",
    "watch": "231a",
    "alarm_clock": "23f0",
    "stopwatch": "23f1-fe0f",
    "timer_clock": "23f2-fe0f",
    "mantelpiece_clock": "1f570-fe0f",
    "clock12": "1f55b",
    "clock1230": "1f567",
    "clock1": "1f550",
    "clock130": "1f55c",
    "clock2": "1f551",
    "clock230": "1f55d",
    "clock3": "1f552",
    "clock330": "1f55e",
    "clock4": "1f553",
    "clock430": "1f55f",
    "clock5": "1f554",
    "clock530": "1f560",
    "clock6": "1f555",
    "clock630": "1f561",
    "clock7": "1f556",
    "clock730": "1f562",
    "clock8": "1f557",
    "clock830": "1f563",
    "clock9": "1f558",
    "clock930": "1f564",
    "clock10": "1f559",
    "clock1030": "1f565",
    "clock11": "1f55a",
    "clock1130": "1f566",
    "new_moon": "1f311",
    "waxing_crescent_moon": "1f312",
    "first_quarter_moon": "1f313",
    "moon": "1f314",
    "full_moon": "1f315",
    "waning_gibbous_moon": "1f316",
    "last_quarter_moon": "1f317",
    "waning_crescent_moon": "1f318",
    "crescent_moon": "1f319",
    "new_moon_with_face": "1f31a",
    "first_quarter_moon_with_face": "1f31b",
    "last_quarter_moon_with_face": "1f31c",
    "thermometer": "1f321-fe0f",
    "sunny": "2600-fe0f",
    "full_moon_with_face": "1f31d",
    "sun_with_face": "1f31e",
    "ringed_planet": "1fa90",
    "star": "2b50",
    "star2": "1f31f",
    "stars": "1f320",
    "milky_way": "1f30c",
    "cloud": "2601-fe0f",
    "partly_sunny": "26c5",
    "thunder_cloud_and_rain": "26c8-fe0f",
    "mostly_sunny": "1f324-fe0f",
    "barely_sunny": "1f325-fe0f",
    "partly_sunny_rain": "1f326-fe0f",
    "rain_cloud": "1f327-fe0f",
    "snow_cloud": "1f328-fe0f",
    "lightning": "1f329-fe0f",
    "tornado": "1f32a-fe0f",
    "fog": "1f32b-fe0f",
    "wind_blowing_face": "1f32c-fe0f",
    "cyclone": "1f300",
    "rainbow": "1f308",
    "closed_umbrella": "1f302",
    "umbrella": "2602-fe0f",
    "umbrella_with_rain_drops": "2614",
    "umbrella_on_ground": "26f1-fe0f",
    "zap": "26a1",
    "snowflake": "2744-fe0f",
    "snowman": "2603-fe0f",
    "snowman_without_snow": "26c4",
    "comet": "2604-fe0f",
    "fire": "1f525",
    "droplet": "1f4a7",
    "ocean": "1f30a",
    "jack_o_lantern": "1f383",
    "christmas_tree": "1f384",
    "fireworks": "1f386",
    "sparkler": "1f387",
    "firecracker": "1f9e8",
    "sparkles": "2728",
    "balloon": "1f388",
    "tada": "1f389",
    "confetti_ball": "1f38a",
    "tanabata_tree": "1f38b",
    "bamboo": "1f38d",
    "dolls": "1f38e",
    "flags": "1f38f",
    "wind_chime": "1f390",
    "rice_scene": "1f391",
    "red_envelope": "1f9e7",
    "ribbon": "1f380",
    "gift": "1f381",
    "reminder_ribbon": "1f397-fe0f",
    "admission_tickets": "1f39f-fe0f",
    "ticket": "1f3ab",
    "medal": "1f396-fe0f",
    "trophy": "1f3c6",
    "sports_medal": "1f3c5",
    "first_place_medal": "1f947",
    "second_place_medal": "1f948",
    "third_place_medal": "1f949",
    "soccer": "26bd",
    "baseball": "26be",
    "softball": "1f94e",
    "basketball": "1f3c0",
    "volleyball": "1f3d0",
    "football": "1f3c8",
    "rugby_football": "1f3c9",
    "tennis": "1f3be",
    "flying_disc": "1f94f",
    "bowling": "1f3b3",
    "cricket_bat_and_ball": "1f3cf",
    "field_hockey_stick_and_ball": "1f3d1",
    "ice_hockey_stick_and_puck": "1f3d2",
    "lacrosse": "1f94d",
    "table_tennis_paddle_and_ball": "1f3d3",
    "badminton_racquet_and_shuttlecock": "1f3f8",
    "boxing_glove": "1f94a",
    "martial_arts_uniform": "1f94b",
    "goal_net": "1f945",
    "golf": "26f3",
    "ice_skate": "26f8-fe0f",
    "fishing_pole_and_fish": "1f3a3",
    "diving_mask": "1f93f",
    "running_shirt_with_sash": "1f3bd",
    "ski": "1f3bf",
    "sled": "1f6f7",
    "curling_stone": "1f94c",
    "dart": "1f3af",
    "yo-yo": "1fa80",
    "kite": "1fa81",
    "8ball": "1f3b1",
    "crystal_ball": "1f52e",
    "magic_wand": "1fa84",
    "nazar_amulet": "1f9ff",
    "hamsa": "1faac",
    "video_game": "1f3ae",
    "joystick": "1f579-fe0f",
    "slot_machine": "1f3b0",
    "game_die": "1f3b2",
    "jigsaw": "1f9e9",
    "teddy_bear": "1f9f8",
    "pinata": "1fa85",
    "mirror_ball": "1faa9",
    "nesting_dolls": "1fa86",
    "spades": "2660-fe0f",
    "hearts": "2665-fe0f",
    "diamonds": "2666-fe0f",
    "clubs": "2663-fe0f",
    "chess_pawn": "265f-fe0f",
    "black_joker": "1f0cf",
    "mahjong": "1f004",
    "flower_playing_cards": "1f3b4",
    "performing_arts": "1f3ad",
    "frame_with_picture": "1f5bc-fe0f",
    "art": "1f3a8",
    "thread": "1f9f5",
    "sewing_needle": "1faa1",
    "yarn": "1f9f6",
    "knot": "1faa2",
    "eyeglasses": "1f453",
    "dark_sunglasses": "1f576-fe0f",
    "goggles": "1f97d",
    "lab_coat": "1f97c",
    "safety_vest": "1f9ba",
    "necktie": "1f454",
    "shirt": "1f455",
    "jeans": "1f456",
    "scarf": "1f9e3",
    "gloves": "1f9e4",
    "coat": "1f9e5",
    "socks": "1f9e6",
    "dress": "1f457",
    "kimono": "1f458",
    "sari": "1f97b",
    "one-piece_swimsuit": "1fa71",
    "briefs": "1fa72",
    "shorts": "1fa73",
    "bikini": "1f459",
    "womans_clothes": "1f45a",
    "purse": "1f45b",
    "handbag": "1f45c",
    "pouch": "1f45d",
    "shopping_bags": "1f6cd-fe0f",
    "school_satchel": "1f392",
    "thong_sandal": "1fa74",
    "mans_shoe": "1f45e",
    "athletic_shoe": "1f45f",
    "hiking_boot": "1f97e",
    "womans_flat_shoe": "1f97f",
    "high_heel": "1f460",
    "sandal": "1f461",
    "ballet_shoes": "1fa70",
    "boot": "1f462",
    "crown": "1f451",
    "womans_hat": "1f452",
    "tophat": "1f3a9",
    "mortar_board": "1f393",
    "billed_cap": "1f9e2",
    "military_helmet": "1fa96",
    "helmet_with_white_cross": "26d1-fe0f",
    "prayer_beads": "1f4ff",
    "lipstick": "1f484",
    "ring": "1f48d",
    "gem": "1f48e",
    "mute": "1f507",
    "speaker": "1f508",
    "sound": "1f509",
    "loud_sound": "1f50a",
    "loudspeaker": "1f4e2",
    "mega": "1f4e3",
    "postal_horn": "1f4ef",
    "bell": "1f514",
    "no_bell": "1f515",
    "musical_score": "1f3bc",
    "musical_note": "1f3b5",
    "notes": "1f3b6",
    "studio_microphone": "1f399-fe0f",
    "level_slider": "1f39a-fe0f",
    "control_knobs": "1f39b-fe0f",
    "microphone": "1f3a4",
    "headphones": "1f3a7",
    "radio": "1f4fb",
    "saxophone": "1f3b7",
    "accordion": "1fa97",
    "guitar": "1f3b8",
    "musical_keyboard": "1f3b9",
    "trumpet": "1f3ba",
    "violin": "1f3bb",
    "banjo": "1fa95",
    "drum_with_drumsticks": "1f941",
    "long_drum": "1fa98",
    "iphone": "1f4f1",
    "calling": "1f4f2",
    "phone": "260e-fe0f",
    "telephone_receiver": "1f4de",
    "pager": "1f4df",
    "fax": "1f4e0",
    "battery": "1f50b",
    "low_battery": "1faab",
    "electric_plug": "1f50c",
    "computer": "1f4bb",
    "desktop_computer": "1f5a5-fe0f",
    "printer": "1f5a8-fe0f",
    "keyboard": "2328-fe0f",
    "three_button_mouse": "1f5b1-fe0f",
    "trackball": "1f5b2-fe0f",
    "minidisc": "1f4bd",
    "floppy_disk": "1f4be",
    "cd": "1f4bf",
    "dvd": "1f4c0",
    "abacus": "1f9ee",
    "movie_camera": "1f3a5",
    "film_frames": "1f39e-fe0f",
    "film_projector": "1f4fd-fe0f",
    "clapper": "1f3ac",
    "tv": "1f4fa",
    "camera": "1f4f7",
    "camera_with_flash": "1f4f8",
    "video_camera": "1f4f9",
    "vhs": "1f4fc",
    "mag": "1f50d",
    "mag_right": "1f50e",
    "candle": "1f56f-fe0f",
    "bulb": "1f4a1",
    "flashlight": "1f526",
    "izakaya_lantern": "1f3ee",
    "diya_lamp": "1fa94",
    "notebook_with_decorative_cover": "1f4d4",
    "closed_book": "1f4d5",
    "book": "1f4d6",
    "green_book": "1f4d7",
    "blue_book": "1f4d8",
    "orange_book": "1f4d9",
    "books": "1f4da",
    "notebook": "1f4d3",
    "ledger": "1f4d2",
    "page_with_curl": "1f4c3",
    "scroll": "1f4dc",
    "page_facing_up": "1f4c4",
    "newspaper": "1f4f0",
    "rolled_up_newspaper": "1f5de-fe0f",
    "bookmark_tabs": "1f4d1",
    "bookmark": "1f516",
    "label": "1f3f7-fe0f",
    "moneybag": "1f4b0",
    "coin": "1fa99",
    "yen": "1f4b4",
    "dollar": "1f4b5",
    "euro": "1f4b6",
    "pound": "1f4b7",
    "money_with_wings": "1f4b8",
    "credit_card": "1f4b3",
    "receipt": "1f9fe",
    "chart": "1f4b9",
    "email": "2709-fe0f",
    "e-mail": "1f4e7",
    "incoming_envelope": "1f4e8",
    "envelope_with_arrow": "1f4e9",
    "outbox_tray": "1f4e4",
    "inbox_tray": "1f4e5",
    "package": "1f4e6",
    "mailbox": "1f4eb",
    "mailbox_closed": "1f4ea",
    "mailbox_with_mail": "1f4ec",
    "mailbox_with_no_mail": "1f4ed",
    "postbox": "1f4ee",
    "ballot_box_with_ballot": "1f5f3-fe0f",
    "pencil2": "270f-fe0f",
    "black_nib": "2712-fe0f",
    "lower_left_fountain_pen": "1f58b-fe0f",
    "lower_left_ballpoint_pen": "1f58a-fe0f",
    "lower_left_paintbrush": "1f58c-fe0f",
    "lower_left_crayon": "1f58d-fe0f",
    "memo": "1f4dd",
    "briefcase": "1f4bc",
    "file_folder": "1f4c1",
    "open_file_folder": "1f4c2",
    "card_index_dividers": "1f5c2-fe0f",
    "date": "1f4c5",
    "calendar": "1f4c6",
    "spiral_note_pad": "1f5d2-fe0f",
    "spiral_calendar_pad": "1f5d3-fe0f",
    "card_index": "1f4c7",
    "chart_with_upwards_trend": "1f4c8",
    "chart_with_downwards_trend": "1f4c9",
    "bar_chart": "1f4ca",
    "clipboard": "1f4cb",
    "pushpin": "1f4cc",
    "round_pushpin": "1f4cd",
    "paperclip": "1f4ce",
    "linked_paperclips": "1f587-fe0f",
    "straight_ruler": "1f4cf",
    "triangular_ruler": "1f4d0",
    "scissors": "2702-fe0f",
    "card_file_box": "1f5c3-fe0f",
    "file_cabinet": "1f5c4-fe0f",
    "wastebasket": "1f5d1-fe0f",
    "lock": "1f512",
    "unlock": "1f513",
    "lock_with_ink_pen": "1f50f",
    "closed_lock_with_key": "1f510",
    "key": "1f511",
    "old_key": "1f5dd-fe0f",
    "hammer": "1f528",
    "axe": "1fa93",
    "pick": "26cf-fe0f",
    "hammer_and_pick": "2692-fe0f",
    "hammer_and_wrench": "1f6e0-fe0f",
    "dagger_knife": "1f5e1-fe0f",
    "crossed_swords": "2694-fe0f",
    "gun": "1f52b",
    "boomerang": "1fa83",
    "bow_and_arrow": "1f3f9",
    "shield": "1f6e1-fe0f",
    "carpentry_saw": "1fa9a",
    "wrench": "1f527",
    "screwdriver": "1fa9b",
    "nut_and_bolt": "1f529",
    "gear": "2699-fe0f",
    "compression": "1f5dc-fe0f",
    "scales": "2696-fe0f",
    "probing_cane": "1f9af",
    "link": "1f517",
    "chains": "26d3-fe0f",
    "hook": "1fa9d",
    "toolbox": "1f9f0",
    "magnet": "1f9f2",
    "ladder": "1fa9c",
    "alembic": "2697-fe0f",
    "test_tube": "1f9ea",
    "petri_dish": "1f9eb",
    "dna": "1f9ec",
    "microscope": "1f52c",
    "telescope": "1f52d",
    "satellite_antenna": "1f4e1",
    "syringe": "1f489",
    "drop_of_blood": "1fa78",
    "pill": "1f48a",
    "adhesive_bandage": "1fa79",
    "crutch": "1fa7c",
    "stethoscope": "1fa7a",
    "x-ray": "1fa7b",
    "door": "1f6aa",
    "elevator": "1f6d7",
    "mirror": "1fa9e",
    "window": "1fa9f",
    "bed": "1f6cf-fe0f",
    "couch_and_lamp": "1f6cb-fe0f",
    "chair": "1fa91",
    "toilet": "1f6bd",
    "plunger": "1faa0",
    "shower": "1f6bf",
    "bathtub": "1f6c1",
    "mouse_trap": "1faa4",
    "razor": "1fa92",
    "lotion_bottle": "1f9f4",
    "safety_pin": "1f9f7",
    "broom": "1f9f9",
    "basket": "1f9fa",
    "roll_of_paper": "1f9fb",
    "bucket": "1faa3",
    "soap": "1f9fc",
    "bubbles": "1fae7",
    "toothbrush": "1faa5",
    "sponge": "1f9fd",
    "fire_extinguisher": "1f9ef",
    "shopping_trolley": "1f6d2",
    "smoking": "1f6ac",
    "coffin": "26b0-fe0f",
    "headstone": "1faa6",
    "funeral_urn": "26b1-fe0f",
    "moyai": "1f5ff",
    "placard": "1faa7",
    "identification_card": "1faaa",
    "atm": "1f3e7",
    "put_litter_in_its_place": "1f6ae",
    "potable_water": "1f6b0",
    "wheelchair": "267f",
    "mens": "1f6b9",
    "womens": "1f6ba",
    "restroom": "1f6bb",
    "baby_symbol": "1f6bc",
    "wc": "1f6be",
    "passport_control": "1f6c2",
    "customs": "1f6c3",
    "baggage_claim": "1f6c4",
    "left_luggage": "1f6c5",
    "warning": "26a0-fe0f",
    "children_crossing": "1f6b8",
    "no_entry": "26d4",
    "no_entry_sign": "1f6ab",
    "no_bicycles": "1f6b3",
    "no_smoking": "1f6ad",
    "do_not_litter": "1f6af",
    "non-potable_water": "1f6b1",
    "no_pedestrians": "1f6b7",
    "no_mobile_phones": "1f4f5",
    "underage": "1f51e",
    "radioactive_sign": "2622-fe0f",
    "biohazard_sign": "2623-fe0f",
    "arrow_up": "2b06-fe0f",
    "arrow_upper_right": "2197-fe0f",
    "arrow_right": "27a1-fe0f",
    "arrow_lower_right": "2198-fe0f",
    "arrow_down": "2b07-fe0f",
    "arrow_lower_left": "2199-fe0f",
    "arrow_left": "2b05-fe0f",
    "arrow_upper_left": "2196-fe0f",
    "arrow_up_down": "2195-fe0f",
    "left_right_arrow": "2194-fe0f",
    "leftwards_arrow_with_hook": "21a9-fe0f",
    "arrow_right_hook": "21aa-fe0f",
    "arrow_heading_up": "2934-fe0f",
    "arrow_heading_down": "2935-fe0f",
    "arrows_clockwise": "1f503",
    "arrows_counterclockwise": "1f504",
    "back": "1f519",
    "end": "1f51a",
    "on": "1f51b",
    "soon": "1f51c",
    "top": "1f51d",
    "place_of_worship": "1f6d0",
    "atom_symbol": "269b-fe0f",
    "om_symbol": "1f549-fe0f",
    "star_of_david": "2721-fe0f",
    "wheel_of_dharma": "2638-fe0f",
    "yin_yang": "262f-fe0f",
    "latin_cross": "271d-fe0f",
    "orthodox_cross": "2626-fe0f",
    "star_and_crescent": "262a-fe0f",
    "peace_symbol": "262e-fe0f",
    "menorah_with_nine_branches": "1f54e",
    "six_pointed_star": "1f52f",
    "aries": "2648",
    "taurus": "2649",
    "gemini": "264a",
    "cancer": "264b",
    "leo": "264c",
    "virgo": "264d",
    "libra": "264e",
    "scorpius": "264f",
    "sagittarius": "2650",
    "capricorn": "2651",
    "aquarius": "2652",
    "pisces": "2653",
    "ophiuchus": "26ce",
    "twisted_rightwards_arrows": "1f500",
    "repeat": "1f501",
    "repeat_one": "1f502",
    "arrow_forward": "25b6-fe0f",
    "fast_forward": "23e9",
    "black_right_pointing_double_triangle_with_vertical_bar": "23ed-fe0f",
    "black_right_pointing_triangle_with_double_vertical_bar": "23ef-fe0f",
    "arrow_backward": "25c0-fe0f",
    "rewind": "23ea",
    "black_left_pointing_double_triangle_with_vertical_bar": "23ee-fe0f",
    "arrow_up_small": "1f53c",
    "arrow_double_up": "23eb",
    "arrow_down_small": "1f53d",
    "arrow_double_down": "23ec",
    "double_vertical_bar": "23f8-fe0f",
    "black_square_for_stop": "23f9-fe0f",
    "black_circle_for_record": "23fa-fe0f",
    "eject": "23cf-fe0f",
    "cinema": "1f3a6",
    "low_brightness": "1f505",
    "high_brightness": "1f506",
    "signal_strength": "1f4f6",
    "vibration_mode": "1f4f3",
    "mobile_phone_off": "1f4f4",
    "female_sign": "2640-fe0f",
    "male_sign": "2642-fe0f",
    "transgender_symbol": "26a7-fe0f",
    "heavy_multiplication_x": "2716-fe0f",
    "heavy_plus_sign": "2795",
    "heavy_minus_sign": "2796",
    "heavy_division_sign": "2797",
    "heavy_equals_sign": "1f7f0",
    "infinity": "267e-fe0f",
    "bangbang": "203c-fe0f",
    "interrobang": "2049-fe0f",
    "question": "2753",
    "grey_question": "2754",
    "grey_exclamation": "2755",
    "exclamation": "2757",
    "wavy_dash": "3030-fe0f",
    "currency_exchange": "1f4b1",
    "heavy_dollar_sign": "1f4b2",
    "medical_symbol": "2695-fe0f",
    "recycle": "267b-fe0f",
    "fleur_de_lis": "269c-fe0f",
    "trident": "1f531",
    "name_badge": "1f4db",
    "beginner": "1f530",
    "o": "2b55",
    "white_check_mark": "2705",
    "ballot_box_with_check": "2611-fe0f",
    "heavy_check_mark": "2714-fe0f",
    "x": "274c",
    "negative_squared_cross_mark": "274e",
    "curly_loop": "27b0",
    "loop": "27bf",
    "part_alternation_mark": "303d-fe0f",
    "eight_spoked_asterisk": "2733-fe0f",
    "eight_pointed_black_star": "2734-fe0f",
    "sparkle": "2747-fe0f",
    "copyright": "00a9-fe0f",
    "registered": "00ae-fe0f",
    "tm": "2122-fe0f",
    "hash": "0023-fe0f-20e3",
    "keycap_star": "002a-fe0f-20e3",
    "zero": "0030-fe0f-20e3",
    "one": "0031-fe0f-20e3",
    "two": "0032-fe0f-20e3",
    "three": "0033-fe0f-20e3",
    "four": "0034-fe0f-20e3",
    "five": "0035-fe0f-20e3",
    "six": "0036-fe0f-20e3",
    "seven": "0037-fe0f-20e3",
    "eight": "0038-fe0f-20e3",
    "nine": "0039-fe0f-20e3",
    "keycap_ten": "1f51f",
    "capital_abcd": "1f520",
    "abcd": "1f521",
    "symbols": "1f523",
    "abc": "1f524",
    "a": "1f170-fe0f",
    "ab": "1f18e",
    "b": "1f171-fe0f",
    "cl": "1f191",
    "cool": "1f192",
    "free": "1f193",
    "information_source": "2139-fe0f",
    "id": "1f194",
    "m": "24c2-fe0f",
    "new": "1f195",
    "ng": "1f196",
    "o2": "1f17e-fe0f",
    "ok": "1f197",
    "parking": "1f17f-fe0f",
    "sos": "1f198",
    "up": "1f199",
    "vs": "1f19a",
    "koko": "1f201",
    "sa": "1f202-fe0f",
    "u6708": "1f237-fe0f",
    "u6709": "1f236",
    "u6307": "1f22f",
    "ideograph_advantage": "1f250",
    "u5272": "1f239",
    "u7121": "1f21a",
    "u7981": "1f232",
    "accept": "1f251",
    "u7533": "1f238",
    "u5408": "1f234",
    "u7a7a": "1f233",
    "congratulations": "3297-fe0f",
    "secret": "3299-fe0f",
    "u55b6": "1f23a",
    "u6e80": "1f235",
    "red_circle": "1f534",
    "large_orange_circle": "1f7e0",
    "large_yellow_circle": "1f7e1",
    "large_green_circle": "1f7e2",
    "large_blue_circle": "1f535",
    "large_purple_circle": "1f7e3",
    "large_brown_circle": "1f7e4",
    "black_circle": "26ab",
    "white_circle": "26aa",
    "large_red_square": "1f7e5",
    "large_orange_square": "1f7e7",
    "large_yellow_square": "1f7e8",
    "large_green_square": "1f7e9",
    "large_blue_square": "1f7e6",
    "large_purple_square": "1f7ea",
    "large_brown_square": "1f7eb",
    "black_large_square": "2b1b",
    "white_large_square": "2b1c",
    "black_medium_square": "25fc-fe0f",
    "white_medium_square": "25fb-fe0f",
    "black_medium_small_square": "25fe",
    "white_medium_small_square": "25fd",
    "black_small_square": "25aa-fe0f",
    "white_small_square": "25ab-fe0f",
    "large_orange_diamond": "1f536",
    "large_blue_diamond": "1f537",
    "small_orange_diamond": "1f538",
    "small_blue_diamond": "1f539",
    "small_red_triangle": "1f53a",
    "small_red_triangle_down": "1f53b",
    "diamond_shape_with_a_dot_inside": "1f4a0",
    "radio_button": "1f518",
    "white_square_button": "1f533",
    "black_square_button": "1f532",
    "checkered_flag": "1f3c1",
    "triangular_flag_on_post": "1f6a9",
    "crossed_flags": "1f38c",
    "waving_black_flag": "1f3f4",
    "waving_white_flag": "1f3f3-fe0f",
    "rainbow-flag": "1f3f3-fe0f-200d-1f308",
    "transgender_flag": "1f3f3-fe0f-200d-26a7-fe0f",
    "pirate_flag": "1f3f4-200d-2620-fe0f",
    "flag-ac": "1f1e6-1f1e8",
    "flag-ad": "1f1e6-1f1e9",
    "flag-ae": "1f1e6-1f1ea",
    "flag-af": "1f1e6-1f1eb",
    "flag-ag": "1f1e6-1f1ec",
    "flag-ai": "1f1e6-1f1ee",
    "flag-al": "1f1e6-1f1f1",
    "flag-am": "1f1e6-1f1f2",
    "flag-ao": "1f1e6-1f1f4",
    "flag-aq": "1f1e6-1f1f6",
    "flag-ar": "1f1e6-1f1f7",
    "flag-as": "1f1e6-1f1f8",
    "flag-at": "1f1e6-1f1f9",
    "flag-au": "1f1e6-1f1fa",
    "flag-aw": "1f1e6-1f1fc",
    "flag-ax": "1f1e6-1f1fd",
    "flag-az": "1f1e6-1f1ff",
    "flag-ba": "1f1e7-1f1e6",
    "flag-bb": "1f1e7-1f1e7",
    "flag-bd": "1f1e7-1f1e9",
    "flag-be": "1f1e7-1f1ea",
    "flag-bf": "1f1e7-1f1eb",
    "flag-bg": "1f1e7-1f1ec",
    "flag-bh": "1f1e7-1f1ed",
    "flag-bi": "1f1e7-1f1ee",
    "flag-bj": "1f1e7-1f1ef",
    "flag-bl": "1f1e7-1f1f1",
    "flag-bm": "1f1e7-1f1f2",
    "flag-bn": "1f1e7-1f1f3",
    "flag-bo": "1f1e7-1f1f4",
    "flag-bq": "1f1e7-1f1f6",
    "flag-br": "1f1e7-1f1f7",
    "flag-bs": "1f1e7-1f1f8",
    "flag-bt": "1f1e7-1f1f9",
    "flag-bv": "1f1e7-1f1fb",
    "flag-bw": "1f1e7-1f1fc",
    "flag-by": "1f1e7-1f1fe",
    "flag-bz": "1f1e7-1f1ff",
    "flag-ca": "1f1e8-1f1e6",
    "flag-cc": "1f1e8-1f1e8",
    "flag-cd": "1f1e8-1f1e9",
    "flag-cf": "1f1e8-1f1eb",
    "flag-cg": "1f1e8-1f1ec",
    "flag-ch": "1f1e8-1f1ed",
    "flag-ci": "1f1e8-1f1ee",
    "flag-ck": "1f1e8-1f1f0",
    "flag-cl": "1f1e8-1f1f1",
    "flag-cm": "1f1e8-1f1f2",
    "cn": "1f1e8-1f1f3",
    "flag-co": "1f1e8-1f1f4",
    "flag-cp": "1f1e8-1f1f5",
    "flag-cr": "1f1e8-1f1f7",
    "flag-cu": "1f1e8-1f1fa",
    "flag-cv": "1f1e8-1f1fb",
    "flag-cw": "1f1e8-1f1fc",
    "flag-cx": "1f1e8-1f1fd",
    "flag-cy": "1f1e8-1f1fe",
    "flag-cz": "1f1e8-1f1ff",
    "de": "1f1e9-1f1ea",
    "flag-dg": "1f1e9-1f1ec",
    "flag-dj": "1f1e9-1f1ef",
    "flag-dk": "1f1e9-1f1f0",
    "flag-dm": "1f1e9-1f1f2",
    "flag-do": "1f1e9-1f1f4",
    "flag-dz": "1f1e9-1f1ff",
    "flag-ea": "1f1ea-1f1e6",
    "flag-ec": "1f1ea-1f1e8",
    "flag-ee": "1f1ea-1f1ea",
    "flag-eg": "1f1ea-1f1ec",
    "flag-eh": "1f1ea-1f1ed",
    "flag-er": "1f1ea-1f1f7",
    "es": "1f1ea-1f1f8",
    "flag-et": "1f1ea-1f1f9",
    "flag-eu": "1f1ea-1f1fa",
    "flag-fi": "1f1eb-1f1ee",
    "flag-fj": "1f1eb-1f1ef",
    "flag-fk": "1f1eb-1f1f0",
    "flag-fm": "1f1eb-1f1f2",
    "flag-fo": "1f1eb-1f1f4",
    "fr": "1f1eb-1f1f7",
    "flag-ga": "1f1ec-1f1e6",
    "gb": "1f1ec-1f1e7",
    "flag-gd": "1f1ec-1f1e9",
    "flag-ge": "1f1ec-1f1ea",
    "flag-gf": "1f1ec-1f1eb",
    "flag-gg": "1f1ec-1f1ec",
    "flag-gh": "1f1ec-1f1ed",
    "flag-gi": "1f1ec-1f1ee",
    "flag-gl": "1f1ec-1f1f1",
    "flag-gm": "1f1ec-1f1f2",
    "flag-gn": "1f1ec-1f1f3",
    "flag-gp": "1f1ec-1f1f5",
    "flag-gq": "1f1ec-1f1f6",
    "flag-gr": "1f1ec-1f1f7",
    "flag-gs": "1f1ec-1f1f8",
    "flag-gt": "1f1ec-1f1f9",
    "flag-gu": "1f1ec-1f1fa",
    "flag-gw": "1f1ec-1f1fc",
    "flag-gy": "1f1ec-1f1fe",
    "flag-hk": "1f1ed-1f1f0",
    "flag-hm": "1f1ed-1f1f2",
    "flag-hn": "1f1ed-1f1f3",
    "flag-hr": "1f1ed-1f1f7",
    "flag-ht": "1f1ed-1f1f9",
    "flag-hu": "1f1ed-1f1fa",
    "flag-ic": "1f1ee-1f1e8",
    "flag-id": "1f1ee-1f1e9",
    "flag-ie": "1f1ee-1f1ea",
    "flag-il": "1f1ee-1f1f1",
    "flag-im": "1f1ee-1f1f2",
    "flag-in": "1f1ee-1f1f3",
    "flag-io": "1f1ee-1f1f4",
    "flag-iq": "1f1ee-1f1f6",
    "flag-ir": "1f1ee-1f1f7",
    "flag-is": "1f1ee-1f1f8",
    "it": "1f1ee-1f1f9",
    "flag-je": "1f1ef-1f1ea",
    "flag-jm": "1f1ef-1f1f2",
    "flag-jo": "1f1ef-1f1f4",
    "jp": "1f1ef-1f1f5",
    "flag-ke": "1f1f0-1f1ea",
    "flag-kg": "1f1f0-1f1ec",
    "flag-kh": "1f1f0-1f1ed",
    "flag-ki": "1f1f0-1f1ee",
    "flag-km": "1f1f0-1f1f2",
    "flag-kn": "1f1f0-1f1f3",
    "flag-kp": "1f1f0-1f1f5",
    "kr": "1f1f0-1f1f7",
    "flag-kw": "1f1f0-1f1fc",
    "flag-ky": "1f1f0-1f1fe",
    "flag-kz": "1f1f0-1f1ff",
    "flag-la": "1f1f1-1f1e6",
    "flag-lb": "1f1f1-1f1e7",
    "flag-lc": "1f1f1-1f1e8",
    "flag-li": "1f1f1-1f1ee",
    "flag-lk": "1f1f1-1f1f0",
    "flag-lr": "1f1f1-1f1f7",
    "flag-ls": "1f1f1-1f1f8",
    "flag-lt": "1f1f1-1f1f9",
    "flag-lu": "1f1f1-1f1fa",
    "flag-lv": "1f1f1-1f1fb",
    "flag-ly": "1f1f1-1f1fe",
    "flag-ma": "1f1f2-1f1e6",
    "flag-mc": "1f1f2-1f1e8",
    "flag-md": "1f1f2-1f1e9",
    "flag-me": "1f1f2-1f1ea",
    "flag-mf": "1f1f2-1f1eb",
    "flag-mg": "1f1f2-1f1ec",
    "flag-mh": "1f1f2-1f1ed",
    "flag-mk": "1f1f2-1f1f0",
    "flag-ml": "1f1f2-1f1f1",
    "flag-mm": "1f1f2-1f1f2",
    "flag-mn": "1f1f2-1f1f3",
    "flag-mo": "1f1f2-1f1f4",
    "flag-mp": "1f1f2-1f1f5",
    "flag-mq": "1f1f2-1f1f6",
    "flag-mr": "1f1f2-1f1f7",
    "flag-ms": "1f1f2-1f1f8",
    "flag-mt": "1f1f2-1f1f9",
    "flag-mu": "1f1f2-1f1fa",
    "flag-mv": "1f1f2-1f1fb",
    "flag-mw": "1f1f2-1f1fc",
    "flag-mx": "1f1f2-1f1fd",
    "flag-my": "1f1f2-1f1fe",
    "flag-mz": "1f1f2-1f1ff",
    "flag-na": "1f1f3-1f1e6",
    "flag-nc": "1f1f3-1f1e8",
    "flag-ne": "1f1f3-1f1ea",
    "flag-nf": "1f1f3-1f1eb",
    "flag-ng": "1f1f3-1f1ec",
    "flag-ni": "1f1f3-1f1ee",
    "flag-nl": "1f1f3-1f1f1",
    "flag-no": "1f1f3-1f1f4",
    "flag-np": "1f1f3-1f1f5",
    "flag-nr": "1f1f3-1f1f7",
    "flag-nu": "1f1f3-1f1fa",
    "flag-nz": "1f1f3-1f1ff",
    "flag-om": "1f1f4-1f1f2",
    "flag-pa": "1f1f5-1f1e6",
    "flag-pe": "1f1f5-1f1ea",
    "flag-pf": "1f1f5-1f1eb",
    "flag-pg": "1f1f5-1f1ec",
    "flag-ph": "1f1f5-1f1ed",
    "flag-pk": "1f1f5-1f1f0",
    "flag-pl": "1f1f5-1f1f1",
    "flag-pm": "1f1f5-1f1f2",
    "flag-pn": "1f1f5-1f1f3",
    "flag-pr": "1f1f5-1f1f7",
    "flag-ps": "1f1f5-1f1f8",
    "flag-pt": "1f1f5-1f1f9",
    "flag-pw": "1f1f5-1f1fc",
    "flag-py": "1f1f5-1f1fe",
    "flag-qa": "1f1f6-1f1e6",
    "flag-re": "1f1f7-1f1ea",
    "flag-ro": "1f1f7-1f1f4",
    "flag-rs": "1f1f7-1f1f8",
    "ru": "1f1f7-1f1fa",
    "flag-rw": "1f1f7-1f1fc",
    "flag-sa": "1f1f8-1f1e6",
    "flag-sb": "1f1f8-1f1e7",
    "flag-sc": "1f1f8-1f1e8",
    "flag-sd": "1f1f8-1f1e9",
    "flag-se": "1f1f8-1f1ea",
    "flag-sg": "1f1f8-1f1ec",
    "flag-sh": "1f1f8-1f1ed",
    "flag-si": "1f1f8-1f1ee",
    "flag-sj": "1f1f8-1f1ef",
    "flag-sk": "1f1f8-1f1f0",
    "flag-sl": "1f1f8-1f1f1",
    "flag-sm": "1f1f8-1f1f2",
    "flag-sn": "1f1f8-1f1f3",
    "flag-so": "1f1f8-1f1f4",
    "flag-sr": "1f1f8-1f1f7",
    "flag-ss": "1f1f8-1f1f8",
    "flag-st": "1f1f8-1f1f9",
    "flag-sv": "1f1f8-1f1fb",
    "flag-sx": "1f1f8-1f1fd",
    "flag-sy": "1f1f8-1f1fe",
    "flag-sz": "1f1f8-1f1ff",
    "flag-ta": "1f1f9-1f1e6",
    "flag-tc": "1f1f9-1f1e8",
    "flag-td": "1f1f9-1f1e9",
    "flag-tf": "1f1f9-1f1eb",
    "flag-tg": "1f1f9-1f1ec",
    "flag-th": "1f1f9-1f1ed",
    "flag-tj": "1f1f9-1f1ef",
    "flag-tk": "1f1f9-1f1f0",
    "flag-tl": "1f1f9-1f1f1",
    "flag-tm": "1f1f9-1f1f2",
    "flag-tn": "1f1f9-1f1f3",
    "flag-to": "1f1f9-1f1f4",
    "flag-tr": "1f1f9-1f1f7",
    "flag-tt": "1f1f9-1f1f9",
    "flag-tv": "1f1f9-1f1fb",
    "flag-tw": "1f1f9-1f1fc",
    "flag-tz": "1f1f9-1f1ff",
    "flag-ua": "1f1fa-1f1e6",
    "flag-ug": "1f1fa-1f1ec",
    "flag-um": "1f1fa-1f1f2",
    "flag-un": "1f1fa-1f1f3",
    "us": "1f1fa-1f1f8",
    "flag-uy": "1f1fa-1f1fe",
    "flag-uz": "1f1fa-1f1ff",
    "flag-va": "1f1fb-1f1e6",
    "flag-vc": "1f1fb-1f1e8",
    "flag-ve": "1f1fb-1f1ea",
    "flag-vg": "1f1fb-1f1ec",
    "flag-vi": "1f1fb-1f1ee",
    "flag-vn": "1f1fb-1f1f3",
    "flag-vu": "1f1fb-1f1fa",
    "flag-wf": "1f1fc-1f1eb",
    "flag-ws": "1f1fc-1f1f8",
    "flag-xk": "1f1fd-1f1f0",
    "flag-ye": "1f1fe-1f1ea",
    "flag-yt": "1f1fe-1f1f9",
    "flag-za": "1f1ff-1f1e6",
    "flag-zm": "1f1ff-1f1f2",
    "flag-zw": "1f1ff-1f1fc",
    "flag-england": "1f3f4-e0067-e0062-e0065-e006e-e0067-e007f",
    "flag-scotland": "1f3f4-e0067-e0062-e0073-e0063-e0074-e007f",
    "flag-wales": "1f3f4-e0067-e0062-e0077-e006c-e0073-e007f"
};

export {
    sendRequestEmail,
    exportPublicChannelMessages,
    getPublicChannelMessages,
    getPublicChannelMessages2,
    getPrivateChannelMessages,
    getPrivateChannelMessages2,
    getGroupChannelMessages2,
    getDirectConversationList,
    getConversationDetails,
    getConversationDetails2,
    getConversationDetails3,
    exportToFolderZipMultiple,
    getExportAll,
    exportToZip,
    exportToZipMultiple,
    exportToPDF,
    exportToZipMultiplePDF,
    exportToJSON,
    exportToZipMultipleJSON,
    exportToZipMultipleMail,
    exportToZipMultipleMailPDF,
    exportToZipMultipleMailJSON,
    getArchive,
    applyArchive,
    slackArchiveMembers,
    getArchiveLog,
    getArchiveCronTime,
    setArchiveCronTime,
    getSlackImage,
    getSlackImage2,
    getSlackImage3,
    formatSizeUnits,
    removeSlackWorkspace,
    removeMS365Workspace,
    removeGoogleWorkspace,
    refreshTeams,
    downloadSlackFile,
    resendTwoFactorCode,
    resendPhoneOtp,
    verifyEmail,
    verify2FaCode,
    verifyPhoneNumberCode, 
    updateSecurity,
    sendOtpUpdate,
    updatePhoneNumber,
    generateSecret,
    verifyTOTP,
    verifyTOTP2,
    removeAuthenticator,
    sendPhoneNumberVerificationCode,
    postLogoutAction,
    updateProfile,
    changePassword,
    deactivateAccount,
    getUserActions,
    getSubscriptionPlanStatus,
    getBillingPlans,
    searchAll,
    deleteBackups,
    unsubscribe,
    getMS365UsersApi,
    sendMS365RequestAuth,
    archiveMSOutlook,
    getOutlookArchive,
    getOutlookContent,
    getGmailContent,
    downloadArchiveGmailAttachment,
    downloadArchiveOutlookAttachment,
    getArchiveOutlookDownload,
    getArchiveOutlookSearchBulkDownload,
    bulkDownloadGmailFromSearch,
    getArchiveOutlookBulkDownload,
    downloadArchiveGmail,
    bulkDownloadArchiveGmail,
    archiveMSOneDrive,
    getOneDriveArchive,
    downloadArchiveOnedrive,
    archiveMSJob,
    getGoogleUsersApi,
    archiveGoogleJob,
    archiveDropboxJob,
    archiveSlackJob,
    getGmailArchive,
    getDriveArchive,
    getS3Image,
    getS3PreSignedImageUrl,
    addDownloadGmailLog,
    getStoredCollectionMap,
    emojis
};