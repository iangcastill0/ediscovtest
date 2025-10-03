import React, { useState } from 'react';
import {
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    TextField,
    Box,
    CircularProgress,
    DialogActions,
    Tooltip,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import PropTypes from 'prop-types';

const sizeRanges = [
    { label: 'Tiny (0-100 KB)', value: '0-100' },
    { label: 'Small (100 KB - 1 MB)', value: '100-1024' },
    { label: 'Medium (1 MB - 10 MB)', value: '1024-10240' },
    { label: 'Large (10 MB - 100 MB)', value: '10240-102400' },
    { label: 'Huge (> 100 MB)', value: '102400-' }
];

const SimpleSearchDialog = ({ open, onClose, onSubmit, isEmail = false, isFile = false }) => {
    const [loading, setLoading] = useState(false);
    const [value, setValue] = useState('');
    const [dateRange, setDateRange] = useState({ start: null, end: null });
    const [emailFilters, setEmailFilters] = useState({ from: '', to: '' });
    const [fileTypePattern, setFileTypePattern] = useState('');
    const [selectedSizeRange, setSelectedSizeRange] = useState('');

    const handleSubmit = () => {
        const searchParams = { 
            keywords: value, 
            dateRange, 
            emailFilters,
            fileTypePattern,
            sizeRange: selectedSizeRange
        };
        onSubmit(searchParams);
        onClose();
    };

    const handleSizeRangeChange = (event) => {
        setSelectedSizeRange(event.target.value);
    };

    const resetFileFilters = () => {
        setFileTypePattern('');
        setSelectedSizeRange('');
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
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
                            {isEmail && (
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
                            )}
                            {isFile && (
                                <>
                                    <TextField
                                        label="File Type Pattern"
                                        value={fileTypePattern}
                                        onChange={(e) => setFileTypePattern(e.target.value)}
                                        fullWidth
                                        placeholder="e.g., *.pdf, *.jpg, *.docx"
                                        helperText="Use comma-separated values for multiple types"
                                    />
                                    <FormControl fullWidth>
                                        <InputLabel id="size-range-label">File Size</InputLabel>
                                        <Select
                                            labelId="size-range-label"
                                            id="size-range-select"
                                            value={selectedSizeRange}
                                            onChange={handleSizeRangeChange}
                                            label="File Size"
                                        >
                                            <MenuItem value="">
                                                <em>Any Size</em>
                                            </MenuItem>
                                            {sizeRanges.map((range) => (
                                                <MenuItem key={range.value} value={range.value}>
                                                    {range.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <Button 
                                        variant="outlined" 
                                        onClick={resetFileFilters}
                                        sx={{ alignSelf: 'flex-start' }}
                                    >
                                        Reset File Filters
                                    </Button>
                                </>
                            )}
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
        </LocalizationProvider>
    );
};

SimpleSearchDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    isEmail: PropTypes.bool,
    isFile: PropTypes.bool
};

export default SimpleSearchDialog;