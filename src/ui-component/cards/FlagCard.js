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
import axios from 'utils/axios';

const FlagCard = ({ primary, secondary, content, iconPrimary, refresh, color, id }) => {
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
        navigate(`/flagged-collections/${id}?name=${secondary}&color=${color}`, { replace: true });
    };

    const handleRemove = (e) => {
        e.stopPropagation();
        setOpenAlert(true);
        setAnchorEl(null);
    };

    const handleRefresh = async (e) => {
        e.stopPropagation();
        setAnchorEl(null);
    };

    const handleClose = async (e, del) => {
        e.stopPropagation();
        setOpenAlert(false);
        
        if (del) {
            await axios.delete(`/flagged-collections/remove/${id}`);
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
                {/* {type !== 'item' && ( */}
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
                {/* )} */}
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
                    {/* <MenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleRefresh(e);
                    }}>Refresh</MenuItem> */}
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

FlagCard.propTypes = {
    primary: PropTypes.string,
    secondary: PropTypes.string,
    content: PropTypes.string,
    iconPrimary: PropTypes.object,
    refresh: PropTypes.func,
    color: PropTypes.string,
    id: PropTypes.string,
};

export default FlagCard;