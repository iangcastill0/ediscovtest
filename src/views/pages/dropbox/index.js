import { useNavigate } from 'react-router-dom';
// material-ui
import { Button, Grid, Link, Typography, InputAdornment, OutlinedInput, LinearProgress, Box } from '@mui/material';
import { gridSpacing } from 'store/constant';
import MainCard from 'ui-component/cards/MainCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// project imports
import WorkspaceCard from 'ui-component/cards/WorkspaceCard';
import { faDropbox } from '@fortawesome/free-brands-svg-icons';
import { useEffect, useState } from 'react';
import axios, { SERVER_URL } from 'utils/axios';
import useAuth from 'hooks/useAuth';

// assets
import { IconSearch } from '@tabler/icons';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';

const Dropbox = () => {
    const [teams, setTeams] = useState([]);
    const [filteredTeams, setFilteredTeams] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [reload, setReload] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();
    
    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const response = await axios.get('/dropbox/workspaces');
            const data = response.data;
            console.log('data', data.data);
            setTeams(data.data || []);
            setFilteredTeams(data.data || []);
            setLoading(false);
        }

        fetch();
    }, [reload]);

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

    return (
        <MainCard>
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
                            <Button variant="contained" size="large" startIcon={<AddCircleOutlineOutlinedIcon />}>
                                <Link href={`${SERVER_URL}/dropbox/add-personal?token=${window.localStorage.getItem('serviceToken')}`} style={{ color: 'white', textDecoration: 'none' }}>
                                    Add Dropbox Personal Account
                                </Link>
                            </Button>
                        </Grid>
                        <Grid item>
                            <Button variant="contained" size="large" color='secondary' startIcon={<AddCircleOutlineOutlinedIcon />}>
                                <Link href={`${SERVER_URL}/dropbox/add-team?token=${window.localStorage.getItem('serviceToken')}`} style={{ color: 'white', textDecoration: 'none' }}>
                                    Add Dropbox Team Account
                                </Link>
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            <Grid container spacing={gridSpacing} style={{ marginTop: '10px' }}>
                {loading && <Grid item xs={12}><LinearProgress /></Grid>}
                {
                    filteredTeams.length ? filteredTeams.map((team, idx) => (
                        <Grid item xs={12} lg={6} key={idx}>
                            <Box onClick={() => navigate(`/dropbox/workspace/${team.workspace._id}?name=${team.workspace.displayName}&isPersonal=${team.workspace.isPersonal}`)} sx={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}>
                                <WorkspaceCard
                                    primary={`Dropbox ${team.workspace.isPersonal ? 'Personal Account' : 'Workspace'}`}
                                    secondary={team.workspace.displayName}
                                    content={`${team.users.length} members`}
                                    iconPrimary={<FontAwesomeIcon icon={faDropbox} />}
                                    color="#0061ff"
                                    teamId={team.workspace._id}
                                    refresh={refresh}
                                    type='Dropbox'
                                    isPersonal={team.workspace.isPersonal}
                                />
                            </Box>
                        </Grid>
                    )) : (
                        <Typography variant='h3' p={2}>
                            {searchTerm ? 'No matching Dropbox accounts found' : 'Please add your Dropbox account'}
                        </Typography>
                    )
                }
            </Grid>
        </MainCard>
    );
}

export default Dropbox;