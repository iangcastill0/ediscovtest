import PropTypes from 'prop-types'
import * as React from 'react'

// material-ui
import { useTheme } from '@mui/material/styles'
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
    LinearProgress,
    Button
} from '@mui/material'
import { useDispatch } from 'store'
import { visuallyHidden } from '@mui/utils'
// project imports
import MainCard from 'ui-component/cards/MainCard'
import Avatar from 'ui-component/extended/Avatar'

// assets
import SearchIcon from '@mui/icons-material/Search'
import { useNavigate, useParams } from 'react-router-dom'

import { openSnackbar } from 'store/slices/snackbar'
import ArchiveWizard from './ArchiveWizard'
import axios from 'utils/axios';

// table sort
function descendingComparator (a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
        return -1
    }
    if (b[orderBy] > a[orderBy]) {
        return 1
    }
    return 0
}

const getComparator = (order, orderBy) =>
    order === 'desc' ? (a, b) => descendingComparator(a, b, orderBy) : (a, b) => -descendingComparator(a, b, orderBy)

function stableSort (array, comparator) {
    const stabilizedThis = array.map((el, index) => [el, index])
    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0])
        if (order !== 0) return order
        return a[1] - b[1]
    })
    return stabilizedThis.map(el => el[0])
}

// table header options
const headCells = [
    {
        id: 'name',
        numeric: false,
        label: 'Display Name',
        align: 'left'
    },
    {
        id: 'email',
        numeric: false,
        label: 'Email',
        align: 'left'
    },
    {
        id: 'emailVerified',
        numeric: false,
        label: 'Active',
        align: 'left'
    }
]

// ==============================|| TABLE HEADER ||============================== //

function EnhancedTableHead ({ onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort, selected }) {
    const createSortHandler = property => event => {
        onRequestSort(event, property)
    }

    return (
        <TableHead>
            <TableRow>
                <TableCell padding='checkbox' sx={{ pl: 3 }}>
                    <Checkbox
                        color='primary'
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={rowCount > 0 && numSelected === rowCount}
                        onChange={onSelectAllClick}
                        inputProps={{
                            'aria-label': 'select all desserts'
                        }}
                    />
                </TableCell>
                {numSelected > 0 && (
                    <TableCell padding='none' colSpan={6}>
                        <EnhancedTableToolbar numSelected={selected.length} />
                    </TableCell>
                )}
                {numSelected <= 0 &&
                    headCells.map(headCell => (
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
                                    <Box component='span' sx={visuallyHidden}>
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
    )
}

EnhancedTableHead.propTypes = {
    selected: PropTypes.array,
    numSelected: PropTypes.number.isRequired,
    onRequestSort: PropTypes.func.isRequired,
    onSelectAllClick: PropTypes.func.isRequired,
    order: PropTypes.oneOf(['asc', 'desc']).isRequired,
    orderBy: PropTypes.string.isRequired,
    rowCount: PropTypes.number.isRequired
}

// ==============================|| TABLE HEADER TOOLBAR ||============================== //

const EnhancedTableToolbar = ({ numSelected }) => (
    <Toolbar
        sx={{
            p: 0,
            pl: 1,
            pr: 1,
            ...(numSelected > 0 && {
                color: theme => theme.palette.secondary.main
            })
        }}
    >
        {numSelected > 0 ? (
            <Typography color='inherit' variant='h4'>
                {numSelected} Selected
            </Typography>
        ) : (
            <Typography variant='h6' id='tableTitle'>
                No selection
            </Typography>
        )}
        <Box sx={{ flexGrow: 1 }} />
    </Toolbar>
)

EnhancedTableToolbar.propTypes = {
    numSelected: PropTypes.number.isRequired
}

// ==============================|| Google Workspace Users ||============================== //

const DropboxMembers = () => {
    const theme = useTheme()
    const { workspaceId } = useParams()
    
    // const { slackData, setSlackData } = React.useContext(SlackContext);
    const [order, setOrder] = React.useState('asc')
    const [orderBy, setOrderBy] = React.useState('name')
    const [selected, setSelected] = React.useState([])
    const [page, setPage] = React.useState(0)
    const [rowsPerPage, setRowsPerPage] = React.useState(5)
    const [search, setSearch] = React.useState('')
    const [rows, setRows] = React.useState([])
    const [originalRows, setOriginalRows] = React.useState([])
    const [loading, setLoading] = React.useState(false)
    const [openArchiveWizard, setOpenArchiveWizard] = React.useState(false);
    const navigate = useNavigate()
    const dispatch = useDispatch();

    const query = new URLSearchParams(window.location.search);
    const isPersonal = query.get('isPersonal');
    // const { resetAccessToken } = React.useContext(GoogleContext)

    React.useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            const resp = await axios.get(`/dropbox/workspace/${workspaceId}/members`)
            if (resp.data?.ok) {
                setRows(resp.data.data)
                setOriginalRows(resp.data.data)
            }
            setLoading(false)
        }
        fetchData()
    }, [workspaceId])

    const handleSearch = event => {
        const newString = event?.target.value
        setSearch(newString || '')

        if (newString) {
            const newRows = originalRows.filter(row => {
                let matches = true

                const properties = ['name', 'email', 'emailVerified']
                let containsQuery = false

                properties.forEach(property => {
                    if (row[property] && row[property].toString().toLowerCase().includes(newString.toString().toLowerCase())) {
                        containsQuery = true
                    }
                })

                if (!containsQuery) {
                    matches = false
                }
                return matches
            })
            setRows(newRows)
        } else {
            setRows(originalRows)
        }
    }

    const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === 'asc'
        setOrder(isAsc ? 'desc' : 'asc')
        setOrderBy(property)
    }

    const handleSelectAllClick = event => {
        if (event.target.checked) {
            const newSelectedId = rows.map(n => n.id)
            setSelected(newSelectedId)
            return
        }
        setSelected([])
    }

    const handleClick = (event, name) => {
        const selectedIndex = selected.indexOf(name)
        let newSelected = []

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, name)
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1))
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1))
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1))
        }

        setSelected(newSelected)
    }

    const goMessages = (event, userId) => {
        // TO-DO
        if (userId) {
            navigate(`/dropbox/workspace/${workspaceId}/users/${userId}/tabs?isPersonal=${isPersonal}`)
        } else {
            alert('Invalid User')
        }
    }

    const handleChangePage = (event, newPage) => {
        setPage(newPage)
    }

    const handleChangeRowsPerPage = event => {
        setRowsPerPage(parseInt(event?.target.value, 10))
        setPage(0)
    }

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

    const handleArchive = () => {
        setOpenArchiveWizard(true);
    }

    const isSelected = id => selected.indexOf(id) !== -1

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0

    return (
        <MainCard title='Users List' content={false} backButton>
            <CardContent>
                <Grid container justifyContent='space-between' >
                    <Grid item xs={12} sm={6}>
                        <TextField
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position='start'>
                                        <SearchIcon fontSize='small' />
                                    </InputAdornment>
                                )
                            }}
                            onChange={handleSearch}
                            placeholder='Search Users'
                            value={search}
                            size='small'
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} container justifyContent='flex-end'>
                        <Button color='primary' onClick={handleArchive} size='large' variant='contained'>
                            Archive
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>

            {/* table */}
            <TableContainer>
                {loading && <LinearProgress />}
                <Table sx={{ minWidth: 750 }} aria-labelledby='tableTitle'>
                    <EnhancedTableHead
                        theme={theme}
                        numSelected={selected.length}
                        order={order}
                        orderBy={orderBy}
                        onSelectAllClick={handleSelectAllClick}
                        onRequestSort={handleRequestSort}
                        rowCount={rows.length}
                        selected={selected}
                        // handleRequestAuth={handleRequestAuth}
                        // authorizing={authorizing}
                    />
                    <TableBody>
                        {stableSort(rows, getComparator(order, orderBy))
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((row, index) => {
                                /** Make sure no display bugs if row isn't an OrderData object */
                                if (typeof row === 'number') return null
                                const isItemSelected = isSelected(row.id)
                                const labelId = `enhanced-table-checkbox-${index}`

                                return (
                                    <TableRow
                                        hover
                                        role='checkbox'
                                        aria-checked={isItemSelected}
                                        tabIndex={-1}
                                        key={index}
                                        selected={isItemSelected}
                                    >
                                        <TableCell padding='checkbox' sx={{ pl: 3 }} onClick={event => handleClick(event, row.id)}>
                                            <Checkbox
                                                color='primary'
                                                checked={isItemSelected}
                                                inputProps={{
                                                    'aria-labelledby': labelId
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell
                                            component='th'
                                            id={labelId}
                                            scope='row'
                                            onClick={event => goMessages(event, row.email)}
                                            sx={{ cursor: 'pointer' }}
                                        >
                                            <Grid container spacing={2} alignItems='center'>
                                                <Grid item>
                                                    <Avatar alt='User 1' />
                                                </Grid>
                                                <Grid item xs zeroMinWidth>
                                                    <Typography align='left' variant='subtitle1' component='div'>
                                                        {row.name}{' '}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </TableCell>
                                        <TableCell>{row.email}</TableCell>
                                        <TableCell>{row.emailVerified}</TableCell>
                                    </TableRow>
                                )
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
            <ArchiveWizard open={openArchiveWizard} workspaceId={workspaceId} users={rows} isPersonal={isPersonal} onClose={() => setOpenArchiveWizard(false)} onArchived={onArchived} onError={onError}/>
            {/* table pagination */}
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component='div'
                count={rows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </MainCard>
    )
}

export default DropboxMembers
