import { useNavigate } from 'react-router-dom';
// material-ui
import { Button, Grid, Link, Typography, InputAdornment, OutlinedInput, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip, Box } from '@mui/material';
import { gridSpacing } from 'store/constant';
import MainCard from 'ui-component/cards/MainCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// project imports
import WorkspaceCard from 'ui-component/cards/WorkspaceCard';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { useEffect, useState } from 'react';
import axios, { SERVER_URL } from 'utils/axios';

// assets
import { IconSearch } from '@tabler/icons';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import HelpIcon from '@mui/icons-material/Help';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import useAuth from 'hooks/useAuth';

// Copy to clipboard import
import { CopyToClipboard } from 'react-copy-to-clipboard';

const GoogleChannel = () => {
    const [teams, setTeams] = useState([]);
    const [filteredTeams, setFilteredTeams] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [reload, setReload] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    const params = new URLSearchParams(window.location.search);
    const isInstruction = params.get('instruction');

    // Client ID and scopes for domain-wide delegation
    const clientId = '109769041220603285613';
    const scopes = [
        'https://www.googleapis.com/auth/admin.directory.customer.readonly',
        'https://www.googleapis.com/auth/admin.directory.user.readonly',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/admin.reports.audit.readonly',
        'https://www.googleapis.com/auth/admin.reports.usage.readonly'
    ].join(',\n');

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const response = await axios.get('/google/workspaces');
            const data = response.data;
            console.log('data', data.data);
            setTeams(data.data || []);
            setFilteredTeams(data.data || []);
            setLoading(false);
        }

        fetch();

        if (isInstruction === 'true') {
            setOpenDialog(true);
        }
    }, [reload, isInstruction]);

    useEffect(() => {
        // Filter workspaces whenever searchTerm changes
        const filtered = teams.filter(team => 
            team.workspace.displayName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredTeams(filtered);
    }, [searchTerm, teams]);

    const refresh = () => {
        setReload(!reload);
        console.log("Refreshed");
    }

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    }

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    return (
        <MainCard title="Google Workspaces">
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
                                placeholder="Search Workspaces"
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
                                <Button variant="contained" size="large" startIcon={<HelpIcon sx={{color: 'white'}} />} color="primary" onClick={() => setOpenDialog(true)} placeholder='Instruction how to configure domain-wide delegation in google admin console.'>
                                    Help
                                </Button>
                                <Button variant="contained" size="large" startIcon={<AddCircleOutlineOutlinedIcon sx={{color: 'white'}} />} color="primary" sx={{backgroundColor: '#673ab7', marginLeft:'3px'}}>
                                    <Link href={`${SERVER_URL}/google/add-personal?token=${window.localStorage.getItem('serviceToken')}&state=${user?._id}_personal`} style={{ color: 'white', textDecoration: 'none' }}>
                                        Add Personal Account
                                    </Link>
                                </Button>
                                <Button variant="contained" size="large" startIcon={<AddCircleOutlineOutlinedIcon sx={{color: 'white'}} />} color="success" sx={{backgroundColor: '#188038', marginLeft:'3px'}}>
                                    <Link href={`${SERVER_URL}/google/add-organization?token=${window.localStorage.getItem('serviceToken')}&state=${user?._id}_organization`} style={{ color: 'white', textDecoration: 'none' }}>
                                        Add Google workspace
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
                            <Link style={{ textAlign: 'left', width: '100%' }} href='#' onClick={() => navigate(`/google/workspace/${team.workspace._id}?isPersonal=${team.workspace.isPersonal}`)}>
                                <WorkspaceCard
                                    primary={`Google ${team.workspace.isPersonal ? 'Personal Account' : 'Workspace'}`}
                                    secondary={team.workspace.displayName}
                                    content={`${team.users.length} members`}
                                    iconPrimary={<FontAwesomeIcon icon={faGoogle} />}
                                    color="#188038"
                                    teamId={team.workspace._id}
                                    refresh={refresh}
                                    type='Google'
                                    isPersonal={team.workspace.isPersonal}
                                />
                            </Link>
                        </Grid>
                    )) : (
                        <Typography variant='h3' p={2}>
                            {searchTerm ? 'No matching workspaces found' : 'Please add your Google workspace'}
                        </Typography>
                    )
                }
            </Grid>

            {/* Instruction Dialog */}
            <Dialog open={openDialog} onClose={()=>setOpenDialog(true)} fullWidth maxWidth="sm" disableEscapeKeyDown>
                <DialogTitle>
                    Configure Domain-Wide Delegation
                    <IconButton
                        aria-label="close"
                        onClick={handleCloseDialog}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Typography gutterBottom key='1'>
                        To allow this application to back up your Google Workspace data, you need to configure Domain-Wide Delegation manually in your Google Admin Console. This allows the app to access data on behalf of users in your domain.
                    </Typography>
                    <Typography gutterBottom key='2'>
                        <strong>Why configure manually?</strong> <br /> For security reasons, domain-wide delegation can only be granted by a Google Workspace Super Admin in the Admin Console. This ensures that sensitive data is not accessed without explicit authorization.
                    </Typography>
                    <Typography gutterBottom key='3'>
                        <strong>Steps to configure:</strong>
                    </Typography>
                    <ul>
                        <li>Go to your <Link href="https://admin.google.com" target="_blank" rel="noopener noreferrer">Google Admin Console</Link>.</li>
                        <li>Navigate to <em>Security &gt; Access and data control &gt; API Controls &gt; Domain-wide Delegation</em>.</li>
                        <li>Click <strong>"Add new"</strong> and enter the following information:</li>
                    </ul>
                    <Typography key='4'>
                        <strong>Client ID:</strong> {clientId}
                        <CopyToClipboard text={clientId} onCopy={() => alert('Client ID copied!')}>
                            <Tooltip title="Copy to clipboard">
                                <IconButton size="small" >
                                    <ContentCopyIcon />
                                </IconButton>
                            </Tooltip>
                        </CopyToClipboard>
                    </Typography>
                    <Typography key='5'>
                        <strong>Scopes:</strong> {scopes}
                        <CopyToClipboard text={scopes.replace('\n', ',')} onCopy={() => alert('Scopes copied!')}>
                            <Tooltip title="Copy to clipboard">
                                <IconButton size="small">
                                    <ContentCopyIcon />
                                </IconButton>
                            </Tooltip>
                        </CopyToClipboard>
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </MainCard>
    );
}

export default GoogleChannel;