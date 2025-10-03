import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// material-ui
import { 
  Button, 
  Grid, 
  Typography, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField,
  MenuItem,
  Select,
  Box,
  LinearProgress
} from '@mui/material';
import { gridSpacing } from 'store/constant';
import MainCard from 'ui-component/cards/MainCard';
import FlagCard from 'ui-component/cards/FlagCard';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import axios from 'utils/axios';

// ==============================|| Flag Collections PAGE ||============================== //

const FlagCollections = () => {
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [collectionName, setCollectionName] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [reload, setReload] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetch = async () => {
            const res = await axios.get('/flagged-collections/collectionList')
            setCollections(res.data?.data || [])
        }

        fetch()
    }, [reload]);
    
    const refresh = () => {
        setReload(!reload);
    };
    
    // Sample color options
    const colors = [
        '#FF5733', '#33FF57', '#3357FF', '#F033FF', '#33FFF3',
        '#FF33A8', '#A833FF', '#33FFA8', '#FF8C33', '#338CFF',
        '#8C33FF', '#55338C', '#AAFF8C', '#005733', '#57FF33',
        '#5733FF', '#FF33F5', '#33F5FF', '#F5FF33', '#FFFF57'
    ];

    const handleCreateCollection = () => {
        console.log('Creating collection:', {
            name: collectionName,
            color: selectedColor
        });
        
        setLoading(true);
        axios.post('/flagged-collections/createCollectionList', { name: collectionName, color: selectedColor })
            .then(response => {
                setCollections([...collections, response.data.data]);
                console.log('new collection:', JSON.stringify(response.data.data))
                setLoading(false);
                setOpenDialog(false);
                console.log('collections:', JSON.stringify([...collections, response.data.data], null, 2));
            })
            .catch(error => {
                console.log('failed create collection:', error)
                console.error(error);
                setLoading(false);
            });
        // For now, just close the dialog
        setOpenDialog(false);
        setCollectionName('');
        setSelectedColor('');
    };

    return (
        <MainCard title="Flag Collections">
            <Grid container spacing={gridSpacing}>
                <Grid
                    className="block"
                    item
                    xs
                    zeroMinWidth
                    sx={{ display: 'flex' }}
                >
                    <Grid container alignItems="center" spacing={gridSpacing}>
                        <Grid item>
                            <Button 
                                variant="contained" 
                                size="large" 
                                startIcon={<AddCircleOutlineOutlinedIcon />}
                                onClick={() => setOpenDialog(true)}
                            >
                                Create a collection
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            <Grid container spacing={gridSpacing} style={{ marginTop: '10px' }}>
                {loading && <Grid item xs={12}><LinearProgress /></Grid>}
                {
                    collections.length ? collections.map((collection) => (
                        <Grid item xs={12} lg={3} key={collection._id}>
                            <FlagCard
                                    primary="Collection Color Card"
                                    secondary={collection.name}
                                    content={`${collection.itemCount} collections`}
                                    // iconPrimary={<FontAwesomeIcon icon={faMicrosoft} />}
                                    refresh={refresh}
                                    color={collection.color}
                                    id={collection._id}
                                />
                        </Grid>
                    )) : <Typography variant='h3' p={2}>No collections found. Create your first collection.</Typography>
                }
            </Grid>

            {/* Create Collection Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Create New Collection</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Collection Name"
                            placeholder="Enter collection name"
                            value={collectionName}
                            onChange={(e) => setCollectionName(e.target.value)}
                            sx={{ mb: 3 }}
                        />
                        
                        <Select
                            fullWidth
                            value={selectedColor}
                            onChange={(e) => setSelectedColor(e.target.value)}
                            displayEmpty
                            renderValue={(selected) => selected ? (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box sx={{ 
                                        width: 20, 
                                        height: 20, 
                                        backgroundColor: selected, 
                                        mr: 1,
                                        borderRadius: '50%'
                                    }} />
                                    {selected}
                                </Box>
                            ) : (
                                'Select a color'
                            )}
                        >
                            {colors.map((color) => (
                                <MenuItem key={color} value={color}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Box sx={{ 
                                            width: 20, 
                                            height: 20, 
                                            backgroundColor: color, 
                                            mr: 1,
                                            borderRadius: '50%'
                                        }} />
                                        {color}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button 
                        onClick={handleCreateCollection} 
                        variant="contained"
                        disabled={!collectionName || !selectedColor}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </MainCard>
    );
}

export default FlagCollections;