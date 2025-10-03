import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogContent, DialogActions, Button, Step, StepLabel, Stepper, TextField, Autocomplete, Select, MenuItem, Checkbox, FormControlLabel, FormControl, InputLabel, Box, Typography, List, ListItem, ListItemText, CircularProgress, LinearProgress } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers';
import { archiveGoogleJob } from 'utils/apiHelper';
import axiosServices from "utils/axios";
import { formatSizeUnits } from 'utils/utils';

const ArchiveWizard = ({ workspaceId, open, onClose, users, isPersonal, onArchived, onError }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [validationErrors, setValidationErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        jobName: '',
        user: [],
        userEmail: [],
        application: [],
        keywords: '',
        filterByDateRange: false,
        dateRange: { start: new Date(), end: new Date() },
        recipientName: '',
        attachmentName: '',
        isPersonal
    });
    const [filteredCounts, setFilteredCounts] = useState({});
    const [fetchError, setFetchError] = useState(null);
    const [isArchiving, setIsArchiving] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [selectedApplications, setSelectedApplications] = useState([]);

    const applications = ["Gmail", "Drive"];

    const handleApplicationsChange = (event) => {
        const { value } = event.target;
        setFilters({ ...filters, application: value });
        setSelectedApplications(typeof value === 'string' ? value.split(',') : value);
    };

    const clear = () => {
        setFilters({
            jobName: '',
            user: [],
            userEmail: [],
            application: [],
            keywords: '',
            filterByDateRange: false,
            dateRange: { start: new Date(), end: new Date() },
            recipientName: '',
            attachmentName: '',
            isPersonal
        });
        setFilteredCounts({});
        setFetchError(null);
        setIsArchiving(false);
        setExporting(false);
        setProgress(0);
        setSelectedUsers([]);
        setSelectedApplications([]);
    };

    const validateInputs = () => {
        const errors = {};
        if (!filters.jobName) {
            errors.jobName = 'Job Name is required';
        }
        if (!filters.user.length) {
            errors.user = 'Users is required';
        }
        if (!filters.application.length) {
            errors.application = 'Applications is required';
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const fetchGraphAPIData = async (userId, application) => {
        try {
            let keyword = '';
            if (filters.keywords) {
                const keywordsArray = filters.keywords.split(',').map(kw => kw.trim());
                keyword = keywordsArray.join(' OR ');
            }
            let startDate = '';
            let endDate = '';
            if (filters.filterByDateRange) {
                startDate = filters.dateRange.start.toISOString().slice(0, 10);
                endDate = filters.dateRange.end.toISOString().slice(0, 10);
            }

            let response;
            if (application === 'Gmail') {
                response = await axiosServices.get(`/google/workspace/${workspaceId}/gmail/counts`, {
                    params: {
                        userId,
                        keyword,
                        startDate,
                        endDate,
                        isPersonal
                    }
                });
            } else if (application === 'Drive') {
                response = await axiosServices.get(`/google/workspace/${workspaceId}/drive/counts`, {
                    params: {
                        userId,
                        keyword,
                        startDate,
                        endDate,
                        isPersonal
                    }
                });
            } else if (application === 'Calendar') {
                response = await axiosServices.get(`/google/calendar/isArchive`, {
                    params: {
                        userId,
                    }
                });
            }

            return {count: response.data.count, size: response.data.totalSize}; // Assuming API returns an array
        } catch (error) {
            console.error(`Error fetching data for ${application}:`, error);
            setFetchError(`Failed to fetch data from Google API. Please check your network and try again.`);
            return {count: 0, size: undefined};
        }
    };

    const fetchFilteredData = async () => {
        setLoading(true);
        const counts = {};
        try {
            for (const user of selectedUsers) {
                counts[user.mail] = {};
                for (const application of selectedApplications) {
                    const count = await fetchGraphAPIData(user.mail, application);
                    counts[user.mail][application] = count;
                }
            }
            setFilteredCounts(counts);
            setFetchError(null);
        } catch (error) {
            setFetchError("Failed to fetch data. Please try again.");
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
        setActiveStep(prevActiveStep => prevActiveStep + 1);
    };

    const handleUserChange = (event, values) => {
        setSelectedUsers(values);
        setFilters({
            ...filters,
            user: values,
            userEmail: values ? values.map(user => user.mail) : []
        });
    };

    const handleBack = () => {
        setActiveStep(prevActiveStep => prevActiveStep - 1);
    };

    const handleArchive2 = async () => {
        setIsArchiving(true);
        try {
            for (const user of selectedUsers) {
                for (const application of selectedApplications) {
                    const data = filteredCounts[user.mail][application];
                    if (data.count > 0) {
                        await archiveGoogleJob(workspaceId, { ...filters, user: [user], userEmail: [user.mail], application: [application] }, data.count);
                    }
                }
            }
            onClose();
            clear();
            onArchived();
            setActiveStep(0);
        } catch (error) {
            console.error("Error archiving job:", error);
            onError();
        }
        setIsArchiving(false);
    };

    const handleChange = (event) => {
        setFilters({ ...filters, [event.target.name]: event.target.value });
    };

    const handleFilterByDate = (event) => {
        setFilters({ ...filters, filterByDateRange: event.target.checked });
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
            <DialogContent>
                <Stepper activeStep={activeStep}>
                    <Step><StepLabel>Filter Criteria</StepLabel></Step>
                    <Step><StepLabel>Review & Confirm</StepLabel></Step>
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
                            getOptionLabel={(option) => option.displayName}
                            renderInput={(params) => <TextField {...params} label="Users" error={!!validationErrors.user} helperText={validationErrors.user || ''} />}
                            onChange={handleUserChange}
                            fullWidth
                        />
                        <FormControl fullWidth sx={{ mt: 2 }} error={!!validationErrors.application}>
                            <InputLabel id="application-select-label">Applications</InputLabel>
                            <Select
                                labelId="application-select-label"
                                id="application-select"
                                multiple
                                value={selectedApplications}
                                onChange={handleApplicationsChange}
                                renderValue={(selected) => selected.join(', ')}
                                label="Applications"
                            >
                                {applications.map((name) => (
                                    <MenuItem key={name} value={name}>
                                        <Checkbox checked={selectedApplications.indexOf(name) > -1} />
                                        <ListItemText primary={name} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Keywords"
                            value={filters.keywords}
                            onChange={handleChange}
                            name="keywords"
                            fullWidth
                            sx={{ mt: 2 }}
                        />
                        <FormControlLabel
                            control={<Checkbox checked={filters.filterByDateRange} onChange={handleFilterByDate} color='primary' />}
                            label="Filter by DateRange"
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
                        {/* <TextField
                            label="Recipient Name"
                            value={filters.recipientName}
                            onChange={handleChange}
                            name="recipientName"
                            fullWidth
                            sx={{ mt: 2 }}
                        /> */}
                    </Box>
                )}
                {activeStep === 1 && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h4" gutterBottom>Review Filter Criteria</Typography>
                        <List component="nav" aria-label="filter criteria">
                            <ListItem>
                                <ListItemText primary="Job Name" secondary={filters.jobName || 'None'} />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Users" secondary={filters.user.length ? filters.user.map(userItem => userItem.displayName).join(', ') : 'Not selected'} />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Applications" secondary={filters.application.join(', ') || 'Not selected'} />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Keywords" secondary={filters.keywords || 'None'} />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Recipient Name" secondary={filters.recipientName || 'None'} />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Date Range" secondary={filters.filterByDateRange ? `${filters.dateRange.start.toLocaleDateString()} - ${filters.dateRange.end.toLocaleDateString()}` : 'Not selected'} />
                            </ListItem>
                            {Object.keys(filteredCounts).length > 0 && (
                                <>
                                    <Typography variant="h6" gutterBottom>Filtered Counts</Typography>
                                    {Object.entries(filteredCounts).map(([userEmail, appCounts]) => (
                                        <Box key={userEmail} sx={{ mt: 2 }}>
                                            <Typography variant="body1" gutterBottom>{userEmail}</Typography>
                                            <List>
                                                {Object.entries(appCounts).map(([application, data]) => (
                                                    <ListItem key={application}>
                                                        <ListItemText primary={application} secondary={`Count: ${data.count}, EstimateSize: ${formatSizeUnits(data.size)}`} />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Box>
                                    ))}
                                </>
                            )}
                        </List>
                        {fetchError && (
                            <Typography color="error" sx={{ mb: 2 }}>
                                {fetchError}
                            </Typography>
                        )}
                        {exporting && (
                            <>
                                <LinearProgress variant="determinate" value={progress} />
                                <p>{`Progress: ${progress.toFixed(0)}%`}</p>
                            </>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleBack} disabled={activeStep === 0}>Back</Button>
                {activeStep === 0 && (
                    loading ? <CircularProgress size={30} /> : <Button onClick={handleNext}>Next</Button>
                )}
                {activeStep === 1 && (
                    <>
                        <Button onClick={handleArchive2} disabled={isArchiving}>Archive</Button>
                    </>
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
    isPersonal: PropTypes.string.isRequired,
    onArchived: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired,
};

export default ArchiveWizard;
