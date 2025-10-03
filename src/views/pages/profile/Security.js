import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { Button, Grid, Stack, TextField, Typography, CircularProgress, Snackbar, Checkbox, FormControlLabel, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, MenuItem, InputAdornment, IconButton, FormHelperText, Box } from '@mui/material';
import OtpInput from 'react-otp-input-rc-17';
import { Google, Visibility, VisibilityOff } from '@mui/icons-material';
import { changePassword, deactivateAccount, generateSecret, verifyTOTP, removeAuthenticator, sendOtpUpdate, updatePhoneNumber, updateSecurity } from 'utils/apiHelper';
import Alert from 'ui-component/extended/Alert';
import useAuth from 'hooks/useAuth';
import SubCard from 'ui-component/cards/SubCard';
import AnimateButton from 'ui-component/extended/AnimateButton';
import { gridSpacing } from 'store/constant';
import * as Yup from 'yup';
import { Formik } from 'formik';
import countryNames from 'i18n-iso-countries';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js';
import {GooglePlayButton, AppStoreButton} from 'react-mobile-app-button';

countryNames.registerLocale(require('i18n-iso-countries/langs/en.json'));

const Security = () => {
    const theme = useTheme();
    const { user, refresh, logout } = useAuth();

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [errors, setErrors] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
        phoneNumber: ''
    });

    const [passwordLoading, setPasswordLoading] = useState(false);
    const [deactivating, setDeactivating] = useState(false);
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success',
    });

    const [phoneVerification, setPhoneVerification] = useState(user?.twoStepPhone);
    const [emailVerification, setEmailVerification] = useState(true);
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');

    const [authenticatorLoading, setAuthenticatorLoading] = useState(false);
    const [authenticatorSecret, setAuthenticatorSecret] = useState('');
    const [totp, setTotp] = useState('');
    const [showAuthenticatorStep, setShowAuthenticatorStep] = useState(false);
    const [showAddPasswordDialog, setShowAddPasswordDialog] = useState(false);
    const [showRemovePasswordDialog, setShowRemovePasswordDialog] = useState(false);
    const [showQRCodeDialog, setShowQRCodeDialog] = useState(false);
    const [showRemoveConfirmDialog, setShowRemoveConfirmDialog] = useState(false);
    const [dialogPassword, setDialogPassword] = useState('');

    const [showUpdatePhoneDialog, setShowUpdatePhoneDialog] = useState(false);
    const [phoneCodeSent, setPhoneCodeSent] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [statusText, setStatusText] = useState('');
    const [showPhone, setShowPhone] = useState(false);

    const [showSecurityPasswordDialog, setShowSecurityPasswordDialog] = useState(false);
    const [securityPassword, setSecurityPassword] = useState('');

    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    const handleOldPassword = (e) => {
        setOldPassword(e.target.value);
    };

    const handleNewpassword = (e) => {
        setNewPassword(e.target.value);
    };

    const handleConfirmPassword = (e) => {
        setConfirmPassword(e.target.value);
    };

    const handlePhoneNumberChange = (e) => {
        setPhoneNumber(e.target.value);
    };

    const handlePhoneVerification = (e) => {
        setPhoneVerification(e.target.checked);
    };

    const handleEmailVerification = (e) => {
        setEmailVerification(e.target.checked);
    };

    const handleDialogPasswordChange = (e) => {
        setDialogPassword(e.target.value);
    };

    const handleSecurityPasswordChange = (e) => {
        setSecurityPassword(e.target.value);
    };

    const handleClickShowPhone = () => {
        setShowPhone(!showPhone);
    };

    const handleMouseDownPhone = (event) => {
        event.preventDefault();
    };

    const validatePasswordChange = () => {
        let isValid = true;
        const newErrors = {
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
            phoneNumber: ''
        };

        if (!oldPassword) {
            newErrors.oldPassword = 'Current password is required';
            isValid = false;
        }
        if (!newPassword) {
            newErrors.newPassword = 'New password is required';
            isValid = false;
        } else if (newPassword.length < 8) {
            newErrors.newPassword = 'New password must be at least 8 characters long';
            isValid = false;
        }
        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please re-enter new password';
            isValid = false;
        } else if (confirmPassword !== newPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSuccess = (message) => {
        setNotification({
            open: true,
            message,
            severity: 'success',
        });
    };

    const handleError = (message) => {
        setNotification({
            open: true,
            message,
            severity: 'error',
        });
    };

    const handleChangePassword = async () => {
        if (validatePasswordChange()) {
            setPasswordLoading(true);
            try {
                const response = await changePassword(oldPassword, newPassword);
                if (response.ok) {
                    handleSuccess('Password changed successfully');
                } else {
                    handleError(response.data || 'Failed to change password');
                }
            } catch (error) {
                handleError('Failed to change password');
            } finally {
                setPasswordLoading(false);
            }
        }
    };

    const handleDeactivateAccount = async () => {
        setDeactivating(true);
        try {
            const response = await deactivateAccount();
            if (response.ok) {
                handleSuccess('Account deactivated successfully');
                logout();
            } else {
                handleError('Failed to deactivate account');
            }
        } catch (error) {
            handleError('Failed to deactivate account');
        } finally {
            setDeactivating(false);
        }
    };

    const handleCloseSnackbar = () => {
        setNotification({ ...notification, open: false });
    };

    const handleAuthenticator = () => {
        setShowAddPasswordDialog(true);
    };

    const handleConfirmAddPasswordDialog = async () => {
        setShowAddPasswordDialog(false);
        setAuthenticatorLoading(true);
        try {
            const response = await generateSecret(user?.email, dialogPassword);
            if (response.data?.ok) {
                setAuthenticatorSecret(response.data.qrCode);
                setShowQRCodeDialog(true);
                setShowAuthenticatorStep(true);
            } else {
                handleError(response.data?.msg || 'Failed to generate authenticator secret');
            }
        } catch (error) {
            handleError('Failed to generate authenticator secret');
        } finally {
            setAuthenticatorLoading(false);
            setDialogPassword('');
        }
    };

    const handleVerifyTOTP = async () => {
        if (!totp) {
            handleError('Please enter the TOTP');
            return;
        }

        setAuthenticatorLoading(true);
        try {
            const response = await verifyTOTP(user?.email, totp);
            if (response.data?.ok) {
                handleSuccess('Authenticator verified successfully');
                setShowAuthenticatorStep(false);
                setShowQRCodeDialog(false);
                refresh();
            } else {
                handleError(response.data?.msg || 'Failed to verify TOTP');
            }
        } catch (error) {
            handleError('Failed to verify TOTP');
        } finally {
            setAuthenticatorLoading(false);
        }
    };

    const handleRemoveAuthenticator = () => {
        setShowRemoveConfirmDialog(false);
        setShowRemovePasswordDialog(true);
    };

    const handleConfirmRemovePasswordDialog = async () => {
        setShowRemovePasswordDialog(false);
        setAuthenticatorLoading(true);
        try {
            const response = await removeAuthenticator(dialogPassword);
            if (response.data?.ok) {
                handleSuccess('Authenticator removed successfully');
                setShowAuthenticatorStep(false);
                setShowQRCodeDialog(false);
                refresh();
            } else {
                handleError('Failed to remove authenticator');
            }
        } catch (error) {
            handleError('Failed to remove authenticator');
        } finally {
            setAuthenticatorLoading(false);
            setDialogPassword('');
        }
    };

    const handleSendCode = async (values, setFieldError, setSubmitting) => {
        setSubmitting(true);
        const res = await sendOtpUpdate(`+${getCountryCallingCode(values.country || 'US')}${values.phoneNumber}`, values.country || 'US');
        if (res.data.ok) {
            setStatusText('Verification code sent successfully!');
            setPhoneCodeSent(true);
        } else {
            setStatusText(res.data?.msg || 'Failed to send verification code. Try again later.');
            setFieldError('phoneNumber', res.data?.msg || 'Failed to send verification code.');
        }
        setSubmitting(false);
        setResendTimer(60);
    };

    const handleVerifyPhone = async (phoneOtp, setErrors, setSubmitting) => {
        setSubmitting(true);
        const phoneRes = await updatePhoneNumber(phoneOtp);
        if (phoneRes.data.ok) {
            handleSuccess('Phone number is updated successfully!');
            setShowUpdatePhoneDialog(false);
            setPhoneCodeSent(false)
            setStatusText('')
            refresh()
        } else {
            handleError('Invalid phone verification code!');
            setErrors({ phoneOtp: 'Invalid phone verification code!' });
        }
        setSubmitting(false);
    };

    const handleSubmitSecurity = () => {
        setShowSecurityPasswordDialog(true);
    };

    const handleConfirmSubmitSecurity = async () => {
        setShowSecurityPasswordDialog(false);
        try {
            const res = await updateSecurity(emailVerification, phoneVerification, securityPassword);
            if (res.data?.ok) {
                handleSuccess('Security settings updated successfully');
                refresh()
            } else {
                handleError(res.data?.msg || 'Failed!');
            }
        } catch (error) {
            handleError('Failed!');
        }
    };

    return (
        <Grid container spacing={gridSpacing}>
            <Grid item sm={6} md={6}>
                <Grid container spacing={gridSpacing}>
                    <Grid item xs={12}>
                        <SubCard title="Change Password">
                            <Grid container spacing={gridSpacing}>
                                <Grid item xs={12}>
                                    <TextField
                                        error={!!errors.oldPassword}
                                        helperText={errors.oldPassword}
                                        id="outlined-basic9"
                                        fullWidth
                                        label="Current password"
                                        value={oldPassword}
                                        onChange={handleOldPassword}
                                        type="password"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        error={!!errors.newPassword}
                                        helperText={errors.newPassword}
                                        id="outlined-basic10"
                                        fullWidth
                                        label="New Password"
                                        value={newPassword}
                                        onChange={handleNewpassword}
                                        type="password"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        error={!!errors.confirmPassword}
                                        helperText={errors.confirmPassword}
                                        id="outlined-basic11"
                                        fullWidth
                                        label="Re-enter New Password"
                                        value={confirmPassword}
                                        onChange={handleConfirmPassword}
                                        type="password"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Stack direction="row">
                                        <AnimateButton>
                                            <Button
                                                variant="contained"
                                                onClick={handleChangePassword}
                                                disabled={passwordLoading}
                                                startIcon={passwordLoading && <CircularProgress size={24} />}
                                            >
                                                {passwordLoading ? 'Changing...' : 'Change Password'}
                                            </Button>
                                        </AnimateButton>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </SubCard>
                    </Grid>
                </Grid>
            </Grid>

            <Grid item sm={6} md={6}>
                <Grid container spacing={gridSpacing}>
                    <Grid item xs={12}>
                        <SubCard title="Security Settings">
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox checked={phoneVerification} onChange={handlePhoneVerification} />
                                        }
                                        label="Enable Phone Verification"
                                    />
                                    {phoneVerification && (
                                        <Grid container spacing={2} alignItems="center">
                                            <Grid item xs={8}>
                                                <TextField
                                                    error={!!errors.phoneNumber}
                                                    helperText={errors.phoneNumber}
                                                    id="outlined-phone"
                                                    fullWidth
                                                    label="Phone Number"
                                                    value={phoneNumber}
                                                    onChange={handlePhoneNumberChange}
                                                    disabled
                                                />
                                            </Grid>
                                            <Grid item xs={4}>
                                                <Button
                                                    variant="contained"
                                                    onClick={() => {
                                                        setShowUpdatePhoneDialog(true)
                                                        setStatusText('')
                                                    }}
                                                    fullWidth
                                                >
                                                    Update
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    )}
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox checked={emailVerification} onChange={handleEmailVerification} />
                                        }
                                        label="Enable Email Verification"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Stack direction="row">
                                        <AnimateButton>
                                            <Button
                                                variant="contained"
                                                onClick={handleSubmitSecurity}
                                            >
                                                Update Security Settings
                                            </Button>
                                        </AnimateButton>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </SubCard>
                    </Grid>
                    <Grid item xs={12}>
                        <SubCard title="Authenticator App">
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="body2" gutterBottom>
                                        An authenticator app provides an extra layer of security for your account. Use the buttons below to add, update, or remove your authenticator.
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Stack direction="row" spacing={2}>
                                        <AnimateButton>
                                            <Button
                                                variant="contained"
                                                onClick={handleAuthenticator}
                                                disabled={authenticatorLoading}
                                                startIcon={authenticatorLoading && <CircularProgress size={24} />}
                                            >
                                                {authenticatorLoading ? 'Processing...' : (user?.isAuthenticator ? 'Update Authenticator' : 'Add Authenticator')}
                                            </Button>
                                        </AnimateButton>
                                        {user?.isAuthenticator && (
                                            <AnimateButton>
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    onClick={() => setShowRemoveConfirmDialog(true)}
                                                    disabled={authenticatorLoading}
                                                    startIcon={authenticatorLoading && <CircularProgress size={24} />}
                                                >
                                                    {authenticatorLoading ? 'Processing...' : 'Remove Authenticator'}
                                                </Button>
                                            </AnimateButton>
                                        )}
                                    </Stack>
                                </Grid>
                            </Grid>
                        </SubCard>
                    </Grid>
                    <Grid item xs={12}>
                        <SubCard title="Delete Account">
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="body1">
                                        To deactivate your account, first delete its resources. If you are the only owner of any teams,
                                        either assign another owner or deactivate the team.
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Stack direction="row">
                                        <AnimateButton>
                                            <Button
                                                sx={{
                                                    color: theme.palette.error.main,
                                                    borderColor: theme.palette.error.main,
                                                    '&:hover': {
                                                        background: theme.palette.error.light + 25,
                                                        borderColor: theme.palette.error.main,
                                                    },
                                                }}
                                                variant="outlined"
                                                size="small"
                                                onClick={handleDeactivateAccount}
                                                disabled={deactivating}
                                                startIcon={deactivating && <CircularProgress size={24} />}
                                            >
                                                {deactivating ? 'Deactivating...' : 'Deactivate Account'}
                                            </Button>
                                        </AnimateButton>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </SubCard>
                    </Grid>
                </Grid>
            </Grid>
            <Snackbar open={notification.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={notification.severity} sx={{ width: '100%' }}>
                    {notification.message}
                </Alert>
            </Snackbar>
            <Dialog open={showAddPasswordDialog} onClose={() => setShowAddPasswordDialog(false)}>
                <DialogTitle>Input Current Password</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        To continue, please enter your current password.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="current-password"
                        label="Current Password"
                        type="password"
                        fullWidth
                        variant="standard"
                        value={dialogPassword}
                        onChange={handleDialogPasswordChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowAddPasswordDialog(false)}>Cancel</Button>
                    <Button onClick={handleConfirmAddPasswordDialog} disabled={authenticatorLoading}>
                        {authenticatorLoading ? <CircularProgress size={24} /> : 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={showQRCodeDialog} onClose={() => setShowQRCodeDialog(false)}>
                <DialogTitle>Scan QR Code</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Scan this QR code with your authenticator app.
                    </DialogContentText>
                    <img src={authenticatorSecret} alt="Authenticator QR Code" />
                    <TextField
                        autoFocus
                        margin="dense"
                        id="totp-code"
                        label="Enter 6-digit Code"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={totp}
                        onChange={(e) => setTotp(e.target.value)}
                        error={!!errors.totp}
                        helperText={errors.totp}
                    />
                    <Stack direction="row" spacing={2} justifyContent="center" mt={2}>
                        <GooglePlayButton
                            // platform="android"
                            url="https://play.google.com/apps/internaltest/4701521647417901976"
                            badge="Google Play"
                        />
                        <AppStoreButton
                            // platform="ios"
                            url="https://apps.apple.com/us/app/google-authenticator/id388497605"
                            badge="App Store"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowQRCodeDialog(false)}>Cancel</Button>
                    <Button onClick={handleVerifyTOTP} disabled={authenticatorLoading}>
                        {authenticatorLoading ? <CircularProgress size={24} /> : 'Verify Code'}
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={showRemoveConfirmDialog} onClose={() => setShowRemoveConfirmDialog(false)}>
                <DialogTitle>Confirm Remove Authenticator</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to remove the authenticator? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowRemoveConfirmDialog(false)}>Cancel</Button>
                    <Button onClick={handleRemoveAuthenticator} disabled={authenticatorLoading}>
                        {authenticatorLoading ? <CircularProgress size={24} /> : 'Continue'}
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={showRemovePasswordDialog} onClose={() => setShowRemovePasswordDialog(false)}>
                <DialogTitle>Input Current Password</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        To continue, please enter your current password.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="current-password-remove"
                        label="Current Password"
                        type="password"
                        fullWidth
                        variant="standard"
                        value={dialogPassword}
                        onChange={handleDialogPasswordChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowRemovePasswordDialog(false)}>Cancel</Button>
                    <Button onClick={handleConfirmRemovePasswordDialog} disabled={authenticatorLoading}>
                        {authenticatorLoading ? <CircularProgress size={24} /> : 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={showUpdatePhoneDialog} onClose={() => setShowUpdatePhoneDialog(false)}>
                <DialogTitle>Update Phone Number</DialogTitle>
                <Formik
                    initialValues={{ phoneNumber: '', phoneOtp: '', country: 'US' }}
                    validationSchema={Yup.object().shape({
                        phoneNumber: Yup.string().required('Phone number is required'),
                        phoneOtp: Yup.string().required('OTP is required').length(6, 'OTP must be 6 digits'),
                        country: Yup.string().required('Country is required')
                    })}
                    onSubmit={(values, { setErrors, setSubmitting }) => handleVerifyPhone(values.phoneOtp, setErrors, setSubmitting)}
                >
                    {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values, setFieldValue, setFieldError, setErrors, setSubmitting }) => (
                        <form onSubmit={handleSubmit}>
                            <DialogContent>
                                <Box mb={2}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Country"
                                        value={values.country || 'US'}
                                        onChange={(e) => setFieldValue('country', e.target.value)}
                                        error={touched.country && Boolean(errors.country)}
                                        helperText={touched.country && errors.country}
                                    >
                                        {getCountries().map((countryCode) => (
                                            <MenuItem key={countryCode} value={countryCode}>
                                                {countryNames.getName(countryCode, 'en')}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Box>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={8}>
                                        <TextField
                                            label="Phone Number"
                                            type={showPhone ? 'text' : 'tel'}
                                            value={values.phoneNumber}
                                            onChange={(e) => setFieldValue('phoneNumber', e.target.value)}
                                            fullWidth
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        +{getCountryCallingCode(values.country || 'US')}
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
                                            error={touched.phoneNumber && Boolean(errors.phoneNumber)}
                                            helperText={touched.phoneNumber && errors.phoneNumber}
                                        />
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Button
                                            variant="contained"
                                            onClick={() => handleSendCode(values, setFieldError, setSubmitting)}
                                            disabled={resendTimer > 0 || isSubmitting}
                                            fullWidth
                                        >
                                            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Send Code'}
                                        </Button>
                                    </Grid>
                                </Grid>
                                {phoneCodeSent && (
                                    <>
                                        <Box mt={2}>
                                            <OtpInput
                                                value={values.phoneOtp}
                                                onChange={(otpNumber) => setFieldValue('phoneOtp', otpNumber)}
                                                numInputs={6}
                                                containerStyle={{ justifyContent: 'space-between' }}
                                                inputStyle={{
                                                    width: '100%',
                                                    margin: '8px',
                                                    padding: '10px',
                                                    border: `1px solid ${theme.palette.grey[300]}`,
                                                    borderRadius: 4,
                                                    ':hover': { borderColor: theme.palette.primary.main }
                                                }}
                                                focusStyle={{ outline: 'none', border: `2px solid ${theme.palette.primary.main}` }}
                                            />
                                            {touched.phoneOtp && errors.phoneOtp && <FormHelperText error>{errors.phoneOtp}</FormHelperText>}
                                        </Box>
                                        <Box mt={2}>
                                            <Button
                                                disableElevation
                                                fullWidth
                                                size="large"
                                                variant="contained"
                                                type="button"
                                                onClick={() => handleVerifyPhone(values.phoneOtp, setErrors, setSubmitting)}
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? <CircularProgress size={24} /> : 'Verify Phone Number'}
                                            </Button>
                                        </Box>
                                    </>
                                )}
                                {statusText && (
                                    <Box mt={2}>
                                        <Typography align="center" color={statusText.includes('successful') ? 'success.main' : 'error'}>
                                            {statusText}
                                        </Typography>
                                    </Box>
                                )}
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setShowUpdatePhoneDialog(false)}>Cancel</Button>
                            </DialogActions>
                        </form>
                    )}
                </Formik>
            </Dialog>
            <Dialog open={showSecurityPasswordDialog} onClose={() => setShowSecurityPasswordDialog(false)}>
                <DialogTitle>Input Current Password</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        To update your security settings, please enter your current password.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="current-password-security"
                        label="Current Password"
                        type="password"
                        fullWidth
                        variant="standard"
                        value={securityPassword}
                        onChange={handleSecurityPasswordChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowSecurityPasswordDialog(false)}>Cancel</Button>
                    <Button onClick={handleConfirmSubmitSecurity}>
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Grid>
    );
};

export default Security;
