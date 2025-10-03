import { useNavigate, useParams } from 'react-router-dom';
// material-ui
import { Grid, Link, LinearProgress } from '@mui/material';
import { gridSpacing } from 'store/constant';
import MainCard from 'ui-component/cards/MainCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

// project imports
import WorkspaceCard from 'ui-component/cards/WorkspaceCard';
import { faEnvelope, faCloud, faMagnifyingGlass, faShareNodes, faPeopleGroup } from '@fortawesome/free-solid-svg-icons';
import { useContext, useEffect, useState } from 'react';
import { MSOutlookContext } from 'contexts/MSOutlookContext';
import { MSOnedriveContext } from 'contexts/MSOnedriveContext';
import { MSSharepointContext } from 'contexts/MSSharepointContext';
import { MSTeamsContext } from 'contexts/MSTeamsContext';

// ==============================|| Ms365 Team PAGE ||============================== //

const Ms365Panel = () => {
    const [reload, setReload] = useState(false);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const { workspaceId, userId } = useParams();
    const { setOutlookData } = useContext(MSOutlookContext);
    const { setOnedriveData } = useContext(MSOnedriveContext);
    const { setSharepointData } = useContext(MSSharepointContext);
    const { setTeamsData } = useContext(MSTeamsContext);

    useEffect(() => {
        setLoading(true);

        // Initialize context data of ms365
        setOutlookData({
            channels: {
                inbox: null,
                sentItems: null,
                drafts: null,
                trash: null,
                audits: [],
                devices: [],
            }
        });
        setOnedriveData({
            channels: {
                my_files: [],
                folders: [],
                deltaLog: [],
                activitiesLog: [],
                sharedWithMe: []
            },
            versionHistory: [],
            fileInfo: [],
        });
        setSharepointData({
            channels: {
              sites: [],
            },
            rootFiles: [],
            Lists: [],
            groups: [],
            conversationList: [],
        });
        setTeamsData({
            channels: {
                teams: [],
                chatList: [],
                calendarList: [],
                inbox: [],
                sent_items: [],
                sites: [],
                my_files: [],
            },
            versionHistory: [],
            JsonOfTeam: {},
            dataOfMsg: [],
        });
        setLoading(false);
    }, [workspaceId, userId]);

    const refresh = () => {
        setReload(!reload);
        console.log("Refreshed");
    }

    const goOutlook = async () => {
        // window.location.href = `${SERVER_URL}/ms365/acquireToken`;
        navigate(`/ms365/${workspaceId}/users/${userId}/outlook`);
    }

    const goOnedrive = async () => {
        // window.location.href = `${SERVER_URL}/ms365/acquireTokenOnedrive`;
        navigate(`/ms365/${workspaceId}/users/${userId}/onedrive`);
    }

    const goMsLogs = async () => {
        // window.location.href = `${SERVER_URL}/ms365/acquireTokenMslogs`;
        navigate(`/ms365/users/${userId}/mslogs`);
    }

    const goSharePoint = async () => {
        // window.location.href = `${SERVER_URL}/ms365/acquireTokenSharepoint`;
        alert('It will be available soon.')

        // navigate(`/ms365/users/${userId}/sharepoint`);
    }

    const goTeams = async () => {
        // window.location.href = `${SERVER_URL}/ms365/acquireTokenTeams`;
        // alert('It will be available soon.')
        navigate(`/ms365/users/${userId}/teams`);
    }

    return (
        <MainCard title="Microsoft Services" backButton>
            <Grid container spacing={gridSpacing} style={{ marginTop: '5px' }}>
                {loading && <Grid item xs={12}><LinearProgress /></Grid>}
                <Grid item xs={12} lg={6}>
                    <Link style={{ textAlign: 'left', width: '100%' }} onClick={goOutlook}>
                        <WorkspaceCard
                            primary="Microsoft 365"
                            secondary="Outlook"
                            iconPrimary={<FontAwesomeIcon icon={faEnvelope} />}
                            color="#0f6cbd"
                            refresh={refresh}
                            type='item'
                        />
                    </Link>
                </Grid>
                <Grid item xs={12} lg={6}>
                    <Link style={{ textAlign: 'left', width: '100%' }} onClick={goOnedrive}>
                        <WorkspaceCard
                            primary="Microsoft 365"
                            secondary="OneDrive"
                            iconPrimary={<FontAwesomeIcon icon={faCloud} />}
                            color="#0f6cbd"
                            refresh={refresh}
                            type='item'
                        />
                    </Link>
                </Grid>
                {/* <Grid item xs={12} lg={6}>
                    <Link style={{ textAlign: 'left', width: '100%' }} onClick={goSharePoint}>
                        <WorkspaceCard
                            primary="Microsoft 365"
                            secondary="SharePoint"
                            iconPrimary={<FontAwesomeIcon icon={faShareNodes} />}
                            color="#0f6cbd"
                            refresh={refresh}
                            type='MS365'
                        />
                    </Link>
                </Grid>
                <Grid item xs={12} lg={6}>
                    <Link style={{ textAlign: 'left', width: '100%' }} onClick={goTeams}>
                        <WorkspaceCard
                            primary="Microsoft 365"
                            secondary="Teams"
                            iconPrimary={<FontAwesomeIcon icon={faPeopleGroup} />}
                            color="#0f6cbd"
                            refresh={refresh}
                            type='MS365'
                        />
                    </Link>
                </Grid> */}
                <Grid item xs={12} lg={6}>
                    <Link style={{ textAlign: 'left', width: '100%' }} onClick={goMsLogs}>
                        <WorkspaceCard
                            primary="Microsoft 365"
                            secondary="Logs to Display"
                            iconPrimary={<FontAwesomeIcon icon={faMagnifyingGlass} />}
                            color="#0f6cbd"
                            refresh={refresh}
                            type='item'
                        />
                    </Link>
                </Grid>
            </Grid>
        </MainCard>
    );
}

export default Ms365Panel;
