import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box, Button, Grid, Typography, TextField, InputAdornment,
  IconButton, Snackbar, CircularProgress, MenuItem, FormHelperText,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Stack
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import OtpInput from 'react-otp-input-rc-17';
import { resendTwoFactorCode, verifyEmail, verifyPhoneNumberCode, sendPhoneNumberVerificationCode, verifyTOTP } from 'utils/apiHelper';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import { Formik } from 'formik';
import countryNames from 'i18n-iso-countries';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js';
import CustomAlert from 'ui-component/extended/Alert';
// import { GooglePlayButton, AppStoreButton } from 'react-mobile-app-button';

countryNames.registerLocale(require('i18n-iso-countries/langs/en.json'));

const toText = (v) =>
  typeof v === 'string' || typeof v === 'number'
    ? String(v)
    : (v && v.message) ? String(v.message)
    : '';

/** Normalize any backend QR payload to either:
 *  - string (url/data-url) OR
 *  - a valid React element
 *  Never return a plain object that would hit <img src={object}>.
 */
const normalizeQr = (qr) => {
  if (!qr) return '';
  if (typeof qr === 'string') return qr;
  // If already a valid React element (e.g., <img/> or <QRCode/>)
  if (React.isValidElement(qr)) return qr;
  // Try common fields
  const candidate =
    qr?.props?.src ||
    qr?.src ||
    qr?.url ||
    (typeof qr === 'object' && typeof qr.data === 'string' && qr.data.startsWith('data:') ? qr.data : '');
  return candidate || '';
};

const EmailVerification = ({ user }) => {
  const theme = useTheme();
  const [statusText, setStatusText] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [showPhoneOtpInput, setShowPhoneOtpInput] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [isStatusSuccess, setIsStatusSuccess] = useState(false);
  const [authenticatorSecret, setAuthenticatorSecret] = useState(''); // string or React element
  const [totp, setTotp] = useState('');
  const [showQRCodeDialog, setShowQRCodeDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((s) => s - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleResend = async () => {
    if (resendTimer !== 0) return;
    const res = await resendTwoFactorCode(user.email);
    if (res?.data?.ok) {
      setStatusText('Resent successfully.');
      setIsStatusSuccess(true);
      setResendTimer(60);
    } else {
      setStatusText(toText(res?.data?.msg || 'Failed to resend. Try again later.'));
      setIsStatusSuccess(false);
    }
  };

  const handleClickShowPhone = () => setShowPhone((v) => !v);
  const handleMouseDownPhone = (e) => e.preventDefault();

  const emailVerificationSchema = Yup.object().shape({
    otp: Yup.string().required('OTP is required').length(4, 'OTP must be 4 digits'),
  });

  const phoneNumberSchema = Yup.object().shape({
    phoneNumber: Yup.string().required('Phone number is required'),
    phoneOtp: Yup.string().required('OTP is required').length(6, 'OTP must be 6 digits'),
    country: Yup.string().required('Country is required'),
  });

  const countries = getCountries();

  const handleSendCode = async (values, setFieldError, setSubmitting) => {
    setSubmitting(true);
    const res = await sendPhoneNumberVerificationCode(
      user.email,
      `+${getCountryCallingCode(values.country || 'US')}${values.phoneNumber}`,
      values.country || 'US'
    );
    if (res?.data?.ok) {
      setStatusText('Verification code sent successfully!');
      setIsStatusSuccess(true);
      setPhoneCodeSent(true);
      setResendTimer(60);
    } else {
      const msg = res?.data?.msg || 'Failed to send verification code. Try again later.';
      setStatusText(toText(msg));
      setIsStatusSuccess(false);
      setFieldError('phoneNumber', msg);
    }
    setSubmitting(false);
  };

  const handleVerifyPhone = async (values, setErrors, setSubmitting) => {
    setSubmitting(true);
    try {
      const phoneRes = await verifyPhoneNumberCode(user.email, values.phoneOtp);
      if (phoneRes?.data?.ok) {
        setStatusText('Phone number verification successful!');
        setIsStatusSuccess(true);

        // Normalize and show QR
        const normalized = normalizeQr(phoneRes?.data?.qrCode);
        setAuthenticatorSecret(normalized);
        setShowQRCodeDialog(!!normalized);
      } else {
        setStatusText('Invalid phone verification code!');
        setIsStatusSuccess(false);
        setErrors({ phoneOtp: 'Invalid phone verification code!' });
      }
    } catch (error) {
      setStatusText('Error during phone verification');
      setIsStatusSuccess(false);
    }
    setSubmitting(false);
  };

  const handleVerifyTOTP = async () => {
    if (!totp) {
      setStatusText('Please enter the TOTP');
      setIsStatusSuccess(false);
      return;
    }
    try {
      const response = await verifyTOTP(user.email, totp);
      if (response?.data?.ok) {
        setStatusText('TOTP verified successfully!');
        setIsStatusSuccess(true);
        setTimeout(() => navigate('/login'), 1000);
      } else {
        setStatusText('Failed to verify TOTP');
        setIsStatusSuccess(false);
      }
    } catch (error) {
      setStatusText('Error verifying TOTP');
      setIsStatusSuccess(false);
    }
  };

  return (
    <Grid container spacing={3} justifyContent="center">
      {showPhoneOtpInput ? (
        <Formik
          initialValues={{ phoneNumber: '', phoneOtp: '', country: 'US' }}
          validationSchema={phoneNumberSchema}
          onSubmit={(values, { setErrors, setSubmitting }) =>
            handleVerifyPhone(values, setErrors, setSubmitting)
          }
        >
          {({
            errors, handleBlur, handleChange, handleSubmit, isSubmitting,
            touched, values, setFieldValue, setFieldError, setErrors, setSubmitting
          }) => (
            <Box sx={{ width: '100%', mt: '10px' }}>
              <Typography variant="h4" align="center" gutterBottom>
                Phone Number Verification
              </Typography>

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
                  {countries.map((code) => (
                    <MenuItem key={code} value={code}>
                      {countryNames.getName(code, 'en')}
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
                    {touched.phoneOtp && errors.phoneOtp && (
                      <FormHelperText error>{errors.phoneOtp}</FormHelperText>
                    )}
                  </Box>

                  <Box mt={2}>
                    <Button
                      disableElevation
                      fullWidth
                      size="large"
                      variant="contained"
                      onClick={() => handleVerifyPhone(values, setErrors, setSubmitting)}
                      disabled={isSubmitting || updating}
                    >
                      {updating ? <CircularProgress size={24} /> : 'Verify Phone Number'}
                    </Button>
                  </Box>
                </>
              )}

              {statusText && (
                <Box mt={2}>
                  <Typography
                    align="center"
                    color={isStatusSuccess ? 'success.main' : 'error'}
                  >
                    {toText(statusText)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Formik>
      ) : (
        <Formik
          initialValues={{ otp: '' }}
          validationSchema={emailVerificationSchema}
          onSubmit={async (values, { setErrors, setSubmitting }) => {
            setSubmitting(true);
            const res = await verifyEmail(user.email, values.otp);
            if (res?.data?.ok) {
              setStatusText('Email verification successful!');
              setIsStatusSuccess(true);
              setShowPhoneOtpInput(true);
            } else {
              setStatusText('Invalid verification code!');
              setIsStatusSuccess(false);
            }
            setSubmitting(false);
          }}
        >
          {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
            <form onSubmit={handleSubmit}>
              <Box sx={{ width: '100%' }}>
                <Typography variant="h6" align="center" gutterBottom>
                  Email Verification
                </Typography>

                <Box mb={2}>
                  <OtpInput
                    value={values.otp}
                    onChange={(otpNumber) => handleChange({ target: { name: 'otp', value: otpNumber } })}
                    numInputs={4}
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
                  {touched.otp && errors.otp && <FormHelperText error>{errors.otp}</FormHelperText>}
                </Box>

                <Box mb={2}>
                  <Button
                    disableElevation
                    fullWidth
                    size="large"
                    variant="contained"
                    type="submit"
                    disabled={isSubmitting || updating}
                  >
                    {updating ? <CircularProgress size={24} /> : 'Continue'}
                  </Button>
                </Box>

                {statusText && (
                  <Box mt={2}>
                    <Typography
                      align="center"
                      color={isStatusSuccess ? 'success.main' : 'error'}
                    >
                      {toText(statusText)}
                    </Typography>
                  </Box>
                )}

                <Box mt={2}>
                  <Typography>Did not receive the email? Check your spam filter, or</Typography>
                  <Typography
                    variant="body1"
                    sx={{ minWidth: 85, ml: 2, textDecoration: 'none', cursor: 'pointer' }}
                    color="primary"
                    onClick={handleResend}
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
                  </Typography>
                </Box>
              </Box>
            </form>
          )}
        </Formik>
      )}

      {/* Snackbar (string-only rendering) */}
      <Snackbar open={!!statusText} autoHideDuration={6000} onClose={() => setStatusText('')}>
        <CustomAlert onClose={() => setStatusText('')} severity={isStatusSuccess ? 'success' : 'error'}>
          {toText(statusText)}
        </CustomAlert>
      </Snackbar>

      {/* QR Dialog (safe rendering for string/element) */}
      <Dialog open={showQRCodeDialog} onClose={() => setShowQRCodeDialog(false)}>
        <DialogTitle>Scan QR Code</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Scan this QR code with your authenticator app.
          </DialogContentText>

          {(() => {
            const s = authenticatorSecret;
            if (!s) return null;
            if (typeof s === 'string') {
              return (
                <img
                  src={s}
                  alt="Authenticator QR Code"
                  style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '10px auto' }}
                />
              );
            }
            if (React.isValidElement(s)) return s;
            return null;
          })()}

          <TextField
            autoFocus
            margin="dense"
            id="totp-code"
            label="Enter 6-digit Code"
            type="text"
            fullWidth
            variant="standard"
            value={totp || ''}
            onChange={(e) => setTotp(e.target.value)}
            error={!totp}
            helperText={!totp ? 'Please enter the code from your authenticator app' : ''}
          />

          {/* If you want the app store buttons back, re-enable and ensure they render plain elements */}
          {/* <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <GooglePlayButton url="https://play.google.com/apps/internaltest/4701521647417901976" badge="Google Play" />
            <AppStoreButton url="https://apps.apple.com/us/app/google-authenticator/id388497605" badge="App Store" />
          </Stack> */}
          <div style={{ margin: '20px 0' }}>
            <p>Download an authenticator app:</p>
            <p>
              <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="noopener noreferrer">
                Google Authenticator (Android)
              </a>
            </p>
            <p>
              <a href="https://apps.apple.com/us/app/google-authenticator/id388497605" target="_blank" rel="noopener noreferrer">
                Google Authenticator (iOS)
              </a>
            </p>
          </div>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowQRCodeDialog(false)}>Cancel</Button>
          <Button onClick={handleVerifyTOTP} variant="contained">Verify Code</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default EmailVerification;
