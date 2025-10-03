import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
    Avatar,
    Box,
    Button,
    Card,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    InputAdornment,
    OutlinedInput,
    Popper,
    Checkbox,
    FormControlLabel,
    TextField,
    CircularProgress,
    MenuItem
} from '@mui/material';
import { useTheme, styled } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import PopupState, { bindPopper, bindToggle } from 'material-ui-popup-state';
import { IconAdjustmentsHorizontal, IconSearch, IconX } from '@tabler/icons';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSlack, faMicrosoft, faGoogle, faDropbox } from '@fortawesome/free-brands-svg-icons';
import Transitions from 'ui-component/extended/Transitions';
import { applyArchive, formatSizeUnits, getArchive } from 'utils/apiHelper';
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import ExpandCircleDownIcon from '@mui/icons-material/ExpandCircleDown';
import Tooltip from '@mui/material/Tooltip';

const PopperStyle = styled(Popper)(({ theme }) => ({
    zIndex: 1100,
    width: '99%',
    top: '-55px !important',
    padding: '0 12px',
    [theme.breakpoints.down('sm')]: {
        padding: '0 10px'
    }
}));

const OutlineInputStyle = styled(Paper)(({ theme }) => ({
    width: 434,
    marginLeft: 16,
    paddingLeft: 8,
    paddingRight: 8,
    display: 'flex', 
    alignItems: 'center', 
    boxShadow: 'rgba(0, 0, 0, 0.2) 0px 2px 1px -1px, rgba(0, 0, 0, 0.14) 0px 1px 1px 0px, rgba(0, 0, 0, 0.12) 0px 1px 3px 0px',
    '& input': {
        background: 'transparent !important',
        paddingLeft: '4px !important'
    },
    [theme.breakpoints.down('lg')]: {
        width: 250
    },
    [theme.breakpoints.down('md')]: {
        width: '100%',
        marginLeft: 4,
        background: theme.palette.mode === 'dark' ? theme.palette.dark[800] : '#fff'
    }
}));

const HeaderAvatarStyle = styled(Avatar)(({ theme }) => ({
    ...theme.typography.commonAvatar,
    ...theme.typography.mediumAvatar,
    background: theme.palette.mode === 'dark' ? theme.palette.dark.main : theme.palette.secondary.light,
    color: theme.palette.mode === 'dark' ? theme.palette.secondary.main : theme.palette.secondary.dark,
    '&:hover': {
        background: theme.palette.mode === 'dark' ? theme.palette.secondary.main : theme.palette.secondary.dark,
        color: theme.palette.mode === 'dark' ? theme.palette.secondary.light : theme.palette.secondary.light
    }
}));

const AdvancedSearchDialog = ({ open, onClose, onSubmit, value, setValue }) => {
    const theme = useTheme();
    const [archives, setArchives] = useState([]);
    const [selectedArchives, setSelectedArchives] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({ start: null, end: null });
    const [emailFilters, setEmailFilters] = useState({ from: '', to: '' });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await getArchive();
            setArchives(data || []);
            setLoading(false);
        };
        if (open)
            fetchData();
    }, [open]);

    const handleArchiveSelect = (event) => {
        setSelectedArchives(event.target.value);
    };

    const renderArchives = () => {
        const options = archives.flatMap((archive) =>
            archive.archives.map((item) => ({
                id: item.id,
                label: `${archive.name}: ${
                    archive.type === 'Slack'
                        ? item.email || 'No Email'
                        : item.filters?.jobName || 'No Job Title'
                }   (${item.backedAt || item.createdAt})`
            }))
        );

        return (
            <TextField
                select
                SelectProps={{
                    multiple: true,
                    native: false,
                    value: selectedArchives,
                    onChange: handleArchiveSelect,
                    renderValue: (selected) =>
                        selected
                            .map((id) =>
                                options.find((option) => option.id === id)?.label || ''
                            )
                            .join(', '),
                }}
                label="Select Archives"
                fullWidth
                variant="outlined"
            >
                {options.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                        {option.label}
                    </MenuItem>
                ))}
            </TextField>
        );
    };

    const handleSubmit = () => {
        onSubmit({ keywords: value, dateRange, emailFilters, selectedArchives });
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Advanced Search</DialogTitle>
            <DialogContent>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Keywords"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            fullWidth
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <DatePicker
                                label="Start Date"
                                value={dateRange.start}
                                onChange={(date) =>
                                    setDateRange((prev) => ({ 
                                        ...prev, 
                                        start: date
                                    }))
                                }
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                            <DatePicker
                                label="End Date"
                                value={dateRange.end}
                                onChange={(date) =>
                                    setDateRange((prev) => ({ 
                                        ...prev, 
                                        end: date
                                    }))
                                }
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="From (Email)"
                                value={emailFilters.from}
                                onChange={(e) =>
                                    setEmailFilters((prev) => ({ ...prev, from: e.target.value }))
                                }
                                fullWidth
                            />
                            <TextField
                                label="To (Email)"
                                value={emailFilters.to}
                                onChange={(e) =>
                                    setEmailFilters((prev) => ({ ...prev, to: e.target.value }))
                                }
                                fullWidth
                            />
                        </Box>
                        {renderArchives()}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="secondary">
                    Cancel
                </Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );
};

AdvancedSearchDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired,
    setValue: PropTypes.func.isRequired
};

const SearchSection = () => {
    const theme = useTheme();
    const [value, setValue] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const navigate = useNavigate();

    const handleSearch = () => {
        if (value.trim()) {
            navigate(`/search?q=${value}&type=all`, { replace: true, state: { forceRefresh: true } });
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    };

    const handleAdvancedSearchSubmit = (data) => {
        console.log('Advanced Search Data:', data);
        let parameterText = `q=${data.keywords}`;
        if (data.dateRange.start) {
            parameterText += `&start=${data.dateRange.start.toLocaleDateString('en-CA')}`;
        }
        if (data.dateRange.end) {
            parameterText += `&end=${data.dateRange.end.toLocaleDateString('en-CA')}`;
        }
        if (data.emailFilters.from !== '') {
            parameterText += `&from=${data.emailFilters.from}`;
        }
        if (data.emailFilters.to !== '') {
            parameterText += `&to=${data.emailFilters.to}`;
        }
        if (data.selectedArchives.length) {
            parameterText += `&archives=${data.selectedArchives.join(',')}`;
        }
        parameterText += `&type=all`;
        navigate(`/search?${parameterText}`, { replace: true, state: { forceRefresh: true } });
    };

    return (
        <Box>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <OutlineInputStyle
                    component="form"
                    onSubmit={(e) => {
                        e.preventDefault(); // Prevent default form submission
                        handleSearch();
                    }}
                >
                    <InputBase
                        sx={{ ml: 1, flex: 1 }}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search content across all archives"
                        inputProps={{ 'aria-label': 'search content across all archives' }}
                    />
                    <Tooltip title="Search">
                        <IconButton type="button" color="primary" sx={{ p: '10px' }} aria-label="search" onClick={handleSearch}>
                            <SearchIcon />
                        </IconButton>
                    </Tooltip>
                    <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                    <Tooltip title="Advanced Search">
                        <IconButton color="primary" sx={{ p: '10px' }} aria-label="expand" onClick={() => setDialogOpen(true)}>
                            <ExpandCircleDownIcon />
                        </IconButton>
                    </Tooltip>
                </OutlineInputStyle>
            </Box>
            <AdvancedSearchDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSubmit={handleAdvancedSearchSubmit}
                value={value}
                setValue={setValue}
            />
        </Box>
    );
};

export default SearchSection;
