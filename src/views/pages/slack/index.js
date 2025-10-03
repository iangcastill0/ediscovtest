import { useNavigate } from 'react-router-dom';
// material-ui
import { Button, Grid, Link, Typography, InputAdornment, OutlinedInput, LinearProgress } from '@mui/material';
import { gridSpacing } from 'store/constant';
import MainCard from 'ui-component/cards/MainCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

// project imports
import WorkspaceCard from 'ui-component/cards/WorkspaceCard';
import { faSlack } from '@fortawesome/free-brands-svg-icons';
import { useEffect, useState } from 'react';
import axios, { SERVER_URL } from 'utils/axios';

// assets
import { IconSearch } from '@tabler/icons';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';

// ==============================|| Slack Team PAGE ||============================== //

const Slack = () => {
    const [teams, setTeams] = useState([]);
    const [filteredTeams, setFilteredTeams] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [reload, setReload] = useState(false);
    const navigate = useNavigate();
    
    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const response = await axios.get('/slack/teams');
            const data = response.data;
            setTeams(data.data || []);
            setFilteredTeams(data.data || []); // Initialize filtered teams with all teams
            setLoading(false);
        }

        fetch();
    }, [reload]);

    useEffect(() => {
        // Filter teams whenever searchTerm changes
        const filtered = teams.filter(team => 
            team.name.toLowerCase().includes(searchTerm.toLowerCase())
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
        <MainCard title="Slack Teams">
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
                                placeholder="Search Teams"
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
                                <Link href={`${SERVER_URL}/slack/install?token=${window.localStorage.getItem('serviceToken')}`} style={{ color: 'white', textDecoration: 'none' }}>
                                    Add Slack Team
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
                            <Link style={{ textAlign: 'left', width: '100%' }} onClick={() => navigate(`/slack/team/${team._id}?name=${team.name}`)}>
                                <WorkspaceCard
                                    primary="Slack"
                                    secondary={team.name}
                                    content={`${team.members.length} members`}
                                    iconPrimary={<FontAwesomeIcon icon={faSlack} />}
                                    color="#3f0e40"
                                    teamId={team._id}
                                    refresh={refresh}
                                    type='Slack'
                                />
                            </Link>
                        </Grid>
                    )) : (
                        <Typography variant='h3' p={2}>
                            {searchTerm ? 'No matching teams found' : 'Please add your workspaces!'}
                        </Typography>
                    )
                }
            </Grid>
        </MainCard>
    );
}

export default Slack;