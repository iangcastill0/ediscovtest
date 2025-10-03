import PropTypes from 'prop-types';
import { forwardRef, useState } from 'react';

// material-ui
import { useTheme  } from '@mui/material/styles';
import {
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    Input,
    InputAdornment,
    MenuItem,
    Select,
    Slide,
    TextField,
    Typography,
    Checkbox,
    ListItemText,
    Snackbar,
    CircularProgress,
    Alert
} from '@mui/material';

// project imports
import { gridSpacing } from 'store/constant';
import AnimateButton from 'ui-component/extended/AnimateButton';
import { createSubscriptionPlan } from 'utils/adminApis';

// animation
const Transition = forwardRef((props, ref) => <Slide direction="left" ref={ref} {...props} />);

// ==============================|| PRODUCT ADD DIALOG ||============================== //

const SubscriptionAdd = ({ open, handleCloseDialog, refreshPage }) => {
    const theme = useTheme();

    const [title, setTitle] = useState('Standard');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('0.0');
    const [workspaceCount, setWorkspaceCount] = useState('0');
    const [storageSpace, setStorageSpace] = useState('0');
    const [personName, setPersonName] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    const handleTitle = (e) => {
        setTitle(e.target.value);
    };

    const handleDescription = (e) => {
        setDescription(e.target.value);
    };

    const handlePrice = (e) => {
        setPrice(e.target.value);
    };

    const handleWorkspaceCount = (e) => {
        setWorkspaceCount(e.target.value);
    };

    const handleStorageSpace = (e) => {
        setStorageSpace(e.target.value);
    };

    const handleCreate = async () => {
        // Validate form data
        if (!title || !description || !price || !workspaceCount || !storageSpace) {
            setSnackbarMessage('Please fill out all fields');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }

        // Set loading state
        setIsLoading(true);
        const response = await createSubscriptionPlan(
            title,
            description,
            parseFloat(price),
            parseInt(workspaceCount, 10),
            parseInt(storageSpace, 10)
        );
        if (response.ok) {
            setIsLoading(false);
            handleCloseDialog(); // Close the dialog
            refreshPage();
        } else {
            setIsLoading(false);
            setSnackbarMessage('Failed');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setSnackbarOpen(false);
    };

    return (
        <Dialog
            open={open}
            TransitionComponent={Transition}
            keepMounted
            onClose={handleCloseDialog}
            sx={{
                '&>div:nth-of-type(3)': {
                    justifyContent: 'flex-center',
                    '&>div': {
                        m: 0,
                        borderRadius: '0px',
                        maxWidth: 800,
                        maxHeight: '80%',
                    },
                },
            }}
        >
            {open && (
                <>
                    <DialogTitle>Add Subscription Plan</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={gridSpacing} sx={{ mt: 0.25 }}>
                            <Grid item xs={12}>
                                <TextField
                                    id="outlined-basic1"
                                    fullWidth
                                    label="Enter Title"
                                    value={title}
                                    onChange={handleTitle}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    id="outlined-basic2"
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Enter Description"
                                    value={description}
                                    onChange={handleDescription}
                                    required
                                />
                            </Grid>
                            <Grid item md={12} xs={12}>
                                <TextField
                                    label="Price"
                                    id="filled-start-adornment1"
                                    type="number"
                                    value={price}
                                    onChange={handlePrice}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                    required
                                />
                            </Grid>
                            <Grid item md={6} xs={6}>
                                <TextField
                                    label="Number of workspaces"
                                    id="filled-start-adornment2"
                                    type="number"
                                    value={workspaceCount}
                                    onChange={handleWorkspaceCount}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="start">Workspaces</InputAdornment>,
                                    }}
                                    required
                                />
                            </Grid>
                            <Grid item md={6} xs={6}>
                                <TextField
                                    label="Storage space"
                                    id="filled-start-adornment3"
                                    type="number"
                                    value={storageSpace}
                                    onChange={handleStorageSpace}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="start">TB Storage</InputAdornment>,
                                    }}
                                    required
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <AnimateButton>
                            <Button variant="contained" onClick={handleCreate} disabled={isLoading}>
                                {isLoading ? <CircularProgress size={24} /> : 'Create'}
                            </Button>
                        </AnimateButton>
                        <Button variant="text" color="error" onClick={handleCloseDialog}>
                            Close
                        </Button>
                    </DialogActions>
                </>
            )}

            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{vertical: 'top', horizontal:'right'}}>
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }} color='error'>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Dialog>
    );
};

SubscriptionAdd.propTypes = {
    open: PropTypes.bool.isRequired,
    handleCloseDialog: PropTypes.func.isRequired,
    refreshPage: PropTypes.func.isRequired
};

export default SubscriptionAdd;
