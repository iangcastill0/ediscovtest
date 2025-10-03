import PropTypes from 'prop-types';
import * as React from 'react';
// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Box,
  CardContent,
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
  Tooltip,
  Modal,
  LinearProgress,
  Button,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
// project imports
import MainCard from 'ui-component/cards/MainCard';
// assets
import SearchIcon from '@mui/icons-material/Search';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'; // Import horizontal dots icon
import { getPaymentHistory } from 'utils/adminApis';
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
    id: 'eventId',
    numeric: false,
    label: 'EventId',
    align: 'left',
  },
  {
    id: 'eventType',
    numeric: false,
    label: 'EventType',
    align: 'left',
  },
  {
    id: 'eventCreated',
    numeric: false,
    label: 'EventCreated',
    align: 'left',
  },
  {
    id: 'dataType',
    numeric: false,
    label: 'DataType',
    align: 'left',
  },
  {
    id: 'dataId',
    numeric: false,
    label: 'DataId',
    align: 'left',
  },
  {
    id: 'data',
    numeric: false,
    label: 'Data',
    align: 'left',
  },
];
// ==============================|| TABLE HEADER ||============================== //
function EnhancedTableHead({ order, orderBy, onRequestSort, theme }) {
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };
  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
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
      </TableRow>
    </TableHead>
  );
}
EnhancedTableHead.propTypes = {
  theme: PropTypes.object,
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
};
// ==============================|| PRODUCT LIST ||============================== //
const Subscriptions = () => {
  const theme = useTheme();
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('calories');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [search, setSearch] = React.useState('');
  const [rows, setRows] = React.useState([]);
  const [originalHistories, setOriginalHistories] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalData, setModalData] = React.useState('');
  React.useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      const response = await getPaymentHistory();
      setOriginalHistories(response);
      setRows(response);
      setLoading(false);
    };
    fetchData();
  }, []);
  const handleSearch = (event) => {
    const newString = event?.target.value;
    setSearch(newString || '');
    if (newString) {
      const newRows = rows.filter((row) => {
        let matches = true;
        const properties = ['eventId', 'eventType', 'dataId', 'dataType', 'data', 'eventCreated'];
        let containsQuery = false;
        properties.forEach((property) => {
            const val = property === 'data' ? JSON.stringify(row[property]) : row[property]
          if (val.toString().toLowerCase().includes(newString.toString().toLowerCase())) {
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
      setRows(originalHistories);
    }
  };
  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event?.target.value, 10));
    setPage(0);
  };
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;
  const handleModalOpen = (data) => {
    setModalData(JSON.stringify(data, null, 2));
    setModalOpen(true);
  };
  const handleModalClose = () => {
    setModalOpen(false);
  };
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
                ),
              }}
              onChange={handleSearch}
              placeholder="Search All Contents"
              value={search}
              size="small"
            />
          </Grid>
        </Grid>
      </CardContent>
      {/* table */}
      <TableContainer>
        {loading && <LinearProgress />}
        <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
          <EnhancedTableHead
            order={order}
            orderBy={orderBy}
            onRequestSort={handleRequestSort}
            rowCount={rows.length}
            theme={theme}
          />
          <TableBody>
            {stableSort(rows, getComparator(order, orderBy))
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => {
                /** Make sure no display bugs if row isn't an OrderData object */
                if (typeof row === 'number') return null;
                const labelId = `enhanced-table-checkbox-${index}`;
                return (
                  <TableRow hover role="row" tabIndex={-1} key={index}>
                    <TableCell align="center" component="th" id={labelId} scope="row">
                      <Typography variant="subtitle1" sx={{ color: theme.palette.mode === 'dark' ? 'grey.600' : 'grey.900' }}>
                        {row.eventId}
                      </Typography>
                    </TableCell>
                    <TableCell component="th" id={labelId} scope="row" align="left">
                      <Typography variant="subtitle1" sx={{ color: theme.palette.mode === 'dark' ? 'grey.600' : 'grey.900' }}>
                        {' '}
                        {row.eventType}{' '}
                      </Typography>
                    </TableCell>
                    {/* <TableCell>{row.category}</TableCell> */}
                    <TableCell align="left">{row.eventCreated}</TableCell>
                    <TableCell align="left">{row.dataType}</TableCell>
                    <TableCell align="left">{row.dataId}</TableCell>
                    <TableCell align="left">
                      {row.data && JSON.stringify(row.data).length > 50 ? (
                        <>
                          {JSON.stringify(row.data).substring(0, 50)}...
                          <Tooltip title="View Full Data">
                            <IconButton size="small" onClick={() => handleModalOpen(row.data)}>
                              <MoreHorizIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        JSON.stringify(row.data)
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            {emptyRows > 0 && (
              <TableRow
                style={{
                  height: 53 * emptyRows,
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
      <Modal open={modalOpen} onClose={handleModalClose} aria-labelledby="data-modal-title" aria-describedby="data-modal-description">
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%', // Increased width
            maxWidth: '900px', // Increased maxWidth
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
            maxHeight: '90vh', // Increased maxHeight
            overflowY: 'auto',
            borderRadius: '8px', // Added border radius for the modal
          }}
        >
          <Typography id="data-modal-title" variant="h5" component="h2" sx={{ mb: 2, fontWeight: 'bold' }}>
            Detail
          </Typography>
          <Typography id="data-modal-description" sx={{ mt: 2, fontFamily: 'monospace', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
            {modalData}
          </Typography>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleModalClose} variant="outlined">Close</Button>  {/* Changed to outlined button */}
          </Box>
        </Box>
      </Modal>
    </MainCard>
  );
};
export default Subscriptions;

