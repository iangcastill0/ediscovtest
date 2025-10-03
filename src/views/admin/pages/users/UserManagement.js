import PropTypes from 'prop-types';
import * as React from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
    Box,
    Button,
    CardContent,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
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
    LinearProgress,
    Menu,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Chip,
    OutlinedInput,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import { getUsers, suspendUser, unSuspendUser, addUser, deleteUsers } from 'utils/adminApis';
import { formatSizeUnits } from 'utils/apiHelper';
import { openSnackbar } from 'store/slices/snackbar';
import { useDispatch } from 'store';

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
        id: 'email',
        numeric: false,
        label: 'Email',
        align: 'center'
    },
    {
        id: 'name',
        numeric: false,
        label: 'Name',
        align: 'left'
    },
    {
        id: 'roles',
        numeric: false,
        label: 'Roles',
        align: 'center'
    },
    {
        id: 'teamCount',
        numeric: true,
        label: 'Workspaces Count',
        align: 'center'
    },
    {
        id: 'backupCount',
        numeric: true,
        label: 'Archives Count',
        align: 'center'
    },
    {
        id: 'backupSize',
        numeric: true,
        label: 'Total Size',
        align: 'center'
    },
    {
        id: 'plan',
        numeric: false,
        label: 'Subscription Plan',
        align: 'left'
    },
    {
        id: 'limit',
        numeric: false,
        label: 'Limited Space',
        align: 'left'
    },
    {
        id: 'createdAt',
        numeric: true,
        label: 'Created',
        align: 'center'
    },
    {
        id: 'isSuspended',
        numeric: false,
        label: 'Status',
        align: 'left'
    }
];

// ==============================|| TABLE HEADER ||============================== //

function EnhancedTableHead({ onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort, theme, selected, onDeleteSelected }) {
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
                    <TableCell padding="none" colSpan={7}>
                        <EnhancedTableToolbar numSelected={selected.length} onDeleteSelected={onDeleteSelected} />
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
                                {orderBy === headCell?.id ? (
                                    <Box component="span" sx={visuallyHidden}>
                                        {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                    </Box>
                                ) : null}
                            </TableSortLabel>
                        </TableCell>
                    ))}
                {numSelected <= 0 && (
                    <TableCell sortDirection={false} align="center" sx={{ pr: 3 }}>
                        <Typography variant="subtitle1" sx={{ color: theme.palette.mode === 'dark' ? 'grey.600' : 'grey.900' }}>
                            Action
                        </Typography>
                    </TableCell>
                )}
            </TableRow>
        </TableHead>
    );
}

EnhancedTableHead.propTypes = {
    theme: PropTypes.object,
    selected: PropTypes.array,
    numSelected: PropTypes.number.isRequired,
    onRequestSort: PropTypes.func.isRequired,
    onSelectAllClick: PropTypes.func.isRequired,
    onDeleteSelected: PropTypes.func.isRequired,
    order: PropTypes.oneOf(['asc', 'desc']).isRequired,
    orderBy: PropTypes.string.isRequired,
    rowCount: PropTypes.number.isRequired
};

// ==============================|| TABLE HEADER TOOLBAR ||============================== //

const EnhancedTableToolbar = ({ numSelected, onDeleteSelected }) => (
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
            <>
                <Typography color="inherit" variant="h4">
                    {numSelected} Selected
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Button 
                    variant="contained" 
                    color="error" 
                    onClick={onDeleteSelected}
                >
                    Remove Selected
                </Button>
            </>
        ) : (
            <Typography variant="h6" id="tableTitle">
                Users
            </Typography>
        )}
    </Toolbar>
);

EnhancedTableToolbar.propTypes = {
    numSelected: PropTypes.number.isRequired,
    onDeleteSelected: PropTypes.func.isRequired
};

// ==============================|| USERS LIST ||============================== //

const UsersList = () => {
    const theme = useTheme();
    const dispatch = useDispatch();

    const [loading, setLoading] = React.useState(false);
    const [order, setOrder] = React.useState('asc');
    const [orderBy, setOrderBy] = React.useState('calories');
    const [selected, setSelected] = React.useState([]);
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(5);
    const [search, setSearch] = React.useState('');
    const [originalData, setOriginalData] = React.useState('');
    const [rows, setRows] = React.useState([]);
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [crrentEmail, setCurrentEmail] = React.useState('');
    const [currentSuspend, setCurrentSuspend] = React.useState(false);
    const [refresh, setRefresh] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
    
    // Add user dialog state
    const [openAddDialog, setOpenAddDialog] = React.useState(false);
    const [newUser, setNewUser] = React.useState({
        email: '',
        name: '',
        password: '',
        confirmPassword: '',
        roles: ['customer'] // Default role
    });
    const [errors, setErrors] = React.useState({});

    const open = Boolean(anchorEl);

    React.useEffect(() => {
        setLoading(true);
        const fetchUsers = async () => {
            const response = await getUsers();
            if (response.ok) {
                setOriginalData(response.data);
                setRows(response.data)
            } else {
                setRows([]);
            }
            setLoading(false);
        }
        fetchUsers();
    }, [refresh]);

    const handleSearch = (event) => {
        const newString = event?.target.value;
        setSearch(newString || '');

        if (newString) {
            const newRows = rows.filter((row) => {
                let matches = true;

                // const properties = ['email', 'name'];
                const properties = ['email'];
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
            setRows(originalData);
        }
    };

    const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        console.log("OrderBy: ", property);
        setOrderBy(property);
    };

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelectedId = rows.map((n) => n.name);
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

    const handleSuspend = async () => {
        if (crrentEmail) {
            const response = currentSuspend ? await unSuspendUser(crrentEmail) : await suspendUser(crrentEmail);
            if (response.ok) {
                dispatch(openSnackbar({
                    open: true,
                    message: 'Successfully supended!',
                    variant: 'alert',
                    alert: {
                        color: 'success'
                    },
                    close: true
                }));

                setRefresh(!refresh);
            } else {
                dispatch(openSnackbar({
                    open: true,
                    message: response.data,
                    variant: 'alert',
                    alert: {
                        color: 'error'
                    },
                    close: true
                }));
            }
        } 
    };

    const handleGo = () => {
        // Logic for "go" action
    };

    const handleMenuClick = (event, email, isSuspended) => {
        setAnchorEl(event.currentTarget);
        setCurrentEmail(email);
        setCurrentSuspend(isSuspended);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleAddUser = async () => {
        // Validate inputs
        const newErrors = {};
        if (!newUser.email) newErrors.email = 'Email is required';
        if (!newUser.name) newErrors.name = 'Name is required';
        if (!newUser.password) newErrors.password = 'Password is required';
        if (newUser.password !== newUser.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        const response = await addUser({
            email: newUser.email,
            name: newUser.name,
            password: newUser.password,
            roles: newUser.roles
        })
        if (response.data.ok) {
            dispatch(openSnackbar({
                open: true,
                message: 'User added successfully!',
                variant: 'alert',
                alert: {
                    color: 'success'
                },
                close: true
            }));
            setRefresh(!refresh);
            setOpenAddDialog(false);
            setNewUser({
                email: '',
                name: '',
                password: '',
                confirmPassword: ''
            });
        } else {
            dispatch(openSnackbar({
                open: true,
                message: response.data.message || 'Failed to add user',
                variant: 'alert',
                alert: {
                    color: 'error'
                },
                close: true
            }));
        }
        setLoading(false);
    };

    const handleDeleteSelected = () => {
        if (selected.length === 0) return;
        
        if (window.confirm(`Are you sure you want to delete ${selected.length} selected users?`)) {
            setLoading(true);
            deleteUsers(selected).then(response => {
                if (response.ok) {
                    dispatch(openSnackbar({
                        open: true,
                        message: `${selected.length} users deleted successfully!`,
                        variant: 'alert',
                        alert: {
                            color: 'success'
                        },
                        close: true
                    }));
                    setSelected([]);
                    setRefresh(!refresh);
                } else {
                    dispatch(openSnackbar({
                        open: true,
                        message: response.data || 'Failed to delete users',
                        variant: 'alert',
                        alert: {
                            color: 'error'
                        },
                        close: true
                    }));
                }
                setLoading(false);
            });
        }
    };

    const isSelected = (name) => selected.indexOf(name) !== -1;
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;
    const availableRoles = ['admin', 'customer'];

    return (
        <MainCard content={false}>
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
                            placeholder="Search Email"
                            value={search}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ textAlign: 'right' }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenAddDialog(true)}
                        >
                            Add User
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>

            {/* Add User Dialog */}
            <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
                <DialogTitle>
                    <Box display="flex" alignItems="center">
                        <PersonAddIcon color="primary" sx={{ mr: 1 }} />
                        <span>Add New User</span>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                                error={!!errors.email}
                                helperText={errors.email}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <EmailIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Name"
                                value={newUser.name}
                                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                                error={!!errors.name}
                                helperText={errors.name}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PersonIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel id="roles-label">Roles</InputLabel>
                                <Select
                                    labelId="roles-label"
                                    id="roles-select"
                                    multiple
                                    value={newUser.roles}
                                    onChange={(e) => setNewUser({...newUser, roles: e.target.value})}
                                    input={<OutlinedInput id="select-multiple-chip" label="Roles" />}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                                            <GroupsIcon sx={{ mr: 1 }} />
                                            {selected.map((value) => (
                                                <Chip key={value} label={value} />
                                            ))}
                                        </Box>
                                    )}
                                >
                                    {availableRoles.map((role) => (
                                        <MenuItem key={role} value={role}>
                                            {role}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                value={newUser.password}
                                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                                error={!!errors.password}
                                helperText={errors.password}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockIcon color="action" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Confirm Password"
                                type={showConfirmPassword ? "text" : "password"}
                                value={newUser.confirmPassword}
                                onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                                error={!!errors.confirmPassword}
                                helperText={errors.confirmPassword}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockIcon color="action" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                edge="end"
                                            >
                                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
                    <Button 
                        onClick={handleAddUser} 
                        variant="contained" 
                        disabled={loading}
                    >
                        {loading ? 'Adding...' : 'Add User'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* table */}
            <TableContainer>
                {loading && <LinearProgress />}
                <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
                    <EnhancedTableHead
                        numSelected={selected.length}
                        order={order}
                        orderBy={orderBy}
                        onSelectAllClick={handleSelectAllClick}
                        onRequestSort={handleRequestSort}
                        rowCount={rows.length}
                        theme={theme}
                        selected={selected}
                        ononDeleteSelected={handleDeleteSelected}
                    />
                    <TableBody>
                        {stableSort(rows, getComparator(order, orderBy))
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((row, index) => {
                                if (typeof row === 'number') return null;
                                const isItemSelected = isSelected(row.email);
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
                                        <TableCell padding="checkbox" sx={{ pl: 3 }} onClick={(event) => handleClick(event, row.email)}>
                                            <Checkbox
                                                color="primary"
                                                checked={isItemSelected}
                                                inputProps={{
                                                    'aria-labelledby': labelId
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell
                                            align='left'
                                            component="th"
                                            id={labelId}
                                            scope="row"
                                            onClick={(event) => handleClick(event, row.email)}
                                            sx={{ cursor: 'pointer' }}
                                        >
                                            <Typography
                                                variant="subtitle1"
                                                sx={{ color: theme.palette.mode === 'dark' ? 'grey.600' : 'grey.900' }}
                                            >
                                                {row.email}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{row.name || '-'}</TableCell>
                                        <TableCell>{row.roles ? row.roles.join(',') : 'customer'}</TableCell>
                                        <TableCell align="center">{row.slackCount + row.ms365Count + row.googleCount + row.dropboxCount}</TableCell>
                                        <TableCell align="center">{row.slackArchives.count + row.outlookArchives.count + row.onedriveArchives.count + row.gmailArchives.count + row.googledriveArchives.count + row.dropboxArchives.count}</TableCell>
                                        <TableCell align="left">{formatSizeUnits(row.slackArchives.totalSize + row.outlookArchives.totalSize + row.onedriveArchives.totalSize + row.gmailArchives.totalSize + row.googledriveArchives.totalSize + row.dropboxArchives.totalSize)}</TableCell>
                                        <TableCell align="center">{row.Subscription? row.Subscription.title : ''}</TableCell>
                                        <TableCell align="center">
                                            {row.Subscription ? (
                                                <>
                                                {row.Subscription.workspaceCount > 99 ? 'Unlimited' : row.Subscription.workspaceCount} Workspaces<br />
                                                {row.Subscription.storageSpace}TB Storage
                                                </>
                                            ) : (
                                                ''
                                            )}
                                        </TableCell>
                                        <TableCell align="center">{row.createdAt}</TableCell>
                                        <TableCell align="left">{row.isSuspended ? 'Suspended' : 'Active'}</TableCell>
                                        <TableCell align="center" sx={{ pr: 3 }}>
                                            <IconButton size="large" onClick={(e) => handleMenuClick(e, row.email, row.isSuspended)}>
                                                <MoreHorizOutlinedIcon sx={{ fontSize: '1.3rem' }} />
                                            </IconButton>
                                            <Menu
                                                anchorEl={anchorEl}
                                                open={open}
                                                onClose={handleClose}
                                            >
                                                <MenuItem onClick={() => { handleGo(row.email); handleClose(); }}>
                                                    Go actions
                                                </MenuItem>
                                                <MenuItem onClick={() => { handleSuspend(); handleClose(); }}>
                                                    {currentSuspend ? 'Unsuspend' : 'Suspend'}
                                                </MenuItem>
                                            </Menu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        {emptyRows > 0 && (
                            <TableRow style={{ height: 53 * emptyRows }}>
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

export default UsersList;
