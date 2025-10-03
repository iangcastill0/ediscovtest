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
    Button,
    Typography,
    Link,
    LinearProgress
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import axios, { SERVER_URL } from 'utils/axios';
import { MSTeamsContext } from 'contexts/MSTeamsContext';
// project imports
import MainCard from 'ui-component/cards/MainCard';

// assets
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ExitToAppOutlinedIcon from '@mui/icons-material/ExitToAppOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';

import { exportToZipMultipleMailJSON } from 'utils/apiHelper';
import Tree from '@naisutech/react-tree'
import { MS365Context } from 'contexts/MS365Context';

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
        label: 'Display Name',
        align: 'left'
    },
    {
        id: 'lastModifiedDateTime',
        numeric: true,
        label: 'Last Modified Date',
        align: 'left'
    },
    {
        id: 'detail',
        numeric: false,
        label: 'Detail',
        align: 'left'
    },
    {
        id: 'files',
        numeric: false,
        label: 'Files',
        align: 'left'
    },
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
            <div>
                <Button variant="contained" color='error' startIcon={<FileDownloadIcon />} onClick={handleExportJSON}>
                    Export to JSON
                </Button>
            </div>
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

const FilesChannel = ({ msgList }) => {
    const theme = useTheme();
    const navigate = useNavigate();

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
    const [selectItem, setSelectItem] = React.useState({});
    const [isFilesView, setIsFilesView] = React.useState(false);
    const [isListsView, setIsListsView] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [selectRow, setSelectRow] = React.useState({});
    const [isHistoryView, setIsHistoryView] = React.useState(false);
    const [isRowView, setIsRowView] = React.useState(false);
    const { getAllFiles, teamsData, getItemHistory } = React.useContext(MSTeamsContext);
    const [flatList, setFlatList] = React.useState([]);
    const [nodeOfIds, setNodeOfIds] = React.useState({});
    const [selectedSiteId, setSelectedSiteId] = React.useState('');
    const { accessToken } = React.useContext(MS365Context);

    function childTree(children, parentId) {
        const childList = [];
        function processNode(node, parentId) {
            const transformedItem = {
                id: node.id,
                parentId,
                label: node.name,
                name: node.name,
                path: node.path,
                isFolder: node.isFolder
            };
            if (!node.isFolder) {
                childList.push(transformedItem);
            }
        }
        children.forEach(node => processNode(node, parentId));
        return childList;
    }
    function flattenTree(tree) {
        const flatList = [];
        const nodeOfIds = {};
        function processNode(node, parentId = null) {
            const transformedItem = {
                id: node.id,
                parentId,
                label: node.name,
                name: node.name,
                path: node.path,
                isFolder: node.isFolder
            };
            if (node.isFolder && node.children) {
                transformedItem.items = childTree(node.children, node.id);
            }
            nodeOfIds[node.id] = transformedItem;
            if (node.isFolder || (!node.isFolder && parentId == null)) {
                flatList.push(transformedItem);
            }
            if (node.children && node.children.length > 0) {
                node.children.forEach(child => processNode(child, node.id));
            }
        }
        const rootItem = [{
            id: 'root',
            parentId: null,
            label: 'root',
            name: 'root',
            path: '/',
            isFolder: true,
            children: tree
        }];
        rootItem.forEach(node => processNode(node));
        return { flatList, nodeOfIds };
    }
    const getHistory = async (id) => {
        console.log("item ID: ", id);

        setLoading(true);
        await getItemHistory(accessToken, selectedSiteId, id);
        setLoading(false);

        // setSelectItem(onedriveData.versionHistory);
        setIsHistoryView(true);
    }
    const onSelect = (node) => {
        const selectedNode = nodeOfIds[node[0]];
        if (selectedNode && !selectedNode.isFolder) {
            console.log("File node clicked:", node);
            if (selectedSiteId !== '') {
                getHistory(node[0]);
                setIsListsView(true);
            }
        }
    };
    React.useEffect(() => {
        if (msgList) setRows(msgList);
    }, [msgList]);
    React.useEffect(() => {
        const treeDataList = flattenTree(teamsData.channels.my_files);
        setFlatList(treeDataList.flatList);
        setNodeOfIds(treeDataList.nodeOfIds);
    }, [selectedSiteId, teamsData.channels.my_files]);
    const handleSearch = (event) => {
        const newString = event?.target.value;
        setSearch(newString || '');

        if (newString) {
            const newRows = rows.filter((row) => {
                let matches = true;

                const properties = ['name'];
                let containsQuery = false;

                properties.forEach((property) => {
                    if (row.displayName.toString().toLowerCase().includes(newString.toString().toLowerCase())) {
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
            setRows(msgList);
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

    const goMessages = (event, row) => {
        setSelectRow(row);
        setIsRowView(true);
    }

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event?.target.value, 10));
        setPage(0);
    };

    const handleExport = async () => {

    }

    const handleExportPDF = async () => {

    }

    const handleExportJSON = async () => {
        const channels = [];
        const filenames = [];
        setExporting(true);
        for (let i = 0; i < selected.length; i += 1) {
            const selectedObject = rows.find(item => item.id === selected[i]);
            const data = selectedObject;
            channels.push(data);
            filenames.push(`${selected[i]}.json`);
        }

        await exportToZipMultipleMailJSON(channels, filenames);
        setExporting(false);
    }

    const getRootFiles = async (event, siteId) => {
        setLoading(true);
        await getAllFiles(accessToken, siteId);
        setSelectedSiteId(siteId);
        setLoading(false);

        setIsFilesView(true);
    }

    const isSelected = (id) => selected.indexOf(id) !== -1;

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

    return (
        <MainCard content={false}>
            {loading && <LinearProgress />}
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

            {!isRowView && !isFilesView &&
                <>
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
                                        const cellId = `cell-${index}`;

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
                                                    onClick={(event) => goMessages(event, row)}
                                                    sx={{ cursor: 'pointer' }}
                                                >
                                                    <Typography
                                                        variant="subtitle1"
                                                        sx={{ color: theme.palette.mode === 'dark' ? 'grey.600' : 'grey.900' }}
                                                    >
                                                        {' '}
                                                        {row.displayName}{' '}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="left">{new Date(row.lastModifiedDateTime).toLocaleString()}</TableCell>
                                                <TableCell
                                                    component="th"
                                                    id={cellId}
                                                    scope="row"
                                                    onClick={(event) => goMessages(event, row)}
                                                    sx={{ cursor: 'pointer' }}
                                                >
                                                    <VisibilityOutlinedIcon />
                                                </TableCell>
                                                <TableCell
                                                    component="th"
                                                    id={cellId}
                                                    scope="row"
                                                    onClick={(event) => getRootFiles(event, row.id)}
                                                    sx={{ cursor: 'pointer' }}
                                                >
                                                    <ExitToAppOutlinedIcon />
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
                </>
            }
            {isRowView &&
                <>
                    <Button variant="contained" size="large" startIcon={<ArrowBackOutlinedIcon />} onClick={() => setIsRowView(false)}>
                        <Link style={{ color: 'white', textDecoration: 'none' }}>
                            Back
                        </Link>
                    </Button>
                    <div>
                        <pre>{JSON.stringify(selectRow, null, 2)}</pre>
                    </div>
                </>}
            {isFilesView &&
                <>
                    <Button variant="contained" size="large" startIcon={<ArrowBackOutlinedIcon />} onClick={() => { setIsFilesView(false); setIsListsView(false) }}>
                        <Link style={{ color: 'white', textDecoration: 'none' }}>
                            Back
                        </Link>
                    </Button>
                    <Tree nodes={flatList} animations onSelect={onSelect} />
                </>
            }
            {isListsView &&
                <>
                    <TableContainer>
                        <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
                            <TableHead>
                                <TableRow>
                                    <TableCell> Version </TableCell>
                                    <TableCell> Size </TableCell>
                                    <TableCell> Modified Date Time </TableCell>
                                    <TableCell>{`Writer's email`} </TableCell>
                                    <TableCell>{`Writer's name`} </TableCell>
                                    <TableCell> Download </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {teamsData.versionHistory
                                    .map((historyRow, historyIndex) => {
                                        if (typeof historyRow === 'number') return null;
                                        return (
                                            <TableRow
                                                hover
                                                tabIndex={-1}
                                                key={historyIndex}
                                            >
                                                <TableCell
                                                    component="th"
                                                    scope="row"
                                                >
                                                    <Typography
                                                        variant="subtitle1"
                                                        sx={{ color: theme.palette.mode === 'dark' ? 'grey.600' : 'grey.900' }}
                                                    >
                                                        {' '}
                                                        {historyRow.id}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{historyRow.size}</TableCell>
                                                <TableCell>{historyRow.lastModifiedDateTime}</TableCell>
                                                <TableCell>{historyRow.lastModifiedBy.user.email}</TableCell>
                                                <TableCell>{historyRow.lastModifiedBy.user.displayName}</TableCell>
                                                <TableCell>
                                                    <Link href={historyRow['@microsoft.graph.downloadUrl']}>
                                                        <FileDownloadIcon />
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            }
        </MainCard>
    );
};

FilesChannel.propTypes = {
    msgList: PropTypes.array.isRequired,
};

export default FilesChannel;