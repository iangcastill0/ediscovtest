import PropTypes from 'prop-types';
import * as React from 'react';
import { useNavigate } from "react-router-dom";

// material-ui
import { useTheme } from '@mui/material/styles';
import {
    Box,
    CardContent,
    Checkbox,
    Grid,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TableSortLabel,
    TextField,
    Toolbar,
    Typography,
    Tooltip,
    IconButton,
    CircularProgress
} from '@mui/material';
import Chip from 'ui-component/extended/Chip';
import { visuallyHidden } from '@mui/utils';
// project imports
import MainCard from 'ui-component/cards/MainCard';

// assets
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

import { deleteBackups, formatSizeUnits } from 'utils/apiHelper';
import { useDispatch } from 'store';
import { openSnackbar } from 'store/slices/snackbar';

const INTERVAL_TIME = 100;

// table header options
const headCells = [
    {
        id: 'id',
        numeric: false,
        label: 'ID of Archive',
        align: 'left'
    },
    {
        id: 'backedAt',
        numeric: false,
        label: 'BackupAt',
        align: 'left'
    },
    {
        id: 'size',
        numeric: false,
        label: 'Size',
        align: 'left'
    },
    {
        id: 'note',
        numeric: false,
        label: 'Detail',
        align: 'left'
    },
    {
        id: 'status',
        numeric: false,
        label: 'Status',
        align: 'left'
    }
];

// ==============================|| TABLE HEADER ||============================== //

function EnhancedTableHead({ onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort, selected, handleDelete, isDeleting, countdown, cancelDeletion }) {
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
                        <EnhancedTableToolbar numSelected={selected.length} handleDelete={handleDelete} isDeleting={isDeleting} countdown={countdown} cancelDeletion={cancelDeletion} />
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
    handleDelete: PropTypes.func,
    isDeleting: PropTypes.bool,
    countdown: PropTypes.number,
    cancelDeletion: PropTypes.func
};

// ==============================|| TABLE HEADER TOOLBAR ||============================== //

const EnhancedTableToolbar = ({ numSelected, handleDelete, isDeleting, countdown, cancelDeletion }) => {
    console.log(countdown);
    return <Toolbar
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
        {numSelected > 0 && !isDeleting && (
            <Tooltip title="Delete">
                <IconButton size="large">
                    <DeleteIcon fontSize="medium" color='error' onClick={handleDelete} />
                </IconButton>
            </Tooltip>
        )}
        {isDeleting && (
            <Tooltip title="Cancel">
                <IconButton size="large" onClick={cancelDeletion} style={{ position: 'relative', marginRight: '12px' }}>
                    <CircularProgress
                        variant="determinate"
                        value={countdown}
                        size={24} // Adjust size as needed
                        thickness={4} // Adjust thickness of the circle
                        style={{ position: 'absolute', left: 0 }}
                    />
                    <ClearIcon
                        fontSize="medium"
                        color='primary'
                        style={{ position: 'absolute', left: 0 }}
                    />
                </IconButton>
            </Tooltip>
        )}
    </Toolbar>
}

EnhancedTableToolbar.propTypes = {
    numSelected: PropTypes.number.isRequired,
    handleDelete: PropTypes.func,
    isDeleting: PropTypes.bool,
    countdown: PropTypes.number,
    cancelDeletion: PropTypes.func
};

// ==============================|| Public Channel LIST ||============================== //

const ArchiveLogs = ({ data }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [order, setOrder] = React.useState('asc');
    const [orderBy, setOrderBy] = React.useState('name');
    const [selected, setSelected] = React.useState([]);
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(5);
    const [search, setSearch] = React.useState('');
    const [rows, setRows] = React.useState([]);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [countdown, setCountdown] = React.useState(INTERVAL_TIME);
    const [intervalId, setIntervalId] = React.useState(null);
    const dispatch = useDispatch();

    React.useEffect(() => {
        setRows(data.archives || []);
    }, [data.archives]);
    
    const handleSearch = (event) => {
        const newString = event?.target.value;
        setSearch(newString || '');

        if (newString) {
            const newRows = data.archives.filter((row) => {
                let matches = true;

                const properties = data.type === 'Slack' ? ['id', 'email'] : ['id', 'filters'];
                let containsQuery = false;

                properties.forEach((property) => {
                    if (property === 'filters') {
                        if (row.filters?.userEmail?.toString().toLowerCase().includes(newString.toString().toLowerCase()) || row.filters.jobName.toString().toLowerCase().includes(newString.toString().toLowerCase())) {
                            containsQuery = true;
                        }
                    } else if (row[property].toString().toLowerCase().includes(newString.toString().toLowerCase())) {
                        containsQuery = true;
                    }
                });

                if (!containsQuery) {
                    matches = false;
                }
                return matches;
            });
            setRows(newRows);
        } else {
            setRows(data.archives);
        }
    };

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelectedId = rows.map((n) => (n.id));
            setSelected(newSelectedId);
            return;
        }
        setSelected([]);
    };

    const getArchiveState = (archiveState) => {
        if (archiveState) {
            if (archiveState.state === 'completed')
                return <Chip label="Success" size="small" chipcolor="success" />
            if (archiveState.state === 'progress') {
                let percentage = ((archiveState.processedCount / archiveState.totalCount) * 100).toFixed(2);
                percentage = Number.isNaN(Number(percentage)) ? 0 : percentage
                return <Chip label={`In Progress (${percentage}%)`} size="small" chipcolor="primary" />
            }
            if (archiveState.state === 'queued') {
                return <Chip label={`In queue`} size="small" chipcolor="secondary" />
            }
            if (archiveState.state === 'delete') {
                let percentage = ((archiveState.deletedCount / archiveState.totalCount) * 100).toFixed(2);
                percentage = Number.isNaN(Number(percentage)) ? 0 : percentage
                return <Chip label={`Deleting (${percentage}%)`} size="small" chipcolor="warning" />
            }
            if (archiveState.state === 'error')
                return <Chip label="Error" size="small" chipcolor="error" />
        }
    
        return ''
    }
    
    const handleClick = (name) => {

        const selectedIndex = selected.indexOf(name);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, name);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
        }
        setSelected(newSelected);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event?.target.value, 10));
        setPage(0);
    };

    const handleDelete = React.useCallback(() => {
        setIsDeleting(true);
        setCountdown(INTERVAL_TIME);
        if (!intervalId) {
            const id = setInterval(() => {
                setCountdown((prevCountdown) => {
                    if (prevCountdown === 1) {
                        clearInterval(id);
                        setIsDeleting(false);
                        deleteBackups(data.type, data.id, selected).then((res) => {
                            if (res.ok) {
                                const newRows = rows.filter((row) => !selected.includes(row.id));
                                setRows(newRows);
                            }
                            setSelected([]);
                        });
                        return INTERVAL_TIME;
                    }
                    return prevCountdown - 1;
                });
            }, INTERVAL_TIME);
            setIntervalId(id);
        }
    }, [intervalId, data.id, selected, rows]);

    const cancelDeletion = () => {
        setIsDeleting(false);
        setCountdown(INTERVAL_TIME);
        if (intervalId) {
            clearInterval(intervalId);
        }
        setIntervalId(null);
    };

    const handleRow = (row) => {
        if (row.archiveState?.state === 'completed') {
            if (data.type === 'FlaggedCollections') {
                if (row.version !== 1) {
                    dispatch(
                        openSnackbar({
                            open: true,
                            anchorOrigin: { vertical: 'top', horizontal: 'right' },
                            message: 'This is an old version of archive.',
                            variant: 'alert',
                            alert: {
                                color: 'warning'
                            },
                        })
                    );  
                    return      
                }
            }
            navigate(`/archive/${data.type}/${data.id}/backup/${row.id}?name=${row.id}&jobName=${row.filters?.jobName}&keywords=${row.filters?.keywords}`)
        } else {
            dispatch(
                openSnackbar({
                    open: true,
                    anchorOrigin: { vertical: 'top', horizontal: 'right' },
                    message: 'This is not a completed archive.',
                    variant: 'alert',
                    alert: {
                        color: 'warning'
                    },
                })
            );
        }
    }

    const isSelected = (id) => selected.indexOf(id) !== -1;

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

    return (
        <MainCard title="Archived Logs" content={false}>
            <CardContent>
                <Grid container justifyContent="space-between" alignItems="center" spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                )
                            }}
                            onChange={handleSearch}
                            placeholder="Search Channels"
                            value={search}
                            size="small"
                        />
                    </Grid>
                </Grid>
            </CardContent>

            {/* table */}
            <TableContainer>
                <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
                    <EnhancedTableHead
                        theme={theme}
                        numSelected={selected.length}
                        order={order}
                        // orderBy={orderBy}
                        onSelectAllClick={handleSelectAllClick}
                        onRequestSort={handleRequestSort}
                        rowCount={rows.length}
                        selected={selected}
                        handleDelete={handleDelete}
                        isDeleting={isDeleting}
                        countdown={countdown}
                        cancelDeletion={cancelDeletion}
                    />
                    <TableBody>
                        {rows
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((row, index) => {
                                /** Make sure no display bugs if row isn't an OrderData object */
                                if (typeof row === 'number') return null;
                                const isItemSelected = isSelected(row.id);
                                const labelId = `enhanced-table-checkbox-${index}`;

                                return (
                                    <TableRow
                                        hover
                                        role="checkbox"
                                        aria-checked={isItemSelected}
                                        tabIndex={-1}
                                        key={index}
                                        selected={isItemSelected}
                                    >
                                        <TableCell padding="checkbox" sx={{ pl: 3 }} onClick={() => handleClick(row.id)}>
                                            <Checkbox
                                                color="primary"
                                                checked={isItemSelected}
                                                inputProps={{
                                                    'aria-labelledby': labelId
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell
                                            component="th"
                                            id={labelId}
                                            scope="row"
                                            sx={{ cursor: 'pointer', color: 'primary' }}
                                            onClick={() => handleRow(row)}
                                        >
                                            <Typography
                                                variant="subtitle1"
                                                sx={{ color: '#2196f3' }}
                                            >
                                                {' '}
                                                {row.id}{' '}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{row.backedAt || row.createdAt}</TableCell>
                                        <TableCell align="left">{formatSizeUnits(row.size)}</TableCell>
                                        <TableCell>
                                            {data.type === 'Slack' ?
                                                <>
                                                <strong>User:</strong> {row.email} <br />
                                                <strong>Job Name:</strong> {row.filters?.jobName} <br />
                                                <strong>Keywords:</strong> {row.filters?.keywords} <br /> </> : <>
                                                    <strong>User:</strong> {row.filters?.userEmail} <br />
                                                    <strong>Job Name:</strong> {row.filters?.jobName ? row.filters.jobName : ''} <br />
                                                    <strong>Keywords:</strong> {row.filters?.keywords} <br />
                                                    <strong>DateRanged:</strong> {`${row.filters?.filterByDateRange}`} <br />
                                                    <strong>DateRange:</strong> {row.filters?.filterByDateRange ? `${row.filters?.dateRange.start} ~ ${row.filters?.dateRange.end}` : ''}
                                                </>
                                            }
                                        </TableCell>
                                        <TableCell align="left">
                                            {
                                                getArchiveState(row.archiveState)
                                            }
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        {emptyRows > 0 && (
                            <TableRow
                                style={{
                                    height: 53 * emptyRows
                                }}
                            >
                                <TableCell colSpan={6} />
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* table pagination */}
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={rows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </MainCard>
    );
};

ArchiveLogs.propTypes = {
    data: PropTypes.array,
};

export default ArchiveLogs;
