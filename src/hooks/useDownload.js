
import { useContext } from "react";
import DownloadContext from 'contexts/DownloadContext'

const useDownload = () => {
    return useContext(DownloadContext);
};

export default useDownload;