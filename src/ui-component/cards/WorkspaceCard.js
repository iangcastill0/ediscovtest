import PropTypes from 'prop-types';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Card, CardContent, Grid, Typography, useMediaQuery } from '@mui/material';
import AlertDelete from 'ui-component/extended/AlertDelete';
import { refreshTeams, removeSlackWorkspace, removeMS365Workspace, removeGoogleWorkspace } from 'utils/apiHelper';

const WorkspaceCard = ({ primary, secondary, content, iconPrimary, color, teamId, refresh, type, isPersonal }) => {
    const theme = useTheme();
    const matchDownXs = useMediaQuery(theme.breakpoints.down('sm'));

    // State and handlers for the three-dot menu
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [openAlert, setOpenAlert] = React.useState(false);
    const open = Boolean(anchorEl);
    const navigate = useNavigate();
    
    const handleMenuClick = (event) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };
    
    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleCardClick = () => {
        if (type === 'Slack') {
            navigate(`/slack/team/${teamId}?name=${secondary}`, { replace: true });
        } else if (type === 'MS365') {
            navigate(`/ms365/workspace/${teamId}?name=${secondary}`, { replace: true });
        } else if (type === 'Google') {
            navigate(`/google/workspace/${teamId}?isPersonal=${isPersonal}`);
        } else if (type === 'Dropbox') {
            navigate(`/dropbox/workspace/${teamId}?isPersonal=${isPersonal}`);
        } else if (type === 'Box') {
            navigate(`/box/workspace/${teamId}?isPersonal=${isPersonal}`);
        }
    };

    const handleRemove = (e) => {
        e.stopPropagation();
        setOpenAlert(true);
        setAnchorEl(null);
    };

    const handleRefresh = async (e) => {
        e.stopPropagation();
        setAnchorEl(null);
        // await refreshTeams(teamId);
        if (refresh) {
            refresh();
        }
    };

    const handleClose = async (e, del) => {
        e.stopPropagation();
        setOpenAlert(false);
        
        if (del) {
            if (type === 'Slack') {
                const res = await removeSlackWorkspace(teamId);
                console.log("Remove Workspace: ", res);
            } else if (type === 'MS365') {
                const res = await removeMS365Workspace(teamId);
                console.log("Remove MS365 Workspace: ", res);
            } else if (type === 'Google') {
                const res = await removeGoogleWorkspace(teamId);
            }
            if (refresh) {
                refresh();
            }
        }
    };

    return (
        <Card 
            sx={{ 
                background: color, 
                position: 'relative', 
                color: '#fff', 
                width: '100%',
                cursor: 'pointer'
            }}
            onClick={handleCardClick}
        >
            <CardContent>
                {type !== 'item' && (
                    <IconButton 
                        aria-label="more"
                        aria-controls="long-menu"
                        aria-haspopup="true"
                        onClick={handleMenuClick}
                        sx={{
                            position: 'absolute',
                            top: theme.spacing(1),
                            right: theme.spacing(1),
                            color: '#fff',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            }
                        }}
                    >
                        <MoreVertIcon />
                    </IconButton>
                )}
                <Menu
                    id="long-menu"
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleMenuClose}
                    onClick={(e) => e.stopPropagation()}
                    PaperProps={{
                        style: {
                            maxHeight: 48 * 4.5,
                            width: '20ch',
                        },
                    }}
                >
                    <MenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick();
                        handleMenuClose();
                    }}>Open</MenuItem>
                    <MenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleRefresh(e);
                    }}>Refresh</MenuItem>
                    <MenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(e);
                    }}>Remove</MenuItem>
                </Menu>
                <Typography
                    variant="body2"
                    sx={{
                        position: 'absolute',
                        right: 13,
                        top: 38,
                        color: '#fff',
                        '&> svg': { width: 100, height: 100, opacity: '0.5' },
                        [theme.breakpoints.down('sm')]: {
                            top: 13,
                            '&> svg': { width: 80, height: 80 }
                        }
                    }}
                >
                    {iconPrimary}
                </Typography>
                <Grid container direction={matchDownXs ? 'column' : 'row'} spacing={4}>
                    <Grid item xs={12}>
                        <Typography variant="h5" color="inherit">
                            {primary}
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h3" color="inherit">
                            {secondary}
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" color="inherit">
                            {content}
                        </Typography>
                    </Grid>
                </Grid>
            </CardContent>
            {openAlert && (
                <AlertDelete 
                    title={secondary} 
                    open={openAlert} 
                    handleClose={handleClose} 
                />
            )}
        </Card>
    );
};

WorkspaceCard.propTypes = {
    primary: PropTypes.string,
    secondary: PropTypes.string,
    content: PropTypes.string,
    iconPrimary: PropTypes.object,
    color: PropTypes.string,
    teamId: PropTypes.string,
    refresh: PropTypes.func,
    type: PropTypes.string,
    isPersonal: PropTypes.bool
};

export default WorkspaceCard;