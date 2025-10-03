import { useNavigate } from 'react-router-dom';
// material-ui
import { Grid, Link, LinearProgress } from '@mui/material';
import { gridSpacing } from 'store/constant';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

// project imports
import WorkspaceCard from 'ui-component/cards/WorkspaceCard';
import { faSlack, faMicrosoft, faGoogle, faDropbox} from '@fortawesome/free-brands-svg-icons';
import { faBox } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import axios from 'utils/axios';

// ==============================|| SAMPLE PAGE ||============================== //

const Dashboard = () => {
    const [teams, setTeams] = useState([]);
    const [msWorkspaces, setMSWorkspaces] = useState([]);
    const [googleWorkspaces, setGoogleWorkspaces] = useState([]);
    const [dropboxWorkspaces, setDropboxWorkspaces] = useState([]);
    const [boxWorkspaces, setBoxWorkspaces] = useState([]);

    const [loading, setLoading] = useState(false);
    const [reload, setReload] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const response = await axios.get('/slack/teams');
            const data = response.data;
            setTeams(data.data || []);

            const resp = await axios.get('/ms365/workspaces');
            setMSWorkspaces(resp.data?.data || []);

            const respGoogle = await axios.get('/google/workspaces');
            setGoogleWorkspaces(respGoogle.data?.data || []);
            
            const respDropbox = await axios.get('/dropbox/workspaces');
            setDropboxWorkspaces(respDropbox.data?.data || [])

            const respBox = await axios.get('/box/workspaces');
            setBoxWorkspaces(respBox.data?.data || [])
            setLoading(false);
        };

        fetch();
    }, [reload]);

    const refresh = () => {
        setReload(!reload);
    };

    return (
        <>
            {loading && <LinearProgress />}
            <Grid container spacing={gridSpacing}>
                {/* Slack Workspaces */}
                {teams.map((team) => (
                    <Grid item xs={12} sm={6} md={4} key={team._id}>
                        <Link
                            style={{ textAlign: 'left', width: '100%' }}
                            href='#'
                            onClick={() =>
                                navigate(`/slack/team/${team._id}?name=${team.name}`)
                            }
                        >
                            <WorkspaceCard
                                primary="Slack Workspace"
                                secondary={team.name}
                                content={`${team.members.length} members`}
                                iconPrimary={<FontAwesomeIcon icon={faSlack} />}
                                color="#3f0e40"
                                teamId={team._id}
                                refresh={refresh}
                                type="Slack"
                            />
                        </Link>
                    </Grid>
                ))}

                {/* Microsoft 365 Workspaces */}
                {msWorkspaces.map((team) => (
                    <Grid item xs={12} sm={6} md={4} key={team.workspace._id}>
                        <Link
                            style={{ textAlign: 'left', width: '100%' }}
                            onClick={() =>
                                navigate(`/ms365/workspace/${team.workspace._id}?name=${team.workspace.displayName}`)
                            }
                        >
                            <WorkspaceCard
                                primary="Microsoft365 Workspace"
                                secondary={team.workspace.displayName}
                                content={`${team.users.length} members`}
                                iconPrimary={<FontAwesomeIcon icon={faMicrosoft} />}
                                color="#00a1f1"
                                teamId={team.workspace._id}
                                refresh={refresh}
                                type="MS365"
                            />
                        </Link>
                    </Grid>
                ))}

                {/* Google Workspaces */}
                {googleWorkspaces.map((team) => (
                    <Grid item xs={12} sm={6} md={4} key={team.workspace._id}>
                        <Link
                            style={{ textAlign: 'left', width: '100%' }}
                            onClick={() =>
                                navigate(
                                    `/google/workspace/${team.workspace._id}?isPersonal=${team.workspace.isPersonal}`
                                )
                            }
                        >
                            <WorkspaceCard
                                primary={`Google ${team.workspace.isPersonal ? 'Personal Account' : 'Workspace'}`}
                                secondary={team.workspace.displayName}
                                content={`${team.users.length} members`}
                                iconPrimary={<FontAwesomeIcon icon={faGoogle} />}
                                color="#188038"
                                teamId={team.workspace._id}
                                refresh={refresh}
                                type="Google"
                                isPersonal={team.workspace.isPersonal}
                            />
                        </Link>
                    </Grid>
                ))}

                {/* Dropbox Workspaces */}
                {dropboxWorkspaces.map((team) => (
                    <Grid item xs={12} sm={6} md={4} key={team.workspace._id}>
                        <Link
                            style={{ textAlign: 'left', width: '100%' }}
                            onClick={() =>
                                navigate(
                                    `/dropbox/workspace/${team.workspace._id}?isPersonal=${team.workspace.isPersonal}`
                                )
                            }
                        >
                            <WorkspaceCard
                                primary={`Dropbox ${team.workspace.isPersonal ? 'Personal Account' : 'Workspace'}`}
                                secondary={team.workspace.displayName}
                                content={`${team.users.length} members`}
                                iconPrimary={<FontAwesomeIcon icon={faDropbox} />}
                                color="#0061ff"
                                teamId={team.workspace._id}
                                refresh={refresh}
                                type="Dropbox"
                                isPersonal={team.workspace.isPersonal}
                            />
                        </Link>
                    </Grid>
                ))}

                {/* Box Workspaces */}
                {boxWorkspaces.map((team) => (
                    <Grid item xs={12} sm={6} md={4} key={team.workspace._id}>
                        <Link
                            style={{ textAlign: 'left', width: '100%' }}
                            onClick={() =>
                                navigate(
                                    `/box/workspace/${team.workspace._id}?isPersonal=${team.workspace.isPersonal}`
                                )
                            }
                        >
                            <WorkspaceCard
                                primary={`Box ${team.workspace.isPersonal ? 'Personal Account' : 'Workspace'}`}
                                secondary={team.workspace.displayName}
                                content={`${team.users.length} members`}
                                iconPrimary={<FontAwesomeIcon icon={faBox} />}
                                color="#0061d5"
                                teamId={team.workspace._id}
                                refresh={refresh}
                                type="Box"
                                isPersonal={team.workspace.isPersonal}
                            />
                        </Link>
                    </Grid>
                ))}
            </Grid>
        </>
    );
};

export default Dashboard;
