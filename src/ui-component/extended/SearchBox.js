import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Chip,
    Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import Tooltip from '@mui/material/Tooltip';

const OutlineInputStyle = styled(Paper)(({ theme }) => ({
    width: 300,
    marginLeft: 16,
    paddingLeft: 8,
    paddingRight: 8,
    display: 'flex',
    alignItems: 'center',
    border: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[300]}`,
    borderRadius: '24px',
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.background.paper,
    transition: 'all 0.3s ease',
    '&:hover': {
        borderColor: theme.palette.primary.main,
    },
    '&:focus-within': {
        borderColor: theme.palette.primary.main,
        boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
    },
    '& input': {
        background: 'transparent !important',
        paddingLeft: '8px !important',
        color: theme.palette.text.primary,
    },
    [theme.breakpoints.down('lg')]: {
        width: 250
    },
    [theme.breakpoints.down('md')]: {
        width: '100%',
        marginLeft: 4,
    }
}));

const SearchBox = ({ handleSearch, handleOpenDialog, currentSearch, onClearSearch, onKeywordsChange }) => {
    // const [value, setValue] = useState('');
    const [showClear, setShowClear] = useState(false);

    useEffect(() => {
        setShowClear(currentSearch && Object.keys(currentSearch).length > 0);
    }, [currentSearch]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch(currentSearch?.keywords || '');
        }
    };

    const handleClear = () => {
        onClearSearch();
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const getSearchDetails = () => {
        if (!currentSearch) return null;
        const details = [];
        const { keywords, dateRange, fileTypePattern, sizeRange, emailFilters } = currentSearch;
        
        // if (keywords) {
        //     details.push(`Keywords: ${keywords}`);
        // }
        
        if (fileTypePattern) {
            details.push(`File Types: ${fileTypePattern}`);
        }
        
        if (dateRange?.start || dateRange?.end) {
            const formatDate = (date) => date ? new Date(date).toLocaleDateString() : '';
            const start = formatDate(dateRange.start);
            const end = formatDate(dateRange.end);
            details.push(`Date: ${start || 'Any'} - ${end || 'Now'}`);
        }
        
        if (sizeRange) {
            details.push(`Size: ${sizeRange}(KB)`);
        }
        
        if (emailFilters?.from) {
            details.push(`From: ${currentSearch.emailFilters.from}`);
        }
        
        if (emailFilters?.to) {
            details.push(`To: ${currentSearch.emailFilters.to}`);
        }
        
        return details;
    };

    const searchDetails = getSearchDetails();

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <OutlineInputStyle>
                    <InputBase
                        sx={{ ml: 1, flex: 1 }}
                        value={currentSearch?.keywords || ''}
                        onChange={(e) => onKeywordsChange(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Search messages..."
                        inputProps={{ 'aria-label': 'search' }}
                    />
                    {showClear && (
                        <Tooltip title="Clear search">
                            <IconButton
                                color="primary"
                                sx={{ p: '10px' }}
                                aria-label="clear"
                                onClick={handleClear}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    <Tooltip title="Search">
                        <IconButton 
                            type="button" 
                            color="primary" 
                            sx={{ p: '10px' }} 
                            aria-label="search" 
                            onClick={() => handleSearch(currentSearch?.keywords)}
                        >
                            <SearchIcon />
                        </IconButton>
                    </Tooltip>
                    <Divider 
                        sx={{ 
                            height: 28, 
                            m: 0.5,
                            backgroundColor: (theme) => theme.palette.mode === 'dark' ? 
                                theme.palette.grey[700] : 
                                theme.palette.grey[300]
                        }} 
                        orientation="vertical" 
                    />
                    <Tooltip title="Advanced Search">
                        <IconButton 
                            color="primary" 
                            sx={{ p: '10px' }} 
                            aria-label="expand" 
                            onClick={() => handleOpenDialog(true)}
                        >
                            <FilterListIcon />
                        </IconButton>
                    </Tooltip>
                </OutlineInputStyle>
            </Box>
            
            {searchDetails && searchDetails.length > 0 && (
                <Box sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    mt: 1, 
                    flexWrap: 'wrap',
                    maxWidth: '100%',
                    overflow: 'hidden'
                }}>
                    {searchDetails.map((detail, index) => (
                        <Chip
                            key={index}
                            label={detail}
                            size="small"
                            sx={{
                                fontSize: '0.75rem',
                                height: '24px',
                                '& .MuiChip-label': {
                                    px: 1
                                }
                            }}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
};

SearchBox.propTypes = {
    handleSearch: PropTypes.func.isRequired,
    handleOpenDialog: PropTypes.func.isRequired,
    currentSearch: PropTypes.object.isRequired,
    onClearSearch: PropTypes.func.isRequired,
    onKeywordsChange: PropTypes.func
};

export default SearchBox;