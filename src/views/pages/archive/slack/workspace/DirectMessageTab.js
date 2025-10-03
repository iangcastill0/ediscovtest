import PropTypes from 'prop-types';
import * as React from 'react';

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
    Button,
    Typography,
    FormControlLabel,
    LinearProgress
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// project imports
import Chip from 'ui-component/extended/Chip';
import MainCard from 'ui-component/cards/MainCard';
import Avatar from 'ui-component/extended/Avatar';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// assets
import SearchIcon from '@mui/icons-material/Search';
import { DatePicker } from '@mui/x-date-pickers';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { getExportAll, exportToJSON, exportToZipMultipleJSON, exportToZipMultiplePDF, exportToZipMultiple } from 'utils/apiHelper';
import { useNavigate } from "react-router-dom";
import { SlackContext } from 'contexts/SlackContext';

// table sort
function descendingComparator(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
        return -1;
    }
    if (b[orderBy] > a[orderBy]) {
        return 1;
    }
    return 0;
}

const getComparator = (order, orderBy) =>
    order === 'desc' ? (a, b) => descendingComparator(a, b, orderBy) : (a, b) => -descendingComparator(a, b, orderBy);

function stableSort(array, comparator) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
}

// table header options
const headCells = [
    {
        id: 'name',
        numeric: false,
        label: 'User Name',
        align: 'left'
    },
    {
        id: 'display_name',
        numeric: false,
        label: 'Display Name',
        align: 'left'
    },
    {
        id: 'id',
        numeric: false,
        label: 'User Code',
        align: 'left'
    },
    {
        id: 'authenticated',
        numeric: false,
        label: 'Authenticated',
        align: 'center'
    }
];

// ==============================|| TABLE HEADER ||============================== //

function EnhancedTableHead({ onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort, selected, handleExport, handleExportPDF, handleExportJSON}) {
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
                        <EnhancedTableToolbar numSelected={selected.length} handleExport={handleExport} handleExportPDF={handleExportPDF} handleExportJSON={handleExportJSON} />
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
    handleExport: PropTypes.func.isRequired,
    handleExportPDF: PropTypes.func.isRequired,
    handleExportJSON: PropTypes.func.isRequired
};

// ==============================|| TABLE HEADER TOOLBAR ||============================== //

const EnhancedTableToolbar = ({ numSelected, handleExport, handleExportPDF, handleExportJSON }) => (
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
            <>
                {/* <Button variant="contained" color="error" style={{marginRight: "10px"}} startIcon={<ForwardToInboxIcon />} onClick={handleRequestAuth}>
                    {isLoading && <CircularProgress size="20" />}
                    Request Authorization
                </Button> */}
                <div>
                    <Button variant="contained" color='primary' startIcon={<FileDownloadIcon />} onClick={handleExport} sx={{ mr: 2 }}>
                        Export to HTML
                    </Button>
                    <Button variant="contained" color='warning' startIcon={<FileDownloadIcon />} onClick={handleExportPDF} sx={{ mr: 2 }}>
                        Export to PDF
                    </Button>
                    <Button variant="contained" color='error' startIcon={<FileDownloadIcon />} onClick={handleExportJSON}>
                        Export to JSON
                    </Button>
                </div>
            </>
        )}
    </Toolbar>
);

EnhancedTableToolbar.propTypes = {
    numSelected: PropTypes.number.isRequired,
    handleExport: PropTypes.func.isRequired,
    handleExportPDF: PropTypes.func.isRequired,
    handleExportJSON: PropTypes.func.isRequired
};

// ==============================|| Public Channel LIST ||============================== //

const ArchiveDirectMessageTab = ({ teamId, channels, backupId }) => {
    const theme = useTheme();
    // const dispatch = useDispatch();

    // const { slackData, setSlackData } = React.useContext(SlackContext);
    const [order, setOrder] = React.useState('asc');
    const [orderBy, setOrderBy] = React.useState('name');
    const [selected, setSelected] = React.useState([]);
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(5);
    const [search, setSearch] = React.useState('');
    const [rows, setRows] = React.useState([]);
    const [startDate, setStartDate] = React.useState(new Date());
    const [endDate, setEndDate] = React.useState(new Date());
    const [filterBy, setFilterBy] = React.useState(false);
    const [exporting, setExporting] = React.useState(false);
    const navigate = useNavigate();

    const { members } = React.useContext(SlackContext);

    React.useEffect(() => {
        setRows(channels);
    }, [channels]);
    const handleSearch = (event) => {
        const newString = event?.target.value;
        setSearch(newString || '');

        if (newString) {
            const newRows = rows.filter((row) => {
                let matches = true;

                const properties = ['name'];
                let containsQuery = false;

                properties.forEach((property) => {
                    if (row[property].toString().toLowerCase().includes(newString.toString().toLowerCase())) {
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
            setRows(channels);
        }
    };

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelectedId = rows.map((n) => n.id);
            setSelected(newSelectedId);
            return;
        }
        setSelected([]);
    };

    const handleFilterByDate = (event) => {
        setFilterBy(event.target.checked);
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

    const goMessages = (userId, authenticated) => {
        if (authenticated) {
            navigate(`/archive/Slack/${teamId}/direct-messages/${userId}/backup/${backupId}`);
        }
    }

    const handleChangePage = (newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event?.target.value, 10));
        setPage(0);
    };

    const handleExport = async () => {
        console.log("Export Clicked! ", selected);
        /* eslint-disable no-await-in-loop */
        const channels = [];
        const filenames = [];
        setExporting(true);
        const selectedUsers = rows.filter((row) => selected.indexOf(row.id) !== -1 && row.authenticated);
        for (let i = 0; i < selectedUsers.length; i += 1) {
            let data = {};
            if (filterBy) {
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 0);
                data = await getExportAll(teamId, selectedUsers[i].id, 'archive', startDate.toISOString(), endDate.toISOString(), backupId);
            } else {
                data = await getExportAll(teamId, selectedUsers[i].id, 'archive','' ,'', backupId);
            }
            data.forEach((item) => {
                if (item.data.length > 0) {
                    channels.push(item.data);
                    filenames.push(`${members[item.channel.user] ? (members[item.channel.user].display_name || members[item.channel.user].real_name) : item.channel.user}.html`);
                }
            });
            await exportToZipMultiple(channels, members, filenames, selectedUsers[i].display_name);
        }
        setExporting(false);
        setSelected([]);
    }

    const handleExportPDF = async () => {
        console.log("Export Clicked! ", selected);
        /* eslint-disable no-await-in-loop */
        const channels = [];
        const filenames = [];
        setExporting(true);
        const selectedUsers = rows.filter((row) => selected.indexOf(row.id) !== -1 && row.authenticated);
        for (let i = 0; i < selectedUsers.length; i += 1) {
            let data = {};
            if (filterBy) {
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 0);
                data = await getExportAll(teamId, selectedUsers[i].id, 'archive', startDate.toISOString(), endDate.toISOString(), backupId);
            } else {
                data = await getExportAll(teamId, selectedUsers[i].id, 'archive', '', '', backupId);
            }
            data.forEach((item) => {
                if (item.data.length > 0) {
                    channels.push(item.data);
                    filenames.push(`${members[item.channel.user] ? (members[item.channel.user].display_name || members[item.channel.user].real_name) : item.channel.user}.pdf`);
                }
            });
            await exportToZipMultiplePDF(channels, members, filenames, selectedUsers[i].display_name);
        }
        setExporting(false);
        setSelected([]);
    }

    const handleExportJSON = async () => {
        console.log("Export Clicked! ", selected);
        /* eslint-disable no-await-in-loop */
        const channels = [];
        const filenames = [];
        setExporting(true);

        const selectedUsers = rows.filter((row) => selected.indexOf(row.id) !== -1 && row.authenticated);
        console.log("Authenticated Users: ", selectedUsers);
        for (let i = 0; i < selectedUsers.length; i += 1) {
            if (filterBy) {
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 0);
                const data = await getExportAll(teamId, selectedUsers[i].id, 'archive', startDate.toISOString(), endDate.toISOString(), backupId);
                channels.push(data);
                filenames.push(`${selectedUsers[i].display_name || selectedUsers[i].name}.json`);
            } else {
                const data = await getExportAll(teamId, selectedUsers[i].id, 'archive', '', '', backupId);
                channels.push(data);
                filenames.push(`${selectedUsers[i].display_name || selectedUsers[i].name}.json`);
            }
        }
        if (selectedUsers.length === 1) {
            await exportToJSON(channels[0], members, `${selectedUsers[0].display_name || selectedUsers[0].name}.json`);
        } else {
            await exportToZipMultipleJSON(channels, members, filenames);
        }
        setExporting(false);
        setSelected([]);
    }
    const isSelected = (id) => selected.indexOf(id) !== -1;

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

    return (
        <MainCard title="Users List" content={false}>
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
                            placeholder="Search Users"
                            value={search}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={10} sm={2} sx={{ textAlign: 'right' }}>
                        <FormControlLabel
                            control={<Checkbox checked={filterBy} onChange={handleFilterByDate} color='primary' />}
                            label="Filter by"
                        />
                    </Grid>
                    <Grid item xs={6} sm={2} sx={{ textAlign: 'left' }}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                renderInput={(props) => <TextField {...props} fullWidth helperText="" />}
                                label="Start Date"
                                value={startDate}
                                onChange={(newValue) => {
                                    setStartDate(newValue);
                                }}
                                disabled={!filterBy}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid item xs={6} sm={2} sx={{ textAlign: 'left' }}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                renderInput={(props) => <TextField {...props} fullWidth helperText="" />}
                                label="End Date"
                                value={endDate}
                                onChange={(newValue) => {
                                    setEndDate(newValue);
                                }}
                                disabled={!filterBy}
                            />
                        </LocalizationProvider>
                    </Grid>
                </Grid>
            </CardContent>

            {/* table */}
            <TableContainer>
                {exporting && <LinearProgress />}
                <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
                    <EnhancedTableHead
                        theme={theme}
                        numSelected={selected.length}
                        order={order}
                        orderBy={orderBy}
                        onSelectAllClick={handleSelectAllClick}
                        onRequestSort={handleRequestSort}
                        rowCount={rows.length}
                        selected={selected}
                        handleExport={handleExport}
                        handleExportPDF={handleExportPDF}
                        handleExportJSON={handleExportJSON}
                    />
                    <TableBody>
                        {stableSort(rows, getComparator(order, orderBy))
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
                                        <TableCell padding="checkbox" sx={{ pl: 3 }} onClick={(event) => handleClick(event, row.id)}>
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
                                            onClick={() => goMessages(row.id, row.authenticated)}
                                            sx={{ cursor: 'pointer' }}
                                        >
                                            <Grid container spacing={2} alignItems="center">
                                                <Grid item>
                                                    <Avatar alt="User 1" src={row.avatar} />
                                                </Grid>
                                                <Grid item xs zeroMinWidth>
                                                    <Typography align="left" variant="subtitle1" component="div">
                                                        {row.name}{' '}
                                                        {row.authenticated && (
                                                            <CheckCircleIcon sx={{ color: 'success.dark', width: 14, height: 14 }} />
                                                        )}
                                                    </Typography>
                                                    <Typography align="left" variant="subtitle2" noWrap>
                                                        {row.email}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                            {/* <Typography
                                                variant="subtitle1"
                                                sx={{ color: theme.palette.mode === 'dark' ? 'grey.600' : 'grey.900' }}
                                            >
                                                {' '}
                                                {row.name}{' '}
                                            </Typography> */}
                                        </TableCell>
                                        <TableCell>{row.display_name}</TableCell>
                                        <TableCell>{row.id}</TableCell>
                                        <TableCell align="center">
                                            {row.authenticated && <Chip label="Authenticated" size="small" chipcolor="success" />}
                                            {!row.authenticated && <Chip label="Not Authenticated" size="small" chipcolor="orange" />}
                                        </TableCell>
                                        {/* <TableCell align="center" sx={{ pr: 3 }}>
                                            <IconButton color="primary" size="large">
                                                <VisibilityTwoToneIcon sx={{ fontSize: '1.3rem' }} />
                                            </IconButton>
                                            <IconButton color="secondary" size="large">
                                                <EditTwoToneIcon sx={{ fontSize: '1.3rem' }} />
                                            </IconButton>
                                        </TableCell> */}
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

ArchiveDirectMessageTab.propTypes = {
    channels: PropTypes.array.isRequired,
    teamId: PropTypes.string.isRequired,
    backupId: PropTypes.string.isRequired
};


export default ArchiveDirectMessageTab;
