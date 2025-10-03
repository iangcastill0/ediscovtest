import { createContext, useContext, useState } from "react";
import axios from "utils/axios";
import dfAxios from 'axios';
import { downloadOriginalGmail } from "utils/utils";

const DownloadContext = createContext();

export const DownloadProvider = ({ children }) => {
    const [downloadList, setDownloadList] = useState([]);
    const [downloadBadge, setDownloadBadge] = useState(0);

    // Function to start a new download
    const startDownload = (file) => {
        const newDownload = {
            type: file.type,
            id: file.id,
            s3Key: undefined,
            isArchive: file.isArchive,
            name: file.name,
            url: file.url,
            progress: 0,
            status: "Downloading",
            showAnimation: true,
            axiosType: file.axiosType || 'GET',
            postData: file.postData,
            responseType: file.responseType || undefined
        };
        console.log(newDownload)
        setDownloadList((prev) => [newDownload, ...prev]);
        setDownloadBadge((prev) => prev + 1);
        // if (!file.isArchive) {
            if (file.type === 'Onedrive') {
                dfAxios({
                    method: newDownload.axiosType,
                    url: file.url,
                    responseType: "blob",
                    onDownloadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
        
                        setDownloadList((prev) =>
                            prev.map((dl) =>
                                dl.id === file.id ? { ...dl, progress: percentCompleted, loaded: progressEvent.loaded} : dl
                            )
                        );
        
                        if (percentCompleted === 100) {
                            setTimeout(() => {
                                setDownloadList((prev) =>
                                    prev.map((dl) =>
                                        dl.id === file.id ? { ...dl, status: "Completed", showAnimation: false } : dl
                                    )
                                );
                                setDownloadBadge((prev) => Math.max(0, prev - 1));
                            }, 1000);
                        }
                    }
                })
                .then((response) => {
                    // Create a downloadable link
                    const blob = new Blob([response.data], { type: response.headers["content-type"] });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = file.name;
                    a.click();
                    URL.revokeObjectURL(url);

                    setDownloadList((prev) =>
                        prev.map((dl) =>
                            dl.id === file.id ? { ...dl, status: "Completed", showAnimation: false } : dl
                        )
                    );
                })
                .catch(() => {
                    setDownloadList((prev) =>
                        prev.map((dl) =>
                            dl.id === file.id ? { ...dl, status: "Failed", showAnimation: false } : dl
                        )
                    );
                    setDownloadBadge((prev) => Math.max(0, prev - 1));
                });
            } else if (file.type === 'Gmail') {
                axios({
                    method: newDownload.axiosType,
                    url: file.url,
                    // responseType: "blob",
                    onDownloadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
        
                        setDownloadList((prev) =>
                            prev.map((dl) =>
                                dl.id === file.id ? { ...dl, progress: percentCompleted, loaded: progressEvent.loaded } : dl
                            )
                        );
        
                        if (percentCompleted === 100) {
                            setTimeout(() => {
                                setDownloadList((prev) =>
                                    prev.map((dl) =>
                                        dl.id === file.id ? { ...dl, status: "Completed", showAnimation: false } : dl
                                    )
                                );
                                setDownloadBadge((prev) => Math.max(0, prev - 1));
                            }, 1000);
                        }
                    }
                })
                .then((response) => {
                    downloadOriginalGmail(response?.data)
                    setDownloadList((prev) =>
                        prev.map((dl) =>
                            dl.id === file.id ? { ...dl, status: "Completed", showAnimation: false } : dl
                        )
                    );
                })
                .catch(() => {
                    setDownloadList((prev) =>
                        prev.map((dl) =>
                            dl.id === file.id ? { ...dl, status: "Failed", showAnimation: false } : dl
                        )
                    );
                    setDownloadBadge((prev) => Math.max(0, prev - 1));
                });
            } else {
                axios({
                    method: newDownload.axiosType,
                    url: newDownload.url,
                    responseType: newDownload.responseType,
                    data: newDownload.postData,
                    onDownloadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
        
                        setDownloadList((prev) =>
                            prev.map((dl) =>
                                dl.id === file.id ? { ...dl, progress: percentCompleted, loaded: progressEvent.loaded } : dl
                            )
                        );
        
                        if (percentCompleted === 100) {
                            setTimeout(() => {
                                setDownloadList((prev) =>
                                    prev.map((dl) =>
                                        dl.id === file.id ? { ...dl, status: "Completed", showAnimation: false } : dl
                                    )
                                );
                                setDownloadBadge((prev) => Math.max(0, prev - 1));
                            }, 1000);
                        }
                    }
                })
                .then((response) => {
                    // Create a downloadable link
                    const blob = new Blob([response.data], { type: response.headers["content-type"] });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = file.name;
                    a.click();
                    URL.revokeObjectURL(url);
                    setDownloadList((prev) =>
                        prev.map((dl) =>
                            dl.id === file.id ? { ...dl, status: "Completed", showAnimation: false } : dl
                        )
                    );
                })
                .catch(() => {
                    setDownloadList((prev) =>
                        prev.map((dl) =>
                            dl.id === file.id ? { ...dl, status: "Failed", showAnimation: false } : dl
                        )
                    );
                    setDownloadBadge((prev) => Math.max(0, prev - 1));
                });
            }
        // }
    };

    return (
        <DownloadContext.Provider value={{ downloadList, downloadBadge, startDownload }}>
            {children}
        </DownloadContext.Provider>
    );
};

export default DownloadContext;
