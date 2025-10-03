import { useNavigate } from 'react-router-dom';
import { Button, Grid, Link, Typography, InputAdornment, OutlinedInput, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip, Box, TextField } from '@mui/material';
import { gridSpacing } from 'store/constant';
import MainCard from 'ui-component/cards/MainCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import WorkspaceCard from 'ui-component/cards/WorkspaceCard';
import { faBox } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import axios, { SERVER_URL } from 'utils/axios';
import { IconSearch } from '@tabler/icons';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import HelpIcon from '@mui/icons-material/Help';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import useAuth from 'hooks/useAuth';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { openSnackbar } from 'store/slices/snackbar'
import { useDispatch } from 'store'

const BoxChannel = () => {
    const [teams, setTeams] = useState([]);
    const [filteredTeams, setFilteredTeams] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [reload, setReload] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [clientId, setClientId] = useState('');
    const [enterpriseIdInput, setEnterpriseIdInput] = useState('');
    const navigate = useNavigate();
    const { user } = useAuth();
    const dispatch = useDispatch();

    const params = new URLSearchParams(window.location.search);
    const isInstruction = params.get('instruction');
    const installSuccess = params.get('install_success');

    const fetchWorkspaces = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/box/workspaces');
            const data = response.data;
            setTeams(data.data || []);
            setFilteredTeams(data.data || []);
            setClientId(data.clientId);
        } catch (error) {
            console.error("Failed to fetch Box workspaces:", error);
            setTeams([]);
            setFilteredTeams([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkspaces();

        if (isInstruction === 'true' && !openDialog) {
            setOpenDialog(true);
        }
    }, [isInstruction, openDialog, reload]);

    useEffect(() => {
        if (installSuccess === 'true') {
            fetchWorkspaces();
            navigate('/box', { replace: true });
        }
    }, [installSuccess, navigate]);

    useEffect(() => {
        const filtered = teams.filter(team =>
            team.workspace.displayName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredTeams(filtered);
    }, [searchTerm, teams]);

    const refresh = () => {
        setReload(prev => !prev);
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleCloseDialog = async () => {
        if (!enterpriseIdInput) {
            dispatch(openSnackbar({
                open: true,
                message: 'Please input Entperprise ID',
                variant: 'alert',
                alert: {
                    color: 'warning'
                },
                close: true
            }));

            return
        }
        // install enterprise account
        const res = await axios.get(`/box/install-enterprise/${enterpriseIdInput}`)
        console.log(res)
        setOpenDialog(false);
    };

    return (
        <MainCard title="Box Workspaces">
            <Grid container spacing={gridSpacing}>
                <Grid
                    className="block"
                    item
                    xs
                    zeroMinWidth
                    sx={{ display: 'flex' }}
                >
                    <Grid container alignItems="center" spacing={gridSpacing}>
                        <Grid item xs zeroMinWidth>
                            <OutlinedInput
                                id="input-search-card-style1"
                                placeholder="Search Box Workspaces"
                                fullWidth
                                value={searchTerm}
                                onChange={handleSearchChange}
                                startAdornment={
                                    <InputAdornment position="start">
                                        <IconSearch stroke={1.5} size="16px" />
                                    </InputAdornment>
                                }
                            />
                        </Grid>
                        <Grid item>
                            <Box>
                                <Button variant="contained" size="large" startIcon={<HelpIcon sx={{ color: 'white' }} />} color="primary" onClick={() => setOpenDialog(true)}>
                                    Help
                                </Button>
                                <Button variant="contained" size="large" startIcon={<AddCircleOutlineOutlinedIcon sx={{ color: 'white' }} />} color="secondary" sx={{ backgroundColor: '#673ab7', marginLeft: '3px' }}>
                                    <Link href={`${SERVER_URL}/box/install-personal?token=${window.localStorage.getItem('serviceToken')}&state=${user?._id}_personal`} style={{ color: 'white', textDecoration: 'none' }}>
                                        Install Personal App
                                    </Link>
                                </Button>
                                <Button variant="contained" size="large" startIcon={<AddCircleOutlineOutlinedIcon sx={{ color: 'white' }} />} color="success" sx={{ backgroundColor: '#0070c7', marginLeft: '3px' }}>
                                    <Link href={`${SERVER_URL}/box/install-enterprise?token=${window.localStorage.getItem('serviceToken')}&state=${user?._id}_enterprise`} style={{ color: 'white', textDecoration: 'none' }}>
                                        Install Enterprise App
                                    </Link>
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            <Grid container spacing={gridSpacing} style={{ marginTop: '10px' }}>
                {loading && <Grid item xs={12}><LinearProgress /></Grid>}
                {
                    filteredTeams.length ? filteredTeams.map((team, idx) => (
                        <Grid item xs={12} lg={6} key={idx}>
                            <WorkspaceCard
                                primary={`Box Workspace`}
                                secondary={team.workspace.displayName}
                                content={`${team.users.length} members`}
                                iconPrimary={<FontAwesomeIcon icon={faBox} />}
                                color="#0070c7"
                                teamId={team.workspace._id}
                                isPersonal={team.workspace.isPersonal}
                                refresh={refresh}
                                type='Box'
                            />
                        </Grid>
                    )) : (
                        <Typography variant='h3' p={2}>
                            {searchTerm ? 'No matching workspaces found' : 'Please install a Box app to get started'}
                        </Typography>
                    )
                }
            </Grid>
            <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm" disableEscapeKeyDown>
                <DialogTitle>
                    Authorize Box Enterprise App
                    <IconButton aria-label="close" onClick={handleCloseDialog} sx={{ position: 'absolute', right: 8, top: 8 }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Typography gutterBottom>
                        To install this application for an entire enterprise, a Box admin must authorize it in the **Admin Console**. This process securely grants the necessary permissions for the app to access all user data.
                    </Typography>
                    ---
                    <Typography variant="h6" gutterBottom>
                        Steps for the Box Enterprise Admin:
                    </Typography>
                    <Typography gutterBottom>1. Log in to your Box account with an **Admin** or **Co-Admin** role.</Typography>
                    <Typography gutterBottom>2. Navigate to the **Admin Console**.</Typography>
                    <Typography gutterBottom>{`3. Go to **Integrations** > **Platform Apps Manager**.`}</Typography>
                    <Typography gutterBottom>4. Click the **"Add App"** button (or the "+" button) and paste the **Client ID** below.</Typography>
                    <Typography gutterBottom>5. Review the requested permissions (scopes) and click **"Authorize"** to complete the installation.</Typography>
                    ---
                    <Typography gutterBottom>
                        **Client ID:** {clientId}
                        <CopyToClipboard text={clientId} onCopy={() => alert('Client ID copied!')}>
                            <Tooltip title="Copy to clipboard">
                                <IconButton size="small">
                                    <ContentCopyIcon />
                                </IconButton>
                            </Tooltip>
                        </CopyToClipboard>
                    </Typography>
                    ---
                    <Typography variant="h4" gutterBottom>
                        Enter your Enterprise ID after authorizing
                    </Typography>
                    <TextField
                        fullWidth
                        label="Enterprise ID"
                        variant="outlined"
                        value={enterpriseIdInput}
                        onChange={(e) => setEnterpriseIdInput(e.target.value)}
                        helperText="You can find your Enterprise ID in the Admin Console under 'Account & Billing'."
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">
                        Done
                    </Button>
                </DialogActions>
            </Dialog>
        </MainCard>
    );
};

export default BoxChannel;