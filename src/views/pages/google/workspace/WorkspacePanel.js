import { useNavigate, useParams } from 'react-router-dom';
// material-ui
import { Grid, Link, LinearProgress } from '@mui/material';
import { gridSpacing } from 'store/constant';
import MainCard from 'ui-component/cards/MainCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

// project imports
import WorkspaceCard from 'ui-component/cards/WorkspaceCard';
import { faEnvelope, faCloud, faMagnifyingGlass, faCalendar, faMessage, faShareNodes, faPeopleGroup } from '@fortawesome/free-solid-svg-icons';
import { useContext, useEffect, useState } from 'react';
import { GoogleGmailContext } from 'contexts/GoogleGmailContext';

// ==============================|| Google Team PAGE ||============================== //

const GooglePanel = () => {
    const [reload, setReload] = useState(false);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const { workspaceId, userId } = useParams();
    const { setGmailData } = useContext(GoogleGmailContext);
    const query = new URLSearchParams(window.location.search);
    const isPersonal = query.get('isPersonal');
    useEffect(() => {
        setLoading(true);

        setGmailData({
            channels: {
                inbox: null,
                sentItems: null,
                drafts: null,
                trash: null,
            }
        });
        setLoading(false);
    }, [workspaceId, userId]);

    const refresh = () => {
        setReload(!reload);
        console.log("Refreshed");
    }

    const goGmail = async () => {
      navigate(`/google/workspace/${workspaceId}/users/${userId}/gmail?isPersonal=${isPersonal}`);
    }

    const goDrive = async () => {
        navigate(`/google/workspace/${workspaceId}/users/${userId}/drive?isPersonal=${isPersonal}`);
    }

    const goCalendar = async () => {
        navigate(`/google/workspace/${workspaceId}/users/${userId}/calendar?isPersonal=${isPersonal}`);
    }

    const goChat = async () => {
        navigate(`/google/workspace/${workspaceId}/users/${userId}/chat?isPersonal=${isPersonal}`);
    }

    const goLogs = async () => {
        navigate(`/google/workspace/${workspaceId}/users/${userId}/logs?isPersonal=${isPersonal}`);
    }

    return (
        <MainCard title="Google Services" backButton>
            <Grid container spacing={gridSpacing} style={{ marginTop: '5px' }}>
                {loading && <Grid item xs={12}><LinearProgress /></Grid>}
                <Grid item xs={12} lg={6}>
                    <Link style={{ textAlign: 'left', width: '100%' }} onClick={goGmail}>
                        <WorkspaceCard
                            primary="Google"
                            secondary="Gmail"
                            iconPrimary={<FontAwesomeIcon icon={faEnvelope} />}
                            color="#188038"
                            refresh={refresh}
                            type='item'
                        />
                    </Link>
                </Grid>
                <Grid item xs={12} lg={6}>
                    <Link style={{ textAlign: 'left', width: '100%' }} onClick={goDrive}>
                        <WorkspaceCard
                            primary="Google"
                            secondary="Drive"
                            iconPrimary={<FontAwesomeIcon icon={faCloud} />}
                            color="#188038"
                            refresh={refresh}
                            type='item'
                        />
                    </Link>
                </Grid>
                {/* <Grid item xs={12} lg={6}>
                    <Link style={{ textAlign: 'left', width: '100%' }} onClick={goCalendar}>
                        <WorkspaceCard
                            primary="Google"
                            secondary="Calendar"
                            iconPrimary={<FontAwesomeIcon icon={faCalendar} />}
                            color="#188038"
                            refresh={refresh}
                            type='Google'
                        />
                    </Link>
                </Grid> */}
                {/* <Grid item xs={12} lg={6}>
                    <Link style={{ textAlign: 'left', width: '100%' }} onClick={goChat}>
                        <WorkspaceCard
                            primary="Google"
                            secondary="Chat"
                            iconPrimary={<FontAwesomeIcon icon={faMessage} />}
                            color="#188038"
                            refresh={refresh}
                            type='Google'
                        />
                    </Link>
                </Grid> */}
                {isPersonal !== 'true' && <Grid item xs={12} lg={6}>
                    <Link style={{ textAlign: 'left', width: '100%' }} onClick={goLogs}>
                        <WorkspaceCard
                            primary="Google"
                            secondary="Logs to Display"
                            iconPrimary={<FontAwesomeIcon icon={faMagnifyingGlass} />}
                            color="#188038"
                            refresh={refresh}
                            type='item'
                        />
                    </Link>
                </Grid>}
            </Grid>
        </MainCard>
    );
}

export default GooglePanel;
