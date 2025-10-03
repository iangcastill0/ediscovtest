// material-ui
import { useTheme, styled } from '@mui/material/styles';
import { Button, Card, CardContent, CardMedia, Grid, Typography } from '@mui/material';

// project imports
import { SERVER_URL } from 'utils/axios';
import AnimateButton from 'ui-component/extended/AnimateButton';
import { gridSpacing } from 'store/constant';

// assets
import InstallDesktopIcon from '@mui/icons-material/InstallDesktop';

import imageBackground from 'assets/images/maintenance/img-error-bg.svg';
import imageDarkBackground from 'assets/images/maintenance/img-error-bg-dark.svg';
import imageBlue from 'assets/images/maintenance/img-error-blue.svg';
import imageText from 'assets/images/maintenance/img-error-text.svg';
import imagePurple from 'assets/images/maintenance/img-error-purple.svg';
import { useParams } from 'react-router-dom';
import useAuth from 'hooks/useAuth';

// styles
const CardMediaWrapper = styled('div')({
    maxWidth: 720,
    margin: '0 auto',
    position: 'relative'
});

const ErrorWrapper = styled('div')({
    maxWidth: 550,
    margin: '0 auto',
    textAlign: 'center'
});

const ErrorCard = styled(Card)({
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
});

const CardMediaBlock = styled('img')({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    animation: '3s bounce ease-in-out infinite'
});

const CardMediaBlue = styled('img')({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    animation: '15s wings ease-in-out infinite'
});

const CardMediaPurple = styled('img')({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    animation: '12s wings ease-in-out infinite'
});

// ==============================|| ERROR PAGE ||============================== //

const GoogleInstallError = () => {
    const theme = useTheme();
    const {errCode} = useParams();
    const { user } = useAuth();

    const getTitle = () => {
        let msg = '';
        switch (errCode) {
            case '1':
                msg = `Domain not found`;
                break;
            default:
                break;
        }

        return msg;
    }

    const getSubTitle = () => {
        let msg = '';
        switch (errCode) {
            case '1':
                msg = 'Aministrator of an organization must consent to install the workspace.'
                break;
            default:
                break;
        }

        return msg;
    }

    return (
        <ErrorCard>
            <CardContent>
                <Grid container justifyContent="center" spacing={gridSpacing}>
                    <Grid item xs={12}>
                        <CardMediaWrapper>
                            <CardMedia
                                component="img"
                                image={theme.palette.mode === 'dark' ? imageDarkBackground : imageBackground}
                                title="Slider5 image"
                            />
                            <CardMediaBlock src={imageText} title="Slider 1 image" />
                            <CardMediaBlue src={imageBlue} title="Slider 2 image" />
                            <CardMediaPurple src={imagePurple} title="Slider 3 image" />
                        </CardMediaWrapper>
                    </Grid>
                    <Grid item xs={12}>
                        <ErrorWrapper>
                            <Grid container spacing={gridSpacing}>
                                <Grid item xs={12}>
                                    <Typography variant="h1" component="div">
                                        {getTitle()}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2">
                                        {getSubTitle()}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <AnimateButton>
                                    {/* <Button variant="contained" size="large" startIcon={<InstallDesktopIcon />}>
                                        <Link href={`${SERVER_URL}/slack/install?token=${window.localStorage.getItem('serviceToken')}`} style={{ color: 'white', textDecoration: 'none' }}>
                                            Install another workspace
                                        </Link>
                                    </Button> */}
                                        <Button variant="contained" size="large" href={`${SERVER_URL}/google/add-organization-test?state=${user?._id}`}>
                                            <InstallDesktopIcon sx={{ fontSize: '1.3rem', mr: 0.75 }} /> Add your organization
                                        </Button>
                                    </AnimateButton>
                                </Grid>
                            </Grid>
                        </ErrorWrapper>
                    </Grid>
                </Grid>
            </CardContent>
        </ErrorCard>
    );
};

export default GoogleInstallError;
