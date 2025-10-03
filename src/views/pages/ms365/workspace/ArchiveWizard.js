import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogContent, DialogActions, Button, Step, StepLabel, Stepper, TextField, Autocomplete, Select, MenuItem, Checkbox, FormControlLabel, FormControl, InputLabel, Box, Typography, List, ListItem, ListItemText, CircularProgress, LinearProgress } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers';
import { MS365Context } from 'contexts/MS365Context';
import { archiveMSJob } from 'utils/apiHelper';
import JSZip from 'jszip';
import { saveAs } from "save-as";
import axiosServices from 'utils/axios';

const ArchiveWizard = ({ workspaceId, open, onClose, users, onArchived, onError }) => {
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
        filterWithContent: true,
    });
    const [filteredCounts, setFilteredCounts] = useState({});
    const [filteredData, setFilteredData] = useState({});
    const [fetchError, setFetchError] = useState(null);
    const [isArchiving, setIsArchiving] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const { accessToken } = useContext(MS365Context);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [selectedApplications, setSelectedApplications] = useState([]);

    const handleApplicationsChange = (event) => {
        const {
            target: { value },
        } = event;
        setFilters({ ...filters, application: value });
        setSelectedApplications(
            typeof value === 'string' ? value.split(',') : value
        );
    };

    const applications = ["Outlook", "OneDrive"];

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
            filterWithContent: true,
        });
        setFilteredCounts({});
        setFilteredData({});
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
            errors.user = 'Users are required';
        }
        if (!filters.application.length) {
            errors.application = 'Applications are required';
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const fetchGraphAPIData = async (userEmail) => {
        try {
            const headers = {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            };
    
            let query = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userEmail)}/messages?$select=subject`;
            let searchApplied = false;
            let searchString = ""
            // Construct search query for keywords in subject and/or body
            if (filters.keywords) {
                const keywordsArray = filters.keywords.split(',').map(kw => kw.trim());
                const searchQueryParts = [];
                keywordsArray.forEach(kw => {
                    searchQueryParts.push(`subject:${kw}`);
                    searchQueryParts.push(`attachment:${kw}`);
                    if (filters.filterWithContent) {
                        searchQueryParts.push(`body:${kw}`);
                    }
                });
                searchString = searchQueryParts.join(' OR ');
                searchApplied = true;
            }
    
            // Add filter for date range
            if (filters.filterByDateRange) {
                const startDate = filters.dateRange.start.toLocaleDateString();
                const endDate = filters.dateRange.end.toLocaleDateString();
                const dateFilter = `received>=${startDate} AND received<=${endDate}`;
                searchApplied = true
                if (searchString) {
                    searchString += ' AND ' + dateFilter
                } else {
                    searchString = dateFilter
                }
                // query += searchApplied || filters.attachmentName ? ` and ${dateFilter}` : `&$filter=${dateFilter}`;
            }
            if (searchApplied)
                query += `&$search="${searchString}"`;
            let allData = [];
            let nextLink = query + '&$count=true'; // Initially try to get a count, though it might not be accurate with $search
            let totalCount = 0;
    
            while (nextLink) {
                const response = await fetch(nextLink, { headers });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                allData = allData.concat(data.value);
                if (data['@odata.nextLink']) {
                    nextLink = data['@odata.nextLink'];
                } else {
                    nextLink = null;
                }
                if (!searchApplied && data['@odata.count'] !== undefined && totalCount === 0) {
                    totalCount = parseInt(data['@odata.count'], 10);
                }
            }
    
            // If $search was applied, the total count is the length of allData
            const finalCount = searchApplied ? allData.length : totalCount;
    
            return { count: finalCount, data: allData };
    
        } catch (error) {
            console.error("Error fetching data from Microsoft Graph API", error);
            setFetchError(`HTTP error! status: ${error}`);
            return { count: 0, data: null };
        }
    };

    const fetchGraphAPIOneDriveData = async (userEmail) => {
        try {
            const response = await axiosServices.get(`/ms365/workspace/${workspaceId}/users/${userEmail}/onedrive/filter`, {
                params: {
                    keywords: filters.keywords,
                    startDate: filters.filterByDateRange ? filters.dateRange.start.toLocaleDateString() : undefined,
                    endDate: filters.filterByDateRange ? filters.dateRange.end.toLocaleDateString() : undefined
                },
            });
            return { count: response.data.fileCount + response.data.folderCount };
        } catch (error) {
            console.error('Error listing items in folder', error);
            setFetchError(`HTTP error! status: ${error}`);
        }

        return { count: 0, data: null };
    };

    const fetchFilteredData = async () => {
        const counts = {};
        const data = {};
        for (const user of selectedUsers) {
            counts[user.mail] = {};
            data[user.mail] = {};
            for (const application of selectedApplications) {
                let result = { count: 0, data: null };
                if (application === 'Outlook') {
                    result = await fetchGraphAPIData(user.mail);
                } else if (application === 'OneDrive') {
                    result = await fetchGraphAPIOneDriveData(user.mail);
                }
                counts[user.mail][application] = result.count;
                data[user.mail][application] = result.data;
            }
        }
        setFilteredCounts(counts);
        setFilteredData(data);
    };

    const handleNext = async () => {
        if (activeStep === 0 && !validateInputs()) {
            return; // prevent moving to the next step if validation fails
        }
        if (activeStep === 0) {
            setLoading(true);
            setFetchError(null);
            await fetchFilteredData();
            setLoading(false);
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
        console.log('filters', JSON.stringify(filters, null, 2));
    };

    const handleBack = () => {
        setFilteredCounts({});
        setFilteredData({});
        setActiveStep(prevActiveStep => prevActiveStep - 1);
    };

    const handleArchive = async () => {
        setIsArchiving(true);
        try {
            for (const user of selectedUsers) {
                for (const application of selectedApplications) {
                    const count = filteredCounts[user.mail][application];
                    if (count > 0) {
                        await archiveMSJob(workspaceId, { ...filters, user: [user], userEmail: [user.mail], application: [application] }, count);
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

    const fetchMimeData = async (filteredData, setProgress, accessToken) => {
        const maxRetries = 3;
        const retryDelay = 15000; // 15 seconds
        const zip = new JSZip();
        let messages = filteredData.value;
        let nextLink = filteredData['@odata.nextLink'];
        let processedCount = 0;

        // Function to handle the fetch with retry logic
        /* eslint-disable no-await-in-loop */
        const fetchWithRetry = async (url, options, isBlob = false) => {
            for (let retry = 0; retry < maxRetries; retry += 1) {
                try {
                    const response = await fetch(url, options);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    return isBlob ? await response.blob() : await response.json();
                } catch (error) {
                    if (retry === maxRetries - 1) throw error;
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }
            return null;
        };

        for (let i = 0; i < messages.length; i += 1) {
            const emailUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(filters.userEmail[0])}/messages/${messages[i].id}/$value`;
            const emailResponse = await fetchWithRetry(emailUrl, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }, true);

            if (emailResponse) {
                console.log(emailResponse);
                zip.file(`${messages[i].subject}.eml`, emailResponse);
            }

            processedCount += 1;
            setProgress((processedCount / filteredCounts) * 100);

            if (nextLink && processedCount === messages.length) {
                const nextData = await fetchWithRetry(nextLink, { headers: { Authorization: `Bearer ${accessToken}` } });
                messages = nextData.value;
                nextLink = nextData['@odata.nextLink'];
                processedCount = 0;
                i = 0;
            }
        }

        const zipContent = await zip.generateAsync({ type: "blob" });
        saveAs(zipContent, "emails.zip");
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            await fetchMimeData(filteredData, setProgress, accessToken);
            // Handle successful export
        } catch (error) {
            console.error("Error exporting emails:", error);
            onError();
        }
        clear();
        onClose();
    };

    const handleChange = (event) => {
        setFilters({ ...filters, [event.target.name]: event.target.value });
    };

    const handleFilterByDate = (event) => {
        setFilters({ ...filters, filterByDateRange: event.target.checked });
    };

    const handleFilterWithContentChange = (event) => {
        setFilters({ ...filters, filterWithContent: event.target.checked });
    };

    return (
        <>
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
                            <FormControlLabel
                                control={<Checkbox checked={filters.filterWithContent} onChange={handleFilterWithContentChange} color='primary' />}
                                label="Filter with Content"
                            />
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
                                <ListItem>
                                    <ListItemText primary="Filter with Content" secondary={filters.filterWithContent ? 'Yes' : 'No'} />
                                </ListItem>
                            </List>
                            <Typography variant="h4" sx={{ mt: 2 }}>Filtered Data Summary</Typography>
                            <List>
                                {Object.entries(filteredCounts).map(([userEmail, appCounts]) => (
                                    <React.Fragment key={userEmail}>
                                        <Typography variant="h6">{userEmail}</Typography>
                                        {Object.entries(appCounts).map(([app, count]) => (
                                            <ListItem key={app}>
                                                <ListItemText primary={app} secondary={count} />
                                            </ListItem>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </List>
                            {fetchError && (
                                <Typography color="error" sx={{ mb: 2 }}>
                                    {fetchError}
                                </Typography>
                            )}
                            {
                                exporting && (
                                    <>
                                        <LinearProgress variant="determinate" value={progress} />
                                        <p>{`Progress: ${progress.toFixed(0)}%`}</p>
                                    </>
                                )
                            }

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
                            <Button onClick={handleArchive} disabled={Object.keys(filteredCounts).length === 0 || isArchiving}>Archive</Button>
                            {/* <Button onClick={handleExport} disabled={filteredCounts === 0 || exporting || filters.application !== 'Outlook'}>Export</Button> */}
                        </>
                    )}
                </DialogActions>
            </Dialog>
            {Object.keys(filteredCounts).length > 0 && (
                <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: '4px' }}>
                    <Typography variant="h5">Filtered Results</Typography>
                    <List>
                        {Object.entries(filteredCounts).map(([userEmail, appCounts]) => (
                            <React.Fragment key={userEmail}>
                                <Typography variant="h6">{userEmail}</Typography>
                                {Object.entries(appCounts).map(([app, count]) => (
                                    <ListItem key={app}>
                                        <ListItemText primary={app} secondary={`Count: ${count}`} />
                                        <ListItemText primary={app} secondary={`Data: ${filteredData[userEmail] && filteredData[userEmail][app] ? JSON.stringify(filteredData[userEmail][app], null, 2) : 'No Data'}`} />
                                    </ListItem>
                                ))}
                            </React.Fragment>
                        ))}
                    </List>
                </Box>
            )}
        </>
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
