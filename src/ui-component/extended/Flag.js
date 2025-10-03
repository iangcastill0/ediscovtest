import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import StarIcon from '@mui/icons-material/Star';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    MenuItem,
    TextField,
    IconButton,
    CircularProgress,
    Snackbar,
    Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'utils/axios';

const StyledStarIcon = styled(StarIcon)(({ color }) => ({
    color: color || 'action',
    transition: 'color 0.3s ease',
    '&:hover': {
        opacity: 0.8,
    },
}));

const Flag = ({ rowId, type, initialFlag, collections, rowData }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [currentFlag, setCurrentFlag] = useState(initialFlag || null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCollectionId, setSelectedCollectionId] = useState('');
    const [alert, setAlert] = useState({
        open: false,
        message: '',
        severity: 'error',
    });
    
    useEffect(() => {
        if (dialogOpen) {
            setSelectedCollectionId(currentFlag?._id || '');
        }
    }, [dialogOpen, currentFlag]);

    const handleOpenDialog = (e) => {
        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = (e) => {
        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
        }
        setDialogOpen(false);
    };

    const handleSaveFlag = async (e) => {
        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation(); 
        }
        if (!selectedCollectionId) return;
        
        setIsLoading(true);
        try {
            const selectedCollection = collections.find(c => c._id === selectedCollectionId);
            
            const response = await axios.post('/flagged-collections/storeFlaggedCollections', {
                type,
                collectionId: selectedCollectionId,
                data: rowData
            });

            const newFlag = {
                id: selectedCollectionId,
                name: selectedCollection.name,
                color: selectedCollection.color,
            };
            setCurrentFlag(newFlag);
            handleCloseDialog();
        } catch (error) {
            console.error('Failed to save flag:', error);
            setAlert({
                open: true,
                message: error.response?.data?.message || 'Failed to save flag. Please try again.',
                severity: 'error',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveFlag = async (e) => {
        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
        }
        setIsLoading(true);
        try {
            const resp = await axios.delete(`/flagged-collections/${type}/storedCollection/${selectedCollectionId}/${rowId}`);
            if (resp.data?.ok) {
                setCurrentFlag(null);
                handleCloseDialog();
            } else {
                setAlert({
                    open: true,
                    message: 'Failed to remove flag. Please try again.',
                    severity: 'error',
                });
            }
        } catch (error) {
            console.error('Failed to remove flag:', error);
            setAlert({
                open: true,
                message: error.response?.data?.message || 'Failed to remove flag. Please try again.',
                severity: 'error',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleMenuItemClick = (e, collectionId) => {
        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
        }
        setSelectedCollectionId(collectionId);
    };

    const handleDialogContentClick = (e) => {
        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
        }
    };

    return (
        <>
            <IconButton onClick={handleOpenDialog} size="small" disabled={isLoading}>
                {isLoading ? (
                    <CircularProgress size={24} />
                ) : (
                    <StyledStarIcon color={currentFlag?.color} />
                )}
            </IconButton>

            <Dialog open={dialogOpen} onClose={handleCloseDialog}>
                <DialogTitle>
                    {currentFlag ? 'Change Collection' : 'Add to Collection'}
                </DialogTitle>
                <DialogContent onClick={handleDialogContentClick} sx={{ minWidth: 300, pt: 2 }}>
                    <TextField
                        select
                        fullWidth
                        label="Collection"
                        value={selectedCollectionId}
                        disabled={isLoading}
                        onChange={(e) => {
                            setSelectedCollectionId(e.target.value);
                        }}
                    >
                        {collections.map((collection) => (
                            <MenuItem
                                key={collection._id}
                                value={collection._id}
                                onClick={(e) => handleMenuItemClick(e, collection._id)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div
                                        style={{
                                            width: 20,
                                            height: 20,
                                            backgroundColor: collection.color,
                                            marginRight: 8,
                                            borderRadius: '50%',
                                        }}
                                    />
                                    {collection.name}
                                </div>
                            </MenuItem>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions>
                    {currentFlag && (
                        <Button 
                            onClick={handleRemoveFlag} 
                            color="error"
                            disabled={isLoading}
                        >
                            Remove
                        </Button>
                    )}
                    <Button onClick={handleCloseDialog} disabled={isLoading}>
                        Cancel
                    </Button>
                    {!currentFlag && <Button
                        onClick={handleSaveFlag}
                        color="primary"
                        variant="contained"
                        disabled={!selectedCollectionId || isLoading}
                    >
                        Save
                    </Button>}
                </DialogActions>
            </Dialog>

            <Snackbar
                open={alert.open}
                autoHideDuration={6000}
                onClose={() => setAlert({ ...alert, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setAlert({ ...alert, open: false })}
                    severity={alert.severity}
                    sx={{ width: '100%' }}
                >
                    {alert.message}
                </Alert>
            </Snackbar>
        </>
    );
};

Flag.propTypes = {
    rowId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    type: PropTypes.string,
    rowData: PropTypes.object.isRequired,
    initialFlag: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        color: PropTypes.string.isRequired,
    }),
    collections: PropTypes.array.isRequired
};

export default Flag;