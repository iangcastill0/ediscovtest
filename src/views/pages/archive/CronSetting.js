import PropTypes from 'prop-types';
import * as React from 'react';

// material-ui
import { useDispatch } from 'store';
import {
    Box,
    CardContent,
    Checkbox,
    Grid,
    TableCell,
    TableHead,
    TableRow,
    TableSortLabel,
    Toolbar,
    Button,
    Typography,
    LinearProgress
} from '@mui/material';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { visuallyHidden } from '@mui/utils';
// project imports
import MainCard from 'ui-component/cards/MainCard';

import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { getArchiveCronTime, setArchiveCronTime } from 'utils/apiHelper';

import { openSnackbar } from 'store/slices/snackbar';


// table header options
const headCells = [
    {
        id: 'name',
        numeric: false,
        label: 'Name',
        align: 'left'
    },
    {
        id: 'type',
        numeric: false,
        label: 'Platform Type',
        align: 'left'
    },
    {
        id: 'updated',
        numeric: false,
        label: 'Last Archived Time',
        align: 'left'
    },
    {
        id: 'status',
        numeric: true,
        label: 'Status',
        align: 'center'
    }
];

// ==============================|| TABLE HEADER ||============================== //

function EnhancedTableHead({ onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort, selected, handleArchive }) {
    const createSortHandler = (property) => (event) => {
        onRequestSort(event, property);
    };

    return (
        <TableHead>
            <TableRow>
                <TableCell padding="checkbox" sx={{ pl: 3 }}>
                    <Checkbox
                        color="primary"
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={rowCount > 0 && numSelected === rowCount}
                        onChange={onSelectAllClick}
                        inputProps={{
                            'aria-label': 'select all desserts'
                        }}
                    />
                </TableCell>
                {numSelected > 0 && (
                    <TableCell padding="none" colSpan={6}>
                        <EnhancedTableToolbar numSelected={selected.length} handleArchive={handleArchive} />
                    </TableCell>
                )}
                {numSelected <= 0 &&
                    headCells.map((headCell) => (
                        <TableCell
                            key={headCell.id}
                            align={headCell.align}
                            padding={headCell.disablePadding ? 'none' : 'normal'}
                            sortDirection={orderBy === headCell.id ? order : false}
                        >
                            <TableSortLabel
                                active={orderBy === headCell.id}
                                direction={orderBy === headCell.id ? order : 'asc'}
                                onClick={createSortHandler(headCell.id)}
                            >
                                {headCell.label}
                                {orderBy === headCell.id ? (
                                    <Box component="span" sx={visuallyHidden}>
                                        {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                    </Box>
                                ) : null}
                            </TableSortLabel>
                        </TableCell>
                    ))}
                {/* {numSelected <= 0 && (
                    <TableCell sortDirection={false} align="center" sx={{ pr: 3 }}>
                        Action
                    </TableCell>
                )} */}
            </TableRow>
        </TableHead>
    );
}

EnhancedTableHead.propTypes = {
    selected: PropTypes.array,
    numSelected: PropTypes.number.isRequired,
    onRequestSort: PropTypes.func.isRequired,
    onSelectAllClick: PropTypes.func.isRequired,
    order: PropTypes.oneOf(['asc', 'desc']).isRequired,
    orderBy: PropTypes.string.isRequired,
    rowCount: PropTypes.number.isRequired,
    handleArchive: PropTypes.func.isRequired
};

// ==============================|| TABLE HEADER TOOLBAR ||============================== //

const EnhancedTableToolbar = ({ numSelected, handleArchive }) => (
    <Toolbar
        sx={{
            p: 0,
            pl: 1,
            pr: 1,
            ...(numSelected > 0 && {
                color: (theme) => theme.palette.secondary.main
            })
        }}
    >
        {numSelected > 0 ? (
            <Typography color="inherit" variant="h4">
                {numSelected} Selected
            </Typography>
        ) : (
            <Typography variant="h6" id="tableTitle">
                No selection
            </Typography>
        )}
        <Box sx={{ flexGrow: 1 }} />
        {numSelected > 0 && (
            // <Tooltip title="Delete">
            //     <IconButton size="large">
            //         <DeleteIcon fontSize="small" />
            //     </IconButton>
            // </Tooltip>
            <Button variant="contained" startIcon={<FileDownloadIcon />} onClick={handleArchive}>
                Archive
            </Button>
        )}
    </Toolbar>
);

EnhancedTableToolbar.propTypes = {
    numSelected: PropTypes.number.isRequired,
    handleArchive: PropTypes.func.isRequired
};

// ==============================|| Public Channel LIST ||============================== //

const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: 300
        }
    }
};
const CronSetting = () => {
    const dispatch = useDispatch();

    const [loading, setLoading] = React.useState(false);
    const [time, setTime] = React.useState(-1);
    const [timeArray, setTimeArray] = React.useState([]);

    React.useEffect(() => {
        const insertFunc = async () => {
            setLoading(true);
            const tmpArray = [];
            tmpArray.push({value: -1, name: 'none'});
            // eslint-disable-next-line no-plusplus
            for(let i = 0; i < 24; i++){
                let name = i;
                if(i<10) name = `0${  i  }:00`;
                else name = `${i  }:00`;
                const row = {value: i, name};
                tmpArray.push(row);
            }
            setTimeArray(tmpArray);
            const msg = await getArchiveCronTime();
            console.log("result of getCronTime: ", msg);
            if(msg.data.ok)
                setTime(msg.data.data);
            setLoading(false);
        }
        insertFunc();
    }, []);

    const setCronTime = async () => {
        console.log('time:', time);
        setLoading(true);
        const msg = await setArchiveCronTime({time});
        console.log("result of setCronTime: ", msg);
        if(msg.data.ok)
            dispatch(openSnackbar({
                open: true,
                message: 'Successfully!',
                variant: 'alert',
                alert: {
                    color: 'success'
                },
                close: true
            }));
        setLoading(false);
    }

    return (
        <MainCard title='Automatic Archive' content={false}>
            {(loading) && <LinearProgress />}
            <CardContent>
                <Grid container justifyContent="space-between" alignItems="center" spacing={2}>
                    <Grid item xs={12} sm={6}>
                      Automatic archive at {' '}
                        <Select
                            labelId="demo-simple-select-standard-label"
                            id="demo-simple-select-standard"
                            value={time}
                            MenuProps={MenuProps}
                            onChange={(event) => setTime(event.target.value)}
                            // label="Age"
                            >
                            {timeArray.map((time) => (
                                <MenuItem value={time.value}>{time.name}</MenuItem>
                            ))}
                        </Select>
                        {' '} every day
                    </Grid>
                    <Grid item>
                        <Button variant="contained" size="large" onClick={setCronTime}>
                            Save
                        </Button>
                    </Grid>
                </Grid>
                
            </CardContent>
        </MainCard>
    );
};

export default CronSetting;
