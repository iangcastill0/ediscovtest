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
    LinearProgress,

} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
// project imports
import MainCard from 'ui-component/cards/MainCard';
import Chip from 'ui-component/extended/Chip';
// assets
import SearchIcon from '@mui/icons-material/Search';
import ArchiveIcon from '@mui/icons-material/Archive';
import RefreshIcon from '@mui/icons-material/Refresh';
import { applyArchive, formatSizeUnits, getArchive } from 'utils/apiHelper';

import { useDispatch } from 'store';
import { openSnackbar } from 'store/slices/snackbar';
import Chart from 'react-apexcharts';

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
        id: 'status',
        numeric: true,
        label: 'Count of Archives',
        align: 'center'
    },
    {
        id: 'totalSize',
        numeric: true,
        label: 'Total Size of Archived',
        align: 'center'
    },
    {
        id: 'updated',
        numeric: false,
        label: 'Last Action Time',
        align: 'left'
    },
    {
        id: 'state',
        numeric: false,
        label: 'Action State',
        align: 'center'
    },
];

// ==============================|| TABLE HEADER ||============================== //

function EnhancedTableHead({ onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort, selected }) {
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
                        <EnhancedTableToolbar numSelected={selected.length} />
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
    rowCount: PropTypes.number.isRequired
};

// ==============================|| TABLE HEADER TOOLBAR ||============================== //

const EnhancedTableToolbar = ({ numSelected }) => (
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
    </Toolbar>
);

EnhancedTableToolbar.propTypes = {
    numSelected: PropTypes.number.isRequired
};

// ==============================|| Public Channel LIST ||============================== //

const ListOfMails = ({ goArchiveList }) => {
    const theme = useTheme();
    const [order, setOrder] = React.useState('asc');
    const [orderBy, setOrderBy] = React.useState('message');
    const [selected, setSelected] = React.useState([]);
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(5);
    const [search, setSearch] = React.useState('');
    const [rows, setRows] = React.useState([]);
    const [originalMessages, setOriginalMessages] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [refresh, setRefresh] = React.useState(false);
    const dispatch = useDispatch();

    React.useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await getArchive();
            setRows(data || []);
            setOriginalMessages(data || []);
            setLoading(false);
        }
        fetchData();
    }, [refresh]);

    const handleRefresh = () => {
        setRefresh(!refresh);
    }

    const searchBy = (newString) => {
        const newRows = rows.filter((row) => {
            let matches = true;

            const properties = ['type', 'name'];
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
    }

    const handleSearch = (event) => {
        const newString = event?.target.value;
        setSearch(newString || '');

        if (newString) {
            searchBy(newString);
        } else {
            setRows(originalMessages);
        }
    };

    const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelectedId = rows.map((n) => n.index);
            setSelected(newSelectedId);
            return;
        }
        setSelected([]);
    };

    const handleClick = (event, name) => {

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

    const handleArchive = async () => {
        const selectedArchiveList = [];
        selected.forEach((ele) => {
            selectedArchiveList.push({ type: originalMessages[ele].type, id: originalMessages[ele].id, name: originalMessages[ele].name });
        });
        console.log("Selected Platforms: ", selectedArchiveList);

        setLoading(true);
        const msg = await applyArchive(selectedArchiveList);
        const data = await getArchive();
        setRows(data || []);
        setOriginalMessages(data || []);
        console.log("msg:", msg);
        setSelected([]);
        setLoading(false);
    }

    const handleRowClick = (row) => {
        console.log("Row: ", row);
        if (row.archives.length < 1) {
            dispatch(
                openSnackbar({
                    open: true,
                    anchorOrigin: { vertical: 'top', horizontal: 'right' },
                    message: 'There is no archive.',
                    variant: 'alert',
                    alert: {
                        color: 'warning'
                    },
                })
            );
            return;
        }

        goArchiveList(row);

    }

    const isSelected = (idx) => selected.indexOf(idx) !== -1;

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

    const getStatusChip = (state) => {
        switch (state) {
            case 'completed':
                return <Chip label="Completed" size="small" chipcolor="success" />;
            case 'queued':
            case 'progress':
                return <Chip label="In Progress" size="small" chipcolor="secondary" />;
            case 'error':
                return <Chip label="Error" size="small" chipcolor="error" />;
            default:
                return <Chip label="None" size="small" chipcolor="orange" />;
        }
    };

    const getChartData = (fileSize, chatSize, id) => {
        const freeSpace = 107374182400 - fileSize - chatSize;
        return {
            height: 200,
            width: 500,
            type: 'donut',
            options: {
                chart: {
                    id
                },
                dataLabels: {
                    enabled: true
                },
                labels: [`FreeSpace: ${formatSizeUnits(freeSpace)}`, `FileSize: ${formatSizeUnits(fileSize)}`, `ChatContentSize: ${formatSizeUnits(chatSize)}`],
                // labels: ['FreeSpace', 'FileSize', 'ChatContentSize'],
                legend: {
                    show: true,
                    position: 'bottom',
                    fontFamily: 'inherit',
                    labels: {
                        colors: 'inherit'
                    },
                    itemMargin: {
                        horizontal: 10,
                        vertical: 10
                    }
                }
            },
            series: [freeSpace, fileSize, chatSize]
        }
    }

    return (
        // <Stack direction="row" alignItems="center">
        <MainCard content={false}>
            <CardContent>
                <Grid container justifyContent="space-between" alignItems="center" spacing={2}>
                    <Grid item>
                        <TextField
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                )
                            }}
                            onChange={handleSearch}
                            placeholder="Search"
                            value={search}
                            size="small"
                        />
                    </Grid>
                    <Grid item>
                        {
                            selected.length > 0 &&
                            <Button sx={{ mr: 1 }} variant="contained" startIcon={<ArchiveIcon />} onClick={handleArchive}>
                                Archive
                            </Button>
                        }
                        <Button variant="contained" startIcon={<RefreshIcon />} onClick={handleRefresh}>
                            Refresh
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>

            {/* table */}
            <TableContainer>
                {loading && <LinearProgress />}
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
                    />
                    <TableBody>
                        {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((row, index) => {
                                /** Make sure no display bugs if row isn't an OrderData object */
                                if (typeof row === 'number') return null;
                                const isItemSelected = isSelected(row.index);
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
                                        <TableCell padding="checkbox" sx={{ pl: 3 }} onClick={(event) => handleClick(event, row.index)}>
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
                                            onClick={() => {
                                                // if(row.type === 'Slack'){
                                                //     navigate(`/archive/type1/${row.id}?name=${row.name}`)
                                                // }
                                                handleRowClick(row);
                                            }}
                                            sx={{ cursor: 'pointer', color: 'priamry' }}
                                        >
                                            <Typography
                                                variant="subtitle1"
                                                sx={{ color: '#2196f3' }}
                                            >
                                                {' '}
                                                {row.name}{' '}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{row.type}</TableCell>
                                        <TableCell align="center">{row.archives.length}</TableCell>
                                        <TableCell align="center">
                                            <Chart {...getChartData(row.fileSize, row.chatContentSize, row.id)} />
                                        </TableCell>
                                        <TableCell align="left">{row.updated}</TableCell>
                                        <TableCell align="center">
                                            {getStatusChip(row.archiveState.state)}
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
        // </Stack>
    );
};

ListOfMails.propTypes = {
    goArchiveList: PropTypes.func.isRequired
};

export default ListOfMails;
