import PropTypes from 'prop-types';
import * as React from 'react';
import { useNavigate } from "react-router-dom";

// material-ui
import { useTheme } from '@mui/material/styles';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    Toolbar,
    Button,
    Typography,
    Link,
    LinearProgress
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import MainCard from 'ui-component/cards/MainCard';

// assets
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import Tree from '@naisutech/react-tree'
import axiosServices from "utils/axios";

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
        label: 'File Name',
        align: 'left'
    },
    {
        id: 'id',
        numeric: false,
        label: 'Path',
        align: 'left'
    },
    {
        id: 'isFolder',
        numeric: true,
        label: 'Type',
        align: 'left'
    },
    {
        id: 'versionHistory',
        numeric: false,
        label: 'Version History',
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
                    {/* <Checkbox
                        color="primary"
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={rowCount > 0 && numSelected === rowCount}
                        onChange={onSelectAllClick}
                        inputProps={{
                            'aria-label': 'select all desserts'
                        }}
                    /> */}
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

const MyfilesChannel = ({ msgList, userId }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    // const dispatch = useDispatch();

    // const { slackData, setSlackData } = React.useContext(SlackContext);
    const [order, setOrder] = React.useState('asc');
    const [orderBy, setOrderBy] = React.useState('name');
    const [selected, setSelected] = React.useState([]);
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(5);
    const [search, setSearch] = React.useState('');
    const [rows, setRows] = React.useState([]);
    const [filterBy, setFilterBy] = React.useState(false);
    // const [exporting, setExporting] = React.useState(false);
    // const [selectItem, setSelectItem] = React.useState({});
    const [isHistoryView, setIsHistoryView] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [flatList, setFlatList] = React.useState([]);
    const [nodeOfIds, setNodeOfIds] = React.useState({});

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
    
    const onSelect = async (node) => {
        const selectedNode = nodeOfIds[node[0]];
        if (selectedNode && !selectedNode.isFolder) {
            console.log("Selected node:", selectedNode);
            try {
                const response = await axiosServices.get(`/google/fileDownload/${userId}/${selectedNode.id}`, {responseType: 'blob'});
                console.log('response:', response);
                if (response.status === 200) {
                    console.log('response');
                    const blob = response.data;
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = selectedNode.name;
                    document.body.appendChild(a);
                    a.click(); 
                    a.remove();
            
                    window.URL.revokeObjectURL(url);
                }
                
            } catch (error) {
                console.error('Download failed:', error);
            }
            // const url = selectedNode.downloadUrl;
            // window.open(url, '_blank');
        }
    };
    React.useEffect(() => {
        const treeDataList = flattenTree(msgList);
        setFlatList(treeDataList.flatList);
        setNodeOfIds(treeDataList.nodeOfIds);
    }, [msgList]);
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

    const handleFilterByDate = (event) => {
        setFilterBy(event.target.checked);
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

    const goMessages = (event, id, name) => {
        console.log("PublicChannel ID: ", id, name);
        // navigate(`/slack/team/${teamId}/public-channel/${name}/${id}`);
    }



    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event?.target.value, 10));
        setPage(0);
    };

    const handleExport = async () => {
        // console.log("Export Clicked! ", selected);
        // /* eslint-disable no-await-in-loop */
        // const channels = [];
        // const filenames = [];
        // setExporting(true);
        // for (let i = 0; i < selected.length; i += 1) {
        //     if (filterBy) {
        //         startDate.setHours(0, 0, 0, 0);
        //         endDate.setHours(23, 59, 59, 0);
        //         const data = await getPublicChannelMessages(teamId, selected[i], 'slack', startDate.toISOString(), endDate.toISOString());
        //         channels.push(data);
        //         filenames.push(`${selected[i]}.html`);
        //     } else {
        //         const data = await getPublicChannelMessages(teamId, selected[i]);
        //         channels.push(data);
        //         filenames.push(`${selected[i]}.html`);
        //     }
        // }

        // await exportToZipMultiple(channels, members, filenames);
        // setExporting(false);
    }

    const handleExportPDF = async () => {
        // console.log("Export Clicked! ", selected);
        // /* eslint-disable no-await-in-loop */
        // const channels = [];
        // const filenames = [];
        // setExporting(true);
        // for (let i = 0; i < selected.length; i += 1) {
        //     if (filterBy) {
        //         startDate.setHours(0, 0, 0, 0);
        //         endDate.setHours(23, 59, 59, 0);
        //         const data = await getPublicChannelMessages(teamId, selected[i], 'slack', startDate.toISOString(), endDate.toISOString());
        //         channels.push(data);
        //         filenames.push(`${selected[i]}.pdf`);
        //     } else {
        //         const data = await getPublicChannelMessages(teamId, selected[i]);
        //         channels.push(data);
        //         filenames.push(`${selected[i]}.pdf`);
        //     }
        // }
        // if (selected.length === 1) {
        //     await exportToPDF(channels[0], members);
        // } else {
        //     await exportToZipMultiplePDF(channels, members, filenames);
        // }
        // setExporting(false);
    }

    const handleExportJSON = async () => {
        // console.log("Export Clicked! ", selected);
        // /* eslint-disable no-await-in-loop */
        // const channels = [];
        // const filenames = [];
        // setExporting(true);
        // for (let i = 0; i < selected.length; i += 1) {
        //     if (filterBy) {
        //         startDate.setHours(0, 0, 0, 0);
        //         endDate.setHours(23, 59, 59, 0);
        //         const data = await getPublicChannelMessages(teamId, selected[i], 'slack', startDate.toISOString(), endDate.toISOString());
        //         channels.push(data);
        //         filenames.push(`${selected[i]}.json`);
        //     } else {
        //         const data = await getPublicChannelMessages(teamId, selected[i]);
        //         channels.push(data);
        //         filenames.push(`${selected[i]}.json`);
        //     }
        // }
        // if (selected.length === 1) {
        //     await exportToJSON(channels[0], members, "messages.json");
        // } else {
        //     await exportToZipMultipleJSON(channels, members, filenames);
        // }
        // setExporting(false);
    }

    const formatDate = utcDateTimeString => {
        // Convert the UTC string to a Date object
        const date = new Date(utcDateTimeString);
        // Format the date
        // The 'en-US' locale is used here, you can change it to suit your preference
        const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'short', // short name of the day
            month: 'numeric', // numeric month
            day: 'numeric' // numeric day
        });
        return formattedDate;
    }

    const isSelected = (id) => selected.indexOf(id) !== -1;

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

    return (
        <MainCard content={false}>
            {loading && <LinearProgress />}
            <Tree nodes={flatList} animations onSelect={onSelect} />
        </MainCard>
    );
};

MyfilesChannel.propTypes = {
    msgList: PropTypes.array.isRequired,
};

export default MyfilesChannel;