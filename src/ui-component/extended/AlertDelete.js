import PropTypes from 'prop-types'

// material-ui
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'

// ==============================|| KANBAN BOARD - COLUMN DELETE ||============================== //

export default function AlertDelete ({ title, open, handleClose }) {
    return (
        <Dialog
            open={open}
            onClose={e => handleClose(e, false)}
            keepMounted
            maxWidth='xs'
            aria-labelledby='column-delete-title'
            aria-describedby='column-delete-description'
        >
            {open && (
                <>
                    <DialogTitle id='column-delete-title'>{title} - Are you sure you want to delete?</DialogTitle>
                    <DialogContent>
                        <DialogContentText id='column-delete-description'>
                            By deleting this, all archives inside that will also be deleted.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions sx={{ mr: 2 }}>
                        <Button
                            onClick={e => {
                                e.stopPropagation()
                                e.preventDefault()
                                handleClose(e, false)
                            }}
                            color='error'
                        >
                            Cancel
                        </Button>
                        <Button
                            variant='contained'
                            size='small'
                            onClick={e => {
                                e.stopPropagation()
                                e.preventDefault()
                                handleClose(e, true)
                            }}
                            autoFocus
                        >
                            Delete
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    )
}

AlertDelete.propTypes = {
    open: PropTypes.bool,
    handleClose: PropTypes.func,
    title: PropTypes.string
}
