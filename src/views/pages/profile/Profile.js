import { useState } from 'react';
// material-ui
import {
    Button,
    Grid,
    Stack,
    TextField,
    MenuItem,
    InputAdornment,
    IconButton,
    Snackbar,
    CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
// project imports
import useAuth from 'hooks/useAuth';
import SubCard from 'ui-component/cards/SubCard';
import AnimateButton from 'ui-component/extended/AnimateButton';
import { gridSpacing } from 'store/constant';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js';
import countryNames from 'i18n-iso-countries';
import { updateProfile } from 'utils/apiHelper';
import CustomAlert from 'ui-component/extended/Alert';
// assets

countryNames.registerLocale(require('i18n-iso-countries/langs/en.json'));

const Profile = () => {
    const { user, refresh } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [company, setCompany] = useState(user?.company || '');
    const [country, setCountry] = useState(user?.country || 'US');
    // const [phone, setPhone] = useState(user?.phone || '');
    // const [showPhone, setShowPhone] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
    });

    const handleNameChange = (e) => {
        setName(e.target.value);
    };

    const handleCompanyChange = (e) => {
        setCompany(e.target.value);
    };

    const handleCountryChange = (e) => {
        setCountry(e.target.value);
    };

    const handlePhoneChange = (e) => {
        setPhone(e.target.value);
    };

    const handleClickShowPhone = () => {
        setShowPhone(!showPhone);
    };

    const handleMouseDownPhone = (event) => {
        event.preventDefault();
    };

    const handleUpdateProfile = async () => {
        setUpdating(true);
        try {
            await updateProfile(name, company, country, phone);
            setSnackbar({
                open: true,
                message: 'Profile updated successfully!',
                severity: 'success',
            });
            refresh();
        } catch (error) {
            setSnackbar({
                open: true,
                message: error.message || 'Failed to update profile.',
                severity: 'error',
            });
        } finally {
            setUpdating(false);
        }
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar({ ...snackbar, open: false });
    };

    const countries = getCountries();
    const selectedCountryCode = `+${getCountryCallingCode(country)}`;
    
    return (
        <Grid container spacing={gridSpacing}>
            <Grid item sm={12} md={12}>
                <SubCard title="Edit Account Details">
                    <Grid container spacing={gridSpacing}>
                        <Grid item xs={12}>
                            <TextField
                                id="outlined-basic1"
                                fullWidth
                                label="Name"
                                value={name}
                                onChange={handleNameChange}
                                helperText="First and last name"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                id="outlined-basic6"
                                fullWidth
                                label="Email address"
                                defaultValue={user?.email}
                                disabled
                            />
                        </Grid>
                        <Grid item md={12} xs={12}>
                            <TextField
                                id="outlined-basic4"
                                fullWidth
                                label="Company"
                                value={company}
                                onChange={handleCompanyChange}
                            />
                        </Grid>
                        {/* <Grid item md={6} xs={12}>
                            <TextField
                                select
                                fullWidth
                                label="Country"
                                value={country}
                                onChange={handleCountryChange}
                            >
                                {countries.map((countryCode) => (
                                    <MenuItem key={countryCode} value={countryCode}>
                                        {countryNames.getName(countryCode, 'en')}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item md={6} xs={12}>
                            <TextField
                                label="Phone Number"
                                type={showPhone ? 'text' : 'tel'}
                                value={phone}
                                onChange={handlePhoneChange}
                                fullWidth
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            {selectedCountryCode}
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle phone visibility"
                                                onClick={handleClickShowPhone}
                                                onMouseDown={handleMouseDownPhone}
                                                edge="end"
                                            >
                                                {showPhone ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid> */}
                        <Grid item xs={12}>
                            <Stack direction="row">
                                <AnimateButton>
                                    <Button
                                        variant="contained"
                                        onClick={handleUpdateProfile}
                                        disabled={updating}
                                        startIcon={updating && <CircularProgress size={24} />}
                                    >
                                        {updating ? 'Updating...' : 'Update Profile'}
                                    </Button>
                                </AnimateButton>
                            </Stack>
                        </Grid>
                    </Grid>
                </SubCard>
            </Grid>
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <CustomAlert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} color={snackbar.severity}>
                    {snackbar.message}
                </CustomAlert>
            </Snackbar>
        </Grid>
    );
};

export default Profile;
