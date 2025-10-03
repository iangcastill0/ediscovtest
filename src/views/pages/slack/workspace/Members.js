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
    CircularProgress
} from '@mui/material';
import { useDispatch } from 'store';
import { visuallyHidden } from '@mui/utils';
// project imports
import Chip from 'ui-component/extended/Chip';
import MainCard from 'ui-component/cards/MainCard';
import Avatar from 'ui-component/extended/Avatar';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';

// assets
import SearchIcon from '@mui/icons-material/Search';
import { slackArchiveMembers, sendRequestEmail, getSubscriptionPlanStatus } from 'utils/apiHelper';
import { useNavigate, useParams } from "react-router-dom";
import { SlackContext } from 'contexts/SlackContext';

import { openSnackbar } from 'store/slices/snackbar';
import ArchiveWizard from './ArchiveWizard'

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

function EnhancedTableHead({ onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort, selected, handleArchive, handleRequestAuth, authorizing }) {
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
                        <EnhancedTableToolbar numSelected={selected.length} handleArchive={handleArchive} handleRequestAuth={handleRequestAuth} authorizing={authorizing} />
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
    rowCount: PropTypes.number.isRequired,
    handleArchive: PropTypes.func.isRequired,
    handleRequestAuth: PropTypes.func.isRequired,
    authorizing: PropTypes.bool.isRequired
};

// ==============================|| TABLE HEADER TOOLBAR ||============================== //

const EnhancedTableToolbar = ({ numSelected, handleArchive, handleRequestAuth, authorizing }) => (
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
            <>
                <Button variant="contained" color="error" style={{ marginRight: "10px" }} onClick={handleRequestAuth} startIcon={authorizing ? null : <ForwardToInboxIcon />}>
                    {authorizing && <CircularProgress size="20" sx={{ mr: 1, color: 'white', width: 18 }} />}
                    Request Authorization
                </Button>
                {/* <Button variant="contained" color='primary' onClick={handleArchive}>
                    Archive
                </Button> */}
            </>
        )}
    </Toolbar>
);

EnhancedTableToolbar.propTypes = {
    numSelected: PropTypes.number.isRequired,
    handleArchive: PropTypes.func.isRequired,
    handleRequestAuth: PropTypes.func.isRequired,
    authorizing: PropTypes.bool.isRequired
};

// ==============================|| Public Channel LIST ||============================== //

const Members = () => {
    const theme = useTheme();
    const dispatch = useDispatch();

    const [order, setOrder] = React.useState('asc');
    const [orderBy, setOrderBy] = React.useState('name');
    const [selected, setSelected] = React.useState([]);
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(5);
    const [search, setSearch] = React.useState('');
    const [rows, setRows] = React.useState([]);
    const [authorizing, setAuthorizing] = React.useState(false);
    const [openArchiveWizard, setOpenArchiveWizard] = React.useState(false);
    const [loading, setLoading] = React.useState(false)
    const [userPlanStatus, setUserPlanStatus] = React.useState(null);
    const { id } = useParams();
    const navigate = useNavigate();

    const { members, getMembers, realMembers, getRealMembers } = React.useContext(SlackContext);

    React.useEffect(() => {
        const fetch = async () => {
            setLoading(true)
            await getMembers(id)
            await getRealMembers(id)
            setLoading(false)
        }

        fetch();
    }, [id, getRealMembers, getMembers]);

    React.useEffect(() => {
        setRows(realMembers || []);
    }, [realMembers]);

    React.useEffect(() => {
        const statusFetch = async () => {
            const userPlanStatusInfo = await getSubscriptionPlanStatus();
            setUserPlanStatus(userPlanStatusInfo.data);
        }
        statusFetch();
    }, []);

    // React.useEffect(() => {
    //     console.log('userPlanStatus:', JSON.stringify(userPlanStatus, null, 2))
    // }, [userPlanStatus]);

    const query = new URLSearchParams(window.location.search);
    const title = query.get('name');

    const handleSearch = (event) => {
        const newString = event?.target.value;
        setSearch(newString || '');

        if (newString) {
            const newRows = realMembers.filter((row) => {
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
            setRows(realMembers);
        }
    };

    const handleRequestSort = (event, property) => {
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

    const goMessages = (event, userId, authenticated) => {
        if (authenticated) {
            navigate(`/slack/team/${id}/users/${userId}?workspaceName=${title}&userName=${members[userId]?.display_name || members[userId]?.real_name}`);
        } else {
            dispatch(openSnackbar({
                open: true,
                message: 'Please request authorization first!',
                variant: 'alert',
                alert: {
                    color: 'warning'
                },
                close: true
            }));
        }
    }

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event?.target.value, 10));
        setPage(0);
    };

    const handleArchive = async () => {
        const selectedUsers = rows.filter((row) => selected.indexOf(row.id) !== -1 && row.authenticated);
        const memberIds = selectedUsers.map((user) => user.id);
        if (memberIds.length < 1) {
            dispatch(openSnackbar({
                open: true,
                message: 'Select the authenticated members to archive!',
                variant: 'alert',
                alert: {
                    color: 'warning'
                },
                close: true
            }));

            return;
        }
        setLoading(true);
        await slackArchiveMembers(id, memberIds);
        setLoading(false);
        dispatch(openSnackbar({
            open: true,
            message: 'Successfully queued to archive!',
            variant: 'alert',
            alert: {
                color: 'success'
            },
            close: true
        }));
        setSelected([]);
    };

    const handleRequestAuth = async () => {
        setAuthorizing(true);
        const selectedUsers = rows.filter((row) => selected.indexOf(row.id) !== -1 && !row.authenticated);
        const mailsTo = selectedUsers.map((user) => user.email);
        if (mailsTo.length > 0) {
            await sendRequestEmail(id, mailsTo);
        }
        setAuthorizing(false);
        dispatch(openSnackbar({
            open: true,
            message: 'Sent successfully!',
            variant: 'alert',
            alert: {
                color: 'success'
            },
            close: true
        }));
        setSelected([]);
    };

    const onArchived = () => {
        dispatch(openSnackbar({
            open: true,
            message: 'Successfully queued to archive!',
            variant: 'alert',
            alert: {
                color: 'success'
            },
            close: true
        }));
    }

    const onError = () => {
        dispatch(openSnackbar({
            open: true,
            message: 'Dropbox service is unavailable for now. Please try again later',
            variant: 'alert',
            alert: {
                color: 'error'
            },
            close: true
        }));
    }

    const onLimitError = () => {
        dispatch(openSnackbar({
            open: true,
            message: 'Your storage space is limited for now. Please try check subscription plans.',
            variant: 'alert',
            alert: {
                color: 'error'
            },
            close: true
        }));
    }

    const openArchive = () => {
        // if (userPlanStatus.length > 0) {
        //     const totalSize = userPlanStatus[0].slackArchives.totalSize + userPlanStatus[0].outlookArchives.totalSize + userPlanStatus[0].onedriveArchives.totalSize + userPlanStatus[0].gmailArchives.totalSize + userPlanStatus[0].googledriveArchives.totalSize + userPlanStatus[0].dropboxArchives.totalSize;// byte
        //     let totalTBSize = 0;
        //     if (totalSize > 0) {
        //         totalTBSize = totalSize / 1099511627776;// TB
        //     }
        //     const storageSpace = userPlanStatus[0].Subscription.storageSpace;// TB
        //     if (storageSpace <= totalTBSize) {
        //         onLimitError();
        //     } else {
                setOpenArchiveWizard(true);
        //     }
        // }
    }

    const isSelected = (id) => selected.indexOf(id) !== -1;

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

    return (
        <MainCard title={`Members of ${title}`} content={false} backButton>
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
                    <Grid item xs={12} sm={6} container justifyContent='flex-end'>
                        <Button color='primary' onClick={openArchive} size='large' variant='contained'>
                            Archive
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>

            {/* table */}
            <TableContainer>
                {(loading) && <LinearProgress />}
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
                        handleArchive={handleArchive}
                        handleRequestAuth={handleRequestAuth}
                        authorizing={authorizing}
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
                                            onClick={(event) => goMessages(event, row.user_id, row.authenticated)}
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
                                        </TableCell>
                                        <TableCell>{row.display_name}</TableCell>
                                        <TableCell>{row.id}</TableCell>
                                        <TableCell align="center">
                                            {row.authenticated && <Chip label="Authenticated" size="small" chipcolor="success" />}
                                            {!row.authenticated && <Chip label="Not Authenticated" size="small" chipcolor="orange" />}
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
            <ArchiveWizard open={openArchiveWizard} workspaceId={id} users={rows.filter((row) => row.authenticated)} onClose={() => setOpenArchiveWizard(false)} onArchived={onArchived} onError={onError}/>
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

export default Members;
