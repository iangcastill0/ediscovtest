import React from 'react';
import axios from 'utils/axios';
import { useDispatch } from 'store';
import { openSnackbar } from 'store/slices/snackbar';
// material-ui
import { useTheme } from '@mui/material/styles';
import {
    Box,
    Button,
    Divider,
    Grid,
    LinearProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip
} from '@mui/material';

// react-router
import { useLocation } from 'react-router-dom';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import { gridSpacing } from 'store/constant';

// assets
import CheckTwoToneIcon from '@mui/icons-material/CheckTwoTone';
import EventIcon from '@mui/icons-material/Event';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import {
    ApplePay,
    GooglePay,
    CreditCardInput,
    SquarePaymentsForm
} from 'react-square-web-payments-sdk';
import useAuth from 'hooks/useAuth';
import { getBillingPlans, unsubscribe } from 'utils/apiHelper';

const Billing = () => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const location = useLocation();
    const { user, refresh } = useAuth();

    const [loading, setLoading] = React.useState(false);
    const [selectedPlan, setSelectedPlan] = React.useState(null);
    const [browser, setBrowser] = React.useState('');
    const [plans, setPlans] = React.useState([]);
    const [showTrialEnded, setShowTrialEnded] = React.useState(false);
    const [showWorkspaceLimit, setShowWorkspaceLimit] = React.useState(false);
    const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false);

    React.useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const status = searchParams.get('status');

        if (status === '2') {
            setShowTrialEnded(true);
        } else if (status === '3') {
            setShowWorkspaceLimit(true);
        }

        const userAgent = navigator.userAgent;
        if (userAgent.indexOf('Chrome') > -1) {
            setBrowser('Google Chrome');
        } else if (userAgent.indexOf('Safari') > -1) {
            setBrowser('Safari');
        } else if (userAgent.indexOf('Firefox') > -1) {
            setBrowser('Mozilla Firefox');
        } else if (userAgent.indexOf('MSIE ') > -1 || userAgent.indexOf('Trident/') > -1) {
            setBrowser('Microsoft Internet Explorer');
        } else if (userAgent.indexOf('Edge') > -1) {
            setBrowser('Microsoft Edge');
        } else {
            setBrowser('Unknown Browser');
        }

        setLoading(true);
        const fetchPlans = async () => {
            try {
                const response = await getBillingPlans();
                setPlans(response.data || []);
            } catch (error) {
                dispatch(openSnackbar({
                    open: true,
                    message: 'Failed to load plans',
                    variant: 'alert',
                    alert: { color: 'error' },
                    close: true
                }));
            } finally {
                setLoading(false);
            }
        };

        fetchPlans();
    }, [location.search, dispatch]);

    const handleUnSubscribe = async () => {
        try {
            const resp = await unsubscribe();
            if (resp.ok) {
                dispatch(openSnackbar({
                    open: true,
                    message: 'Successfully unsubscribed!',
                    variant: 'alert',
                    alert: { color: 'success' },
                    close: true
                }));
                refresh();
            } else {
                throw new Error(resp.data || 'Failed to unsubscribe');
            }
        } catch (error) {
            dispatch(openSnackbar({
                open: true,
                message: error.message,
                variant: 'alert',
                alert: { color: 'error' },
                close: true
            }));
        }
    };

    const handleSubscription = async (token, buyer, plan) => {
        if (token.errors && token.errors.length > 0) {
            dispatch(openSnackbar({
                open: true,
                message: token.errors[0].message,
                variant: 'alert',
                alert: { color: 'error' },
                close: true
            }));
            return;
        }

        try {
            const response = await axios.post('/billing/create-subscription', {
                sourceId: token.token,
                planId: plan.planId,
                planVariationId: plan.planVariationId,
            });

            if (response.status === 200) {
                dispatch(openSnackbar({
                    open: true,
                    message: 'Successfully subscribed!',
                    variant: 'alert',
                    alert: { color: 'success' },
                    close: true
                }));
                setSelectedPlan(null);
                setPaymentDialogOpen(false);
                refresh();
            } else {
                throw new Error('Subscription failed');
            }
        } catch (error) {
            dispatch(openSnackbar({
                open: true,
                message: 'Subscription failed. Please try again.',
                variant: 'alert',
                alert: { color: 'error' },
                close: true
            }));
        }
    };

    // Function to get subscription status details
    const getSubscriptionDetails = () => {
        if (!user || !user.activeSubscription) return null;
        
        const { activeSubscription, subscriptionStatus } = user;
        const isCanceled = subscriptionStatus === 'CANCELED';
        const isActive = subscriptionStatus === 'ACTIVE';
        
        return {
            status: subscriptionStatus,
            isCanceled,
            isActive,
            canceledDate: activeSubscription.canceledDate,
            nextDueDate: isActive ? activeSubscription.chargedThroughDate : null,
            startDate: activeSubscription.startDate
        };
    };

    const subscriptionDetails = getSubscriptionDetails();

    if (!user) return null;

    return (
        <Grid container spacing={gridSpacing}>
            <Grid item xs={12}>
                {showTrialEnded && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Your trial period has ended. Please upgrade your account to continue using the service.
                    </Alert>
                )}
                {showWorkspaceLimit && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Your workspace count is limited. Please extend your plan.
                    </Alert>
                )}
                {loading && <LinearProgress />}
                
                {/* Current Subscription Status Card */}
                {user.isSubscribed && subscriptionDetails && (
                    <MainCard sx={{ mb: 3 }} title="Current Subscription">
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="h6">Status</Typography>
                                <Box display="flex" alignItems="center" mt={1}>
                                    <Chip 
                                        icon={subscriptionDetails.isCanceled ? <CancelIcon /> : <CheckCircleIcon />}
                                        label={subscriptionDetails.status}
                                        color={subscriptionDetails.isCanceled ? "warning" : "success"}
                                        variant="outlined"
                                    />
                                </Box>
                            </Grid>
                            
                            {subscriptionDetails.isCanceled && subscriptionDetails.canceledDate && (
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="h6">Subscription Ends</Typography>
                                    <Box display="flex" alignItems="center" mt={1}>
                                        <EventIcon sx={{ mr: 1 }} />
                                        <Typography>
                                            {new Date(subscriptionDetails.canceledDate).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                </Grid>
                            )}
                            
                            {subscriptionDetails.isActive && subscriptionDetails.nextDueDate && (
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="h6">Next Payment Due</Typography>
                                    <Box display="flex" alignItems="center" mt={1}>
                                        <EventIcon sx={{ mr: 1 }} />
                                        <Typography>
                                            {new Date(subscriptionDetails.nextDueDate).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                </Grid>
                            )}
                            
                            <Grid item xs={12} sm={6}>
                                <Typography variant="h6">Start Date</Typography>
                                <Box display="flex" alignItems="center" mt={1}>
                                    <EventIcon sx={{ mr: 1 }} />
                                    <Typography>
                                        {new Date(subscriptionDetails.startDate).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            </Grid>
                            
                            <Grid item xs={12}>
                                <Button 
                                    variant="contained" 
                                    color="error" 
                                    onClick={handleUnSubscribe}
                                    disabled={subscriptionDetails.isCanceled}
                                    sx={{ mt: 2 }}
                                >
                                    {subscriptionDetails.isCanceled ? 'Cancellation Scheduled' : 'Cancel Subscription'}
                                </Button>
                                {subscriptionDetails.isCanceled && (
                                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                                        Your subscription will remain active until the end date shown above.
                                    </Typography>
                                )}
                            </Grid>
                        </Grid>
                    </MainCard>
                )}
            </Grid>

            {plans.map((plan, index) => {
                const darkBorder = theme.palette.mode === 'dark'
                    ? theme.palette.background.default
                    : theme.palette.primary[200] + 75;

                return (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <MainCard
                            boxShadow
                            sx={{
                                pt: 1.75,
                                border: plan.planId === user.planID ? '3px solid' : '1px solid',
                                borderColor: plan.planId === user.planID ? 'secondary.main' : darkBorder,
                                background: plan.planId === user.planID ? darkBorder : 'secondary.main'
                            }}
                        >
                            <Grid container textAlign="center" spacing={gridSpacing}>
                                <Grid item xs={12}>
                                    <Box
                                        sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '50%',
                                            width: 80,
                                            height: 80,
                                            background: theme.palette.mode === 'dark'
                                                ? theme.palette.dark[800]
                                                : theme.palette.primary.light,
                                            color: theme.palette.primary.main,
                                        }}
                                    >
                                        {/* Icon can go here */}
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontSize: '1.5625rem',
                                            fontWeight: 500,
                                            position: 'relative',
                                            mb: 1.875,
                                            '&:after': {
                                                content: '""',
                                                position: 'absolute',
                                                bottom: -15,
                                                left: 'calc(50% - 25px)',
                                                width: 50,
                                                height: 4,
                                                background: theme.palette.primary.main,
                                                borderRadius: '3px'
                                            }
                                        }}
                                    >
                                        {plan.title}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2">{plan.description}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography
                                        component="div"
                                        variant="body2"
                                        sx={{
                                            fontSize: '2.1875rem',
                                            fontWeight: 700,
                                            '& > span': {
                                                fontSize: '1.25rem',
                                                fontWeight: 500
                                            }
                                        }}
                                    >
                                        <sup>$</sup>
                                        {plan.price}
                                        <span>/Monthly</span>
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <List
                                        sx={{
                                            m: 0,
                                            p: 0,
                                            '&> li': {
                                                px: 0,
                                                py: 0.625,
                                                '& svg': {
                                                    fill: theme.palette.success.dark
                                                }
                                            }
                                        }}
                                        component="ul"
                                    >
                                        <ListItem>
                                            <ListItemIcon>
                                                <CheckTwoToneIcon sx={{ fontSize: '1.3rem' }} />
                                            </ListItemIcon>
                                            <ListItemText primary={plan.workspaceCount > 99 ? 'Unlimited Workspaces' : `${plan.workspaceCount} Workspaces`} />
                                        </ListItem>
                                        <Divider />
                                        <ListItem>
                                            <ListItemIcon>
                                                <CheckTwoToneIcon sx={{ fontSize: '1.3rem' }} />
                                            </ListItemIcon>
                                            <ListItemText primary={`${plan.storageSpace}TB Storage`} />
                                        </ListItem>
                                        <Divider />
                                    </List>
                                </Grid>
                                <Grid item xs={12}>
                                    {plan.planId === user.planID ? (
                                        <Box>
                                            <Chip 
                                                label="Current Plan" 
                                                color="primary" 
                                                variant="outlined"
                                                sx={{ mb: 1 }}
                                            />
                                            {!user.isSubscribed && (
                                                <Button variant="outlined" fullWidth onClick={() => {
                                                    setSelectedPlan(plan);
                                                    setPaymentDialogOpen(true);
                                                }}>
                                                    Subscribe Again
                                                </Button>
                                            )}
                                        </Box>
                                    ) : (
                                        <Button variant="outlined" onClick={() => {
                                            if (user.isSubscribed && !subscriptionDetails?.isCanceled) {
                                                dispatch(openSnackbar({
                                                    open: true,
                                                    message: 'Cancel your current subscription first before changing plans.',
                                                    variant: 'alert',
                                                    alert: { color: 'warning' },
                                                    close: true
                                                }));
                                                return;
                                            }
                                            setSelectedPlan(plan);
                                            setPaymentDialogOpen(true);
                                        }}>
                                            Choose Plan
                                        </Button>
                                    )}
                                </Grid>
                            </Grid>
                        </MainCard>
                    </Grid>
                );
            })}

            {/* Payment Dialog */}
            <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Subscribe to {selectedPlan?.title} Plan
                </DialogTitle>
                <DialogContent>
                    <Typography variant="h6" gutterBottom>
                        Total: ${selectedPlan?.price}/month
                    </Typography>
                    {selectedPlan && (
                        <SquarePaymentsForm
                            applicationId="sandbox-sq0idb-PEGlj4vt9pj6zNG55u3Erg"
                            locationId="LCRNEZS68PPFA"
                            createPaymentRequest={() => ({
                                countryCode: "US",
                                currencyCode: "USD",
                                total: {
                                    amount: `${selectedPlan.price}`,
                                    label: "Total",
                                },
                            })}
                            cardTokenizeResponseReceived={(token, buyer) => {
                                handleSubscription(token, buyer, selectedPlan);
                            }}
                        >
                            {browser === 'Safari' && <ApplePay />}
                            <GooglePay />
                            <CreditCardInput />
                        </SquarePaymentsForm>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>
        </Grid>
    );
};

export default Billing;