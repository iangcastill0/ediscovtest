import { Link } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Grid, Stack, Typography, useMediaQuery } from '@mui/material';

// project imports
import AuthWrapper2 from '../AuthWrapper2';
import Logo from 'ui-component/Logo';
import { DASHBOARD_PATH } from 'config';

// ================================|| Support ||================================ //

const Support = () => {
    const theme = useTheme();
    const matchDownSM = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <AuthWrapper2>
            <Grid container justifyContent={matchDownSM ? 'center' : 'space-between'} alignItems="center">
                <Grid item md={12} lg={12} xs={12} sx={{ minHeight: '100vh' }}>
                    <Grid
                        sx={{ minHeight: '100vh' }}
                        container
                        alignItems={matchDownSM ? 'center' : 'flex-start'}
                        justifyContent={matchDownSM ? 'center' : 'space-between'}
                    >
                        <Grid item sx={{ display: { xs: 'none', md: 'block' }, m: 3 }}>
                            <Link to={DASHBOARD_PATH}>
                                <Logo />
                            </Link>
                        </Grid>
                        <Grid
                            item
                            xs={12}
                            container
                            justifyContent="center"
                            alignItems="center"
                            sx={{ minHeight: { xs: 'calc(100vh - 68px)', md: 'calc(100vh - 152px)' }, pb: 8 }}
                        >
                            <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ px: 8 }}>
                                <Typography
                                    color={theme.palette.secondary.main}
                                    gutterBottom
                                    variant={matchDownSM ? 'h3' : 'h2'}
                                >
                                    Welcome to the Support Center for Completediscovery.com
                                </Typography>
                                <Typography
                                    variant="caption"
                                    fontSize="16px"
                                    textAlign={matchDownSM ? 'center' : 'inherit'}
                                >
                                  <div>At Completediscovery.com, we are committed to providing exceptional service and support to our clients. Our dedicated support team is here to assist you with any queries or issues you may encounter. Here’s how you can reach us:</div>
                                  <br/>
                                  <div style={{fontSize: '20px'}}>Quick Help</div>
                                  <div>For immediate assistance, please check our FAQ section where you can find answers to common questions and troubleshooting tips.</div>
                                  <br/>
                                  <div style={{fontSize: '20px'}}>Contact Us</div>
                                  <div>If you can&apos;t find the answers you need in our FAQ, our Customer Support Team is available to assist you. Here are the ways you can get in touch:</div>
                                  <div>Email Support: Send us an email at info@dataprotection.ie, and one of our support specialists will get back to you within 24 hours.</div>
                                  <div>Phone Support: Call us at +353 57 868 4800. Our phone lines are open from 8 AM to 8 PM EST, Monday through Friday.</div>
                                  <div>Live Chat: Available on our website, our live chat is operational during business hours. Just click the chat icon on the bottom right of your screen to start a conversation with one of our agents.</div>
                                  <br/>
                                  <div style={{fontSize: '20px'}}>Technical Support</div>
                                  <div>If you are experiencing technical difficulties, please describe the issue in detail when contacting us so that we can assist you more efficiently. Providing information such as the type of device, operating system, and screenshots can help us resolve your issue faster.</div>
                                  <br/>
                                  <div style={{fontSize: '20px'}}>Feedback</div>
                                  <div>Your feedback is invaluable to us. If you have suggestions on how we can improve our services or compliments you would like to share, please email us at feedback@completediscovery.com.</div>
                                  <br/>
                                  <div style={{fontSize: '20px'}}>We&apos;re Here to Help!</div>
                                  <div>Our goal is to ensure that your experience with Completediscovery.com is smooth and satisfactory. We look forward to assisting you and thank you for choosing Completediscovery.com.</div>
                                </Typography>
                            </Stack>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </AuthWrapper2>
    );
};

export default Support;
