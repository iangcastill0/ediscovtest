import PropTypes from 'prop-types';
import { forwardRef, useContext} from 'react';

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    Slide,
    Typography
} from '@mui/material';

// project imports
import { gridSpacing } from 'store/constant';

import { SlackContext } from 'contexts/SlackContext';

// animation
const Transition = forwardRef((props, ref) => <Slide direction="left" ref={ref} {...props} />);

// ==============================|| THREAD DETAILS DIALOG ||============================== //

const ThreadsModal = ({ open, handleCloseDialog, data }) => {
    
    const {members} = useContext(SlackContext);
    console.log('Members: ', members);
    return (
        <Dialog
            open={open}
            TransitionComponent={Transition}
            keepMounted
            onClose={handleCloseDialog}
            sx={{
                '&>div:nth-of-type(3)': {
                    justifyContent: 'flex-end',
                    '&>div': {
                        m: 0,
                        borderRadius: '0px',
                        maxWidth: 500,
                        minWidth: 400,
                        maxHeight: '100%',
                        height: '100vh'
                    }
                }
            }}
        >
            {open && (
                <>
                    <DialogTitle>Thread Details</DialogTitle>
                    <Divider />
                    <DialogContent>
                        <Grid container spacing={gridSpacing} sx={{ mt: 0.25 }}>
                            {data.threads.map((thread, index) => (
                                <>
                                <Grid item xs={12} key={index}>
                                    <Typography variant="h5" align="left">
                                        {members[thread.user].display_name ||  members[thread.user].real_name}
                                        <span className="css-1mzm3o3-MuiTypography-root" style={{marginLeft: "10px"}}>{thread.ts}</span>
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} key={index}>
                                    <Typography variant="subtitle" align="left">
                                        {thread.text}
                                    </Typography>
                                </Grid>
                                </>
                            ))}
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button variant="contained" color="error" onClick={handleCloseDialog}>
                            Close
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
};

ThreadsModal.propTypes = {
    open: PropTypes.bool,
    handleCloseDialog: PropTypes.func,
    data: PropTypes.object
};

export default ThreadsModal;
