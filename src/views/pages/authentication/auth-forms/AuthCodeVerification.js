import { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Button, Grid, Stack, Typography, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import OtpInput from 'react-otp-input-rc-17';
import { resendTwoFactorCode, verify2FaCode, verifyPhoneNumberCode, verifyTOTP2, resendPhoneOtp } from 'utils/apiHelper';
import useAuth from 'hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import totpImage from 'assets/images/logo.png';
import {GooglePlayButton, AppStoreButton} from 'react-mobile-app-button';

// ============================|| STATIC - CODE VERIFICATION ||============================ //

const AuthCodeVerification = () => {
    const theme = useTheme();
    const [otpEmail, setOtpEmail] = useState('');
    const [otpPhone, setOtpPhone] = useState('');
    const [totp, setTotp] = useState('');
    const [statusText, setStatusText] = useState('');
    const [openTotpDialog, setOpenTotpDialog] = useState(false);
    const [emailResendTimer, setEmailResendTimer] = useState(0);
    const [phoneResendTimer, setPhoneResendTimer] = useState(0);
    const [isOtpEmailValid, setIsOtpEmailValid] = useState(true);
    const [isOtpPhoneValid, setIsOtpPhoneValid] = useState(true);
    const borderColor = theme.palette.mode === 'dark' ? theme.palette.grey[200] : theme.palette.grey[300];
    const { user, logout, twoFactorSuccess } = useAuth();
    const navigate = useNavigate();

    const handleContinue = async () => {
        if (user.twoStepEmail) {
            const res = await verify2FaCode(user.email, otpEmail);
            setIsOtpEmailValid(res.data.ok);
            if (!res.data.ok) {
                setStatusText(res.data.message);
                return;
            }
        }

        if (user.twoStepPhone) {
            const res = await verifyPhoneNumberCode(user.email, otpPhone);
            setIsOtpPhoneValid(res.data.ok);
            if (!res.data.ok) {
                setStatusText(res.data.msg);
                return;
            }
        }

        if (user.isAuthenticator) {
            setOpenTotpDialog(true);
        } else {
            twoFactorSuccess();
        }
    };

    const handleTotpSubmit = async () => {
        const res = await verifyTOTP2(user.email, totp);
        if (!res.data.ok) {
            setStatusText('Invalid TOTP code!');
        } else {
            setOpenTotpDialog(false);
            setStatusText('');
            twoFactorSuccess();
        }
    };

    useEffect(() => {
        if (!user) {
            logout();
            navigate('/login');
        }
    }, [user, logout, navigate]);

    useEffect(() => {
        let emailTimer, phoneTimer;
        if (emailResendTimer > 0) {
            emailTimer = setTimeout(() => setEmailResendTimer(emailResendTimer - 1), 1000);
        }
        if (phoneResendTimer > 0) {
            phoneTimer = setTimeout(() => setPhoneResendTimer(phoneResendTimer - 1), 1000);
        }
        return () => {
            clearTimeout(emailTimer);
            clearTimeout(phoneTimer);
        };
    }, [emailResendTimer, phoneResendTimer]);

    const handleResend = async (type) => {
        if (type === 'email') {
            const res = await resendTwoFactorCode(user.email);
            if (res.data.ok) {
                setStatusText('Email code resent successfully.');
                setEmailResendTimer(60); // 1 minute
            } else {
                setStatusText('Failed to resend email code. Try again later.');
            }
        } else {
            const res = await resendPhoneOtp();
            if (res.data.ok) {
                setStatusText('Phone code resent successfully.');
                setPhoneResendTimer(60); // 1 minute
            } else {
                setStatusText('Failed to resend phone code. Try again later.');
            }
        }
    };

    return (
        <Grid container spacing={3}>
            {user && user.twoStepEmail && (
                <>
                    <Grid item xs={12}>
                        <Typography variant="h5">Email Verification</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <OtpInput
                            value={otpEmail}
                            onChange={setOtpEmail}
                            numInputs={4}
                            containerStyle={{ justifyContent: 'space-between' }}
                            inputStyle={{
                                width: '100%',
                                margin: '8px',
                                padding: '10px',
                                border: `1px solid ${isOtpEmailValid ? borderColor : theme.palette.error.main}`,
                                borderRadius: 4,
                                ':hover': {
                                    borderColor: isOtpEmailValid ? theme.palette.primary.main : theme.palette.error.main
                                }
                            }}
                            focusStyle={{
                                outline: 'none',
                                border: `2px solid ${isOtpEmailValid ? theme.palette.primary.main : theme.palette.error.main}`
                            }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Typography
                            variant="body1"
                            sx={{ textDecoration: 'none', cursor: 'pointer' }}
                            color="primary"
                            onClick={() => emailResendTimer === 0 && handleResend('email')}
                            disabled={emailResendTimer > 0}
                        >
                            {emailResendTimer > 0 ? `Resend code in ${emailResendTimer}s` : 'Resend code'}
                        </Typography>
                    </Grid>
                </>
            )}
            {user && user.twoStepPhone && (
                <>
                    <Grid item xs={12}>
                        <Typography variant="h5">Phone Verification</Typography>
                        <Typography variant="body2">Please enter the code sent to your phone ending in {user.phoneNumber?.slice(-4)}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <OtpInput
                            value={otpPhone}
                            onChange={setOtpPhone}
                            numInputs={6}
                            containerStyle={{ justifyContent: 'space-between' }}
                            inputStyle={{
                                width: '100%',
                                margin: '8px',
                                padding: '10px',
                                border: `1px solid ${isOtpPhoneValid ? borderColor : theme.palette.error.main}`,
                                borderRadius: 4,
                                ':hover': {
                                    borderColor: isOtpPhoneValid ? theme.palette.primary.main : theme.palette.error.main
                                }
                            }}
                            focusStyle={{
                                outline: 'none',
                                border: `2px solid ${isOtpPhoneValid ? theme.palette.primary.main : theme.palette.error.main}`
                            }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Typography
                            variant="body1"
                            sx={{ textDecoration: 'none', cursor: 'pointer' }}
                            color="primary"
                            onClick={() => phoneResendTimer === 0 && handleResend('phone')}
                            disabled={phoneResendTimer > 0}
                        >
                            {phoneResendTimer > 0 ? `Resend code in ${phoneResendTimer}s` : 'Resend code'}
                        </Typography>
                    </Grid>
                </>
            )}
            <Grid item xs={12}>
                <Button disableElevation fullWidth size="large" type="submit" variant="contained" onClick={handleContinue}>
                    Continue
                </Button>
            </Grid>
            {statusText && (
                <Grid item xs={12}>
                    <Typography color="error">{statusText}</Typography>
                </Grid>
            )}

            <Dialog open={openTotpDialog} onClose={() => setOpenTotpDialog(false)} disableEscapeKeyDown>
                <DialogTitle>
                    <Typography variant="h5" align="center">
                        Two-Factor Authentication
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} alignItems="center">
                        <img src={totpImage} alt="TOTP" style={{ width: '300px', height: '100px' }} />
                        <Typography variant="body1" align="center">
                            Please enter the code from your authenticator app
                        </Typography>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="TOTP"
                            type="text"
                            fullWidth
                            value={totp}
                            onChange={(e) => setTotp(e.target.value)}
                        />
                        <Stack direction="row" spacing={2}>
                            <div style={{ margin: '10px 0' }}>
                                <p>Download an authenticator app:</p>
                                <p>
                                    <a href="https://play.google.com/apps/internaltest/4701521647417901976" target="_blank" rel="noopener noreferrer">
                                        Google Play Store
                                    </a>
                                </p>
                                <p>
                                    <a href="https://apps.apple.com/us/app/google-authenticator/id388497605" target="_blank" rel="noopener noreferrer">
                                        App Store
                                    </a>
                                </p>
                            </div>
                        </Stack>
                    </Stack>
                    {statusText && (
                        <Typography color="error" align="center">{statusText}</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleTotpSubmit} color="primary">
                        Verify
                    </Button>
                </DialogActions>
            </Dialog>
        </Grid>
    );
};

export default AuthCodeVerification;
