import PropTypes from 'prop-types';
import * as React from 'react';
import axios from "utils/axios";
// material-ui
import { useTheme } from '@mui/material/styles';
import { useDispatch } from 'store';
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
    LinearProgress,
    CardMedia,
    CircularProgress,
    Badge, styled
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { SlackContext } from 'contexts/SlackContext';
import useDownload from 'hooks/useDownload';

// project imports
import MainCard from 'ui-component/cards/MainCard';

// assets
import SearchIcon from '@mui/icons-material/Search';
import { DatePicker } from '@mui/x-date-pickers';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useParams } from 'react-router-dom';
import { exportToZip, exportToPDF, exportToJSON, getGroupChannelMessages2, getSlackImage, emojis } from 'utils/apiHelper';
import ThreadsModal from '../workspace/ThreadsModal';
import Carousel, { Modal, ModalGateway } from 'react-images';

import { openSnackbar } from 'store/slices/snackbar';
import Flag from 'ui-component/extended/Flag';
import '../style.css';
import { getStoredCollectionMap } from 'utils/apiHelper';

const OutlinedBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        background: theme.palette.background.paper,
        color: theme.palette.primary.main,
        border: `1px solid ${theme.palette.primary.main}`,
        padding: '0 4px'
    }
}));

// table header options
const headCells = [
    {
        id: 'message',
        numeric: false,
        label: 'Messages',
        align: 'left'
    },
    {
        id: 'started_by',
        numeric: false,
        label: 'Started By',
        align: 'left'
    },
    {
        id: 'created',
        numeric: false,
        label: 'Date Created',
        align: 'left'
    },
    {
        id: 'replies',
        numeric: true,
        label: 'Replies',
        align: 'center'
    },
    {
        id: 'reactions',
        numeric: false,
        label: 'Reactions',
        align: 'left'
    }
];

// ==============================|| TABLE HEADER ||============================== //

function EnhancedTableHead({ onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort, selected, handleExport, handleExportPDF, handleExportJSON }) {
    const createSortHandler = (property) => (event) => {
        onRequestSort(event, property);
    };

    return (
        <TableHead>
            <TableRow>
                <TableCell padding="checkbox" sx={{ pl: 3 }}>
                    {/* <Flag /> */}
                </TableCell>
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
    handleExportJSON: PropTypes.func.isRequired,
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
            // <ExportButton exportToHtml={handleExport} />
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

const GroupChannelMessages = () => {
    const theme = useTheme();
    // const dispatch = useDispatch();

    const { members, getMembers } = React.useContext(SlackContext);
    const [order, setOrder] = React.useState('asc');
    const [orderBy, setOrderBy] = React.useState('message');
    const [selected, setSelected] = React.useState([]);
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(5);
    const [search, setSearch] = React.useState('');
    const [rows, setRows] = React.useState([]);
    const [originalMessages, setOriginalMessages] = React.useState([]);
    const [startDate, setStartDate] = React.useState(new Date());
    const [endDate, setEndDate] = React.useState(new Date());
    const [filterBy, setFilterBy] = React.useState(false);
    const { teamId, userId, name, channelId } = useParams();
    // show a right sidebar when clicked on new threads
    const [threads, setThreads] = React.useState({})
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [exporting, setExporting] = React.useState(false);
    const [modal, setModal] = React.useState(false);
    const [images, setImages] = React.useState('');
    const dispatch = useDispatch();
    const [downloadProgress, setDownloadProgress] = React.useState({});
    const [isDownloading, setDownloading] = React.useState({});
    const [filenames, setFileNames] = React.useState([]);
    const [nextCursor, setNextCursor] = React.useState('');
    const [hasMore, setHasMore] = React.useState(true);
    const [flagCollections, setFlagCollections] = React.useState([])
    const [storedCollectionMap, setStoredCollectionMap] = React.useState({})
    const { startDownload } = useDownload()

    const handleCloseDialog = () => {
        setOpen(false);
    };

    React.useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await getGroupChannelMessages2({ teamId, userId, channelId });
        	const rep = await axios.get('/flagged-collections/collectionList')
        	const storedCollectionsMap = await getStoredCollectionMap('slack')
        	const flaggedCollections = rep.data?.data || []
        	setFlagCollections(flaggedCollections)
            setStoredCollectionMap(storedCollectionsMap)
            setRows(data.result || []);
            setOriginalMessages(data.result || []);
            if (data.hasMore) {
                setNextCursor(data.cursor);
                setHasMore(data.hasMore);
            }
            setLoading(false);
        };
        fetchData()
        if (Object.keys(members).length === 0) {
            getMembers(teamId);
        }
    }, [teamId, channelId, userId, getMembers, members])

    React.useEffect(() => {
        const fetchData = async (cursor) => {
            if (!hasMore || !nextCursor) return;
            setLoading(true);
            const data = await getGroupChannelMessages2({ teamId, userId, channelId, cursor });
            setRows(prevRows => [...prevRows, ...(data.result || [])]);
            setOriginalMessages(prevMessages => [...prevMessages, ...(data.result || [])]);
            setNextCursor(data.cursor);
            setHasMore(data.hasMore);
            setLoading(false);
        };

        if (hasMore) {
            fetchData(nextCursor);
        }
    }, [teamId, channelId, userId, hasMore, nextCursor]);

    const searchBy = (newString) => {
        const newRows = originalMessages.filter((row) => {
            let matches = true;

            const properties = ['message'];
            let containsQuery = false;

            properties.forEach((property) => {
                if (row[property].toString().toLowerCase().includes(newString.toString().toLowerCase())) {
                    containsQuery = true;
                }
            });

            if (!containsQuery) {
                matches = false;
            }

            if (filterBy) {
                const date = Date.parse(row.created);
                matches = matches && date >= startDate && date <= endDate;
            }

            //search file names
            if (row.files) {
                console.log(row.files)
                for (let i = 0; i < row.files.length; i++) {
                    if (row.files[i].name.toLowerCase().includes(newString.toLowerCase())) {
                        matches = true
                        break;
                    }
                }
            }

            return matches;
        });
        setRows(newRows);
    }

    const filterDate = (filterBy, startDate, endDate) => {
        if (!filterBy) {
            if (!search) {
                setRows(originalMessages);
            } else {
                searchBy(search);
            }
        } else {
            const newRows = originalMessages.filter((msg) => {
                if (search) {
                    let matches = true;
                    const properties = ['message'];
                    let containsQuery = false;

                    properties.forEach((property) => {
                        if (msg[property].toString().toLowerCase().includes(search.toString().toLowerCase())) {
                            containsQuery = true;
                        }
                    });

                    if (!containsQuery) {
                        matches = false;
                    }

                    const date = Date.parse(msg.created);
                    matches = matches && date >= startDate && date <= endDate;

                    return matches;
                }

                return Date.parse(msg.created) >= startDate && Date.parse(msg.created) <= endDate;
            });
            setRows(newRows);
        }
    };

    const handleSearch = (event) => {
        const newString = event?.target.value;
        setSearch(newString || '');
        setPage(0);
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

    const handleFilterByDate = (event) => {
        setFilterBy(event.target.checked);
        filterDate(event.target.checked, startDate, endDate);
    }


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

    const goMessages = (event, data) => {
        if (data.threads && data.threads.length > 0) {
            setOpen(true);
            setThreads(data)
        }
    }

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event?.target.value, 10));
        setPage(0);
    };

    const handleExport = async () => {
        const selectedMessages = [];
        selected.forEach((ele) => {
            selectedMessages.push(originalMessages[ele]);
        });
        setExporting(true);
        const { result, error } = await exportToZip(selectedMessages, members, `${name}.html`);
        if (!result) {
            dispatch(openSnackbar({
                open: true,
                message: error,
                variant: 'alert',
                alert: {
                    color: 'error'
                },
                close: true
            }));
        } else {
            dispatch(openSnackbar({
                open: true,
                message: 'Successfully exported!',
                variant: 'alert',
                alert: {
                    color: 'success'
                },
                close: true
            }));
        }
        setExporting(false);
    }

    const handleExportPDF = async () => {
        setExporting(true);
        const selectedMessages = [];
        selected.forEach((ele) => {
            selectedMessages.push(originalMessages[ele]);
        });
        const { result, error } = await exportToPDF(selectedMessages, members, 'messages.pdf');
        if (!result) {
            dispatch(openSnackbar({
                open: true,
                message: error,
                variant: 'alert',
                alert: {
                    color: 'error'
                },
                close: true
            }));
        } else {
            dispatch(openSnackbar({
                open: true,
                message: 'Successfully exported!',
                variant: 'alert',
                alert: {
                    color: 'success'
                },
                close: true
            }));
        }
        setExporting(false);
    }

    const handleExportJSON = async () => {
        setExporting(true);
        const selectedMessages = [];
        selected.forEach((ele) => {
            selectedMessages.push(originalMessages[ele]);
        });
        const { result, error } = await exportToJSON(selectedMessages, members, 'messages.json');
        if (!result) {
            dispatch(openSnackbar({
                open: true,
                message: error,
                variant: 'alert',
                alert: {
                    color: 'error'
                },
                close: true
            }));
        } else {
            dispatch(openSnackbar({
                open: true,
                message: 'Successfully exported!',
                variant: 'alert',
                alert: {
                    color: 'success'
                },
                close: true
            }));
        }
        setExporting(false);
    }

    const handleDownload = (teamId, filename, downloadName, fileUrl) => {
        startDownload({type: 'Slack', isArchive: false, name: downloadName, id: Date.now(), url: `/slack/download/${teamId}/${filename}?userId=${userId}&fileUrl=${fileUrl}`, size, responseType: 'blob'})
        // setDownloading({ ...isDownloading, [filename]: true });
        // setFileNames([...filenames, filename]);
        // axiosServices({
        //     method: 'GET',
        //     url: `/slack/download/${teamId}/${filename}?fileUrl=${fileUrl}`,
        //     responseType: 'blob',
        //     onDownloadProgress: (progressEvent) => {
        //         const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        //         setDownloadProgress(prevState => ({ ...prevState, [filename]: percentCompleted }));
        //         if (percentCompleted >= 100) {
        //             setDownloading({ ...isDownloading, [filename]: false });

        //             setFileNames(filenames.filter(item => item !== filename));
        //         }
        //     }
        // })
        //     .then(response => {
        //         const blob = new Blob([response.data], { type: response.headers['content-type'] });
        //         const url = URL.createObjectURL(blob);
        //         const a = document.createElement('a');
        //         a.href = url;
        //         a.download = downloadName;
        //         a.click();
        //         URL.revokeObjectURL(url);
        //         console.log("Responsed");
        //         setDownloadProgress({ ...downloadProgress, [filename]: 0 }); // Reset progress after download
        //     })
        //     .catch(error => {
        //         console.error('File download error:', error);
        //         setDownloadProgress({ ...downloadProgress, [filename]: 0 }); // Reset progress on error
        //     });
    };
    const isSelected = (idx) => selected.indexOf(idx) !== -1;

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

    return (
        // <Stack direction="row" alignItems="center">
        <MainCard title={`${name} Threads`} content={false} backButton>
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
                            placeholder="Search Messages"
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
                                    filterDate(filterBy, newValue, endDate);
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
                                    filterDate(filterBy, startDate, newValue);
                                }}
                                disabled={!filterBy}
                            />
                        </LocalizationProvider>
                    </Grid>
                </Grid>
            </CardContent>

            {/* table */}
            <TableContainer>
                {(loading || exporting) && <LinearProgress />}
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
                        {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((row, index) => {
                                /** Make sure no display bugs if row isn't an OrderData object */
                                if (typeof row === 'number') return null;
                                const isItemSelected = isSelected(row.index);
                                const labelId = `enhanced-table-checkbox-${index}`;
                                row.teamId = teamId
                                row.userId = userId
                                return (
                                    <TableRow
                                        hover
                                        role="checkbox"
                                        aria-checked={isItemSelected}
                                        tabIndex={-1}
                                        key={index}
                                        selected={isItemSelected}
                                    >
                                    	<TableCell>
	                                        <Flag
	                                            rowId={row.ts}
	                                            type="slack"
	                                            collections={flagCollections}
	                                            rowData={row}
	                                            initialFlag={flagCollections.find((e) => e._id === storedCollectionMap[row.ts])}
	                                        />
                                    	</TableCell>
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
                                            onClick={(event) => goMessages(event, { threads: row.threads, user: members[row.started_by] ? (members[row.started_by].display_name || members[row.started_by].real_name) : row.started_by })}
                                            sx={{ cursor: 'pointer', color: 'priamry' }}
                                        >
                                            <Typography
                                                variant="subtitle1"
                                                sx={{ color: '#2196f3' }}
                                            >
                                                {row.messageObj ? row.messageObj.map((e, idx) => {
                                                    if (e.type === 'text') {
                                                        return e.text.split('\n').map((ele, i) =>
                                                            <>
                                                                {ele}
                                                                {e.text.split('\n').length - 1 === i ? null : <br />}
                                                            </>
                                                        )
                                                    }
                                                    if (e.type === 'emoji') {
                                                        return (
                                                            <span className='slack-emoji' key={idx}>
                                                                <img className='slack-emoji-img' src={`https://a.slack-edge.com/production-standard-emoji-assets/14.0/google-medium/${e.unicode}.png`} alt={`${e.name}`} />
                                                            </span>
                                                        )
                                                    }
                                                    return '';
                                                }) : row.message}
                                                {
                                                    row.files ? row.files.map((file, idx) => file.thumb ?
                                                        <MainCard content={false} sx={{ m: '0 auto' }} key={idx}>
                                                            <CardMedia
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    setModal(true);
                                                                    const data = await getSlackImage(row.files, teamId);
                                                                    setImages(data);
                                                                }
                                                                }
                                                                component="img"
                                                                image={file.thumb}
                                                                sx={{ overflow: 'hidden', cursor: 'zoom-in' }}
                                                            />
                                                        </MainCard> :
                                                        <Grid container spacing={2} alignItems="center" justifyContent="left">
                                                            <Grid item>
                                                                <span role="button" aria-hidden="true" style={{ textDecoration: 'underline' }} onClick={async (e) => {
                                                                    e.preventDefault();
                                                                    handleDownload(teamId, file.id, file.name, file.url_private, file.size);
                                                                    // const res = await downloadSlackFile(teamId, file.id, file.name);
                                                                }} onKeyDown={() => { }}>{file.name}</span>

                                                            </Grid>
                                                            {
                                                                isDownloading[file.id] && (filenames.indexOf(file.id) > -1) &&
                                                                <Grid item xs>
                                                                    <LinearProgress variant="determinate" color="secondary" value={downloadProgress[file.id] || 0} />
                                                                </Grid>
                                                            }
                                                            {
                                                                isDownloading[file.id] && (filenames.indexOf(file.id) > -1) &&
                                                                <Grid item>
                                                                    <Typography variant="h6">{Math.round(downloadProgress[file.id] || 0)}%</Typography>
                                                                </Grid>
                                                            }
                                                        </Grid>

                                                        // <div ><img width="160" src={`${file.thumb}`} alt={`${file.name}`} /> {`${file.name}`}</div> : null;
                                                    ) : null
                                                }
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{members[row.started_by] ? (members[row.started_by].display_name || members[row.started_by].real_name) : row.started_by}</TableCell>
                                        <TableCell align="left">{row.created}</TableCell>
                                        <TableCell
                                            align="center"
                                            onClick={(event) => goMessages(event, { threads: row.threads, user: members[row.started_by] ? (members[row.started_by].display_name || members[row.started_by].real_name) : row.started_by })}
                                            sx={{ cursor: 'pointer', color: 'priamry' }} >
                                            {row.threads && row.threads.length > 0 ? <Typography
                                                variant="subtitle1"
                                                sx={{ color: '#2196f3', textDecoration: 'underline' }}
                                            >
                                                {row.replies}
                                            </Typography> : row.replies}

                                        </TableCell>
                                        <TableCell align="left">{row.reactions && row.reactions.map((r, idx) =>
                                            <span style={{ marginRight: '8px' }} key={idx}>
                                                <OutlinedBadge badgeContent={r.count} >
                                                    <img src={`https://a.slack-edge.com/production-standard-emoji-assets/14.0/google-medium/${emojis[r.name]}.png`} alt={`${r.name}`} />
                                                </OutlinedBadge>
                                            </span>
                                        )}</TableCell>
                                        {/* <TableCell align="center">
                                                {row.is_active && <Chip label="Active" size="small" chipcolor="success" />}
                                                {!row.is_active && <Chip label="Deactive" size="small" chipcolor="orange" />}
                                            </TableCell> */}
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
            <ThreadsModal open={open} handleCloseDialog={handleCloseDialog} data={threads} />
            <ModalGateway>
                {modal ? (
                    <Modal onClose={() => { setModal(!modal); setImages([]); }}>
                        {images.length > 0 ? <Carousel views={images} /> : <CircularProgress />}
                    </Modal>
                ) : null}
            </ModalGateway>
        </MainCard>
        // </Stack>
    );
};

export default GroupChannelMessages;
