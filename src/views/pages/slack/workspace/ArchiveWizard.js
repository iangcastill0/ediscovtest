import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogContent, DialogActions, Button, Step, StepLabel, Stepper, TextField, Box, Typography, List, ListItem, ListItemText, CircularProgress, Autocomplete, FormControlLabel, Checkbox } from '@mui/material';
import { archiveSlackJob } from 'utils/apiHelper';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers';
import axiosServices from 'utils/axios';
import { formatSizeUnits } from 'utils/utils';

const ArchiveWizard = ({ workspaceId, open, onClose, users, onArchived, onError }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [validationErrors, setValidationErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        jobName: '',
        user: [],
        userEmail: [],
        keywords: '',
        filterByDateRange: false,
        dateRange: { start: new Date(), end: new Date() },
    });
    const [filteredCounts, setFilteredCounts] = useState({});
    const [fetchError, setFetchError] = useState(null);
    const [isArchiving, setIsArchiving] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);

    const clear = () => {
        setFilters({
            jobName: '',
            user: [],
            userEmail: [],
            keywords: '',
            filterByDateRange: false,
            dateRange: { start: new Date(), end: new Date() },
        });
        setFilteredCounts({});
        setFetchError(null);
        setIsArchiving(false);
        setSelectedUsers([]);
        
    };

    const validateInputs = () => {
        const errors = {};
        if (!filters.jobName) {
            errors.jobName = 'Job Name is required';
        }
        if (!filters.user.length) {
            errors.user = 'Users are required';
        }
        // if (!filters.keywords) {
        //     errors.keywords = 'Keywords are required';
        // }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const fetchSlackCounts = async (userId) => {
        try {
            console.log(filters.filterByDateRange)
            const response = await axiosServices.get(`/slack/team/${workspaceId}/counts`, {
                params: {
                    userId,
                    keywords: filters.keywords,
                    startDate: filters.filterByDateRange ? filters.dateRange.start.toLocaleDateString() : undefined,
                    endDate: filters.filterByDateRange ? filters.dateRange.end.toLocaleDateString() : undefined
                },
            });
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching data for Slack:`, error);
            setFetchError(`Failed to fetch data from Slack API. Please try again.`);
            return 0;
        }
    };

    const fetchFilteredData = async () => {
        setLoading(true);
        const counts = {};
        try {
            for (const user of selectedUsers) {
                const count = await fetchSlackCounts(user.id);
                counts[user.email] = count;
            }
            setFilteredCounts(counts);
            setFetchError(null);
        } catch (error) {
            setFetchError('Failed to fetch data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleNext = async () => {
        if (activeStep === 0 && !validateInputs()) {
            return; // prevent moving to the next step if validation fails
        }
        if (activeStep === 0) {
            await fetchFilteredData();
        }
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleUserChange = (event, values) => {
        setSelectedUsers(values);
        setFilters({
            ...filters,
            user: values,
            userEmail: values ? values.map((user) => user.email) : [],
        });
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleArchive = async () => {
        setIsArchiving(true);
        try {
            for (const user of selectedUsers) {
                const data = filteredCounts[user.email];
                if (data.totalItems > 0) {
                    await archiveSlackJob(workspaceId, { ...filters, user: [user], userEmail: [user.email] }, data);
                }
            }
            onClose();
            clear();
            onArchived();
            setActiveStep(0);
        } catch (error) {
            console.error('Error archiving job:', error);
            onError();
        }
        setIsArchiving(false);
    };

    const handleFilterByDate = (event) => {
        setFilters({ ...filters, filterByDateRange: event.target.checked });
    };

    const handleChange = (event) => {
        setFilters({ ...filters, [event.target.name]: event.target.value });
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogContent>
                <Stepper activeStep={activeStep}>
                    <Step>
                        <StepLabel>Filter Criteria</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Review & Confirm</StepLabel>
                    </Step>
                </Stepper>
                {activeStep === 0 && (
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            label="Job Name"
                            value={filters.jobName}
                            onChange={handleChange}
                            name="jobName"
                            error={!!validationErrors.jobName}
                            helperText={validationErrors.jobName || ''}
                            fullWidth
                            sx={{ mb: 2 }}
                        />
                        <Autocomplete
                            multiple
                            value={selectedUsers}
                            options={users}
                            getOptionLabel={(option) => option.name}
                            renderInput={(params) => (
                                <TextField {...params} label="Users" error={!!validationErrors.user} helperText={validationErrors.user || ''} />
                            )}
                            onChange={handleUserChange}
                            fullWidth
                        />
                        <TextField
                            label="Keywords"
                            value={filters.keywords}
                            onChange={handleChange}
                            name="keywords"
                            error={!!validationErrors.keywords}
                            helperText={validationErrors.keywords || ''}
                            fullWidth
                            sx={{ mt: 2 }}
                        />
                        <FormControlLabel
                                control={<Checkbox checked={filters.filterByDateRange} onChange={handleFilterByDate} color='primary' />}
                                label="Filter by Date Range"
                        />
                        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    renderInput={(props) => <TextField {...props} fullWidth helperText="" />}
                                    label="Start Date"
                                    value={filters.dateRange.start}
                                    onChange={(newValue) => {
                                        setFilters({ ...filters, dateRange: { ...filters.dateRange, start: newValue } });
                                    }}
                                    disabled={!filters.filterByDateRange}
                                />
                            </LocalizationProvider>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    renderInput={(props) => <TextField {...props} fullWidth helperText="" />}
                                    label="End Date"
                                    value={filters.dateRange.end}
                                    onChange={(newValue) => {
                                        setFilters({ ...filters, dateRange: { ...filters.dateRange, end: newValue } });
                                    }}
                                    disabled={!filters.filterByDateRange}
                                />
                            </LocalizationProvider>
                        </Box>  
                    </Box>
                )}
                {activeStep === 1 && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h4" gutterBottom>
                            Review Filter Criteria
                        </Typography>
                        <List component="nav" aria-label="filter criteria">
                            <ListItem>
                                <ListItemText primary="Job Name" secondary={filters.jobName || 'None'} />
                            </ListItem>
                            <ListItem>
                                <ListItemText
                                    primary="Users"
                                    secondary={filters.user.length ? filters.user.map((user) => user.name).join(', ') : 'Not selected'}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Keywords" secondary={filters.keywords || 'None'} />
                            </ListItem>
                            {Object.keys(filteredCounts).length > 0 && (
                                <>
                                    <Typography variant="h6" gutterBottom>
                                        Filtered Counts
                                    </Typography>
                                    {Object.entries(filteredCounts).map(([userEmail, data]) => (
                                        <ListItem key={userEmail}>
                                            <ListItemText primary={userEmail} secondary={`Total Count: ${data.totalItems}, Estimate Size: ${formatSizeUnits(data.fileSize + data.estimateMsgSize)}`} />
                                        </ListItem>
                                    ))}
                                </>
                            )}
                        </List>
                        {fetchError && (
                            <Typography color="error" sx={{ mb: 2 }}>
                                {fetchError}
                            </Typography>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleBack} disabled={activeStep === 0}>
                    Back
                </Button>
                {activeStep === 0 && (loading ? <CircularProgress size={30} /> : <Button onClick={handleNext}>Next</Button>)}
                {activeStep === 1 && (
                    <Button onClick={handleArchive} disabled={isArchiving || Object.entries(filteredCounts).filter(([userEmail, data]) => data.totalItems > 0).length === 0}>
                        Archive
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

ArchiveWizard.propTypes = {
    workspaceId: PropTypes.string.isRequired,
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func,
    users: PropTypes.arrayOf(PropTypes.object).isRequired,
    onArchived: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired,
};

export default ArchiveWizard;
