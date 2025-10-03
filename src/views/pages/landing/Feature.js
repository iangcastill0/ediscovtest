// material-ui
import { useTheme } from '@mui/material/styles';
import { Container, Grid, Typography } from '@mui/material';

// project imports
import FadeInWhenVisible from './Animation';
import SubCard from 'ui-component/cards/SubCard';
import Avatar from 'ui-component/extended/Avatar';
import { gridSpacing } from 'store/constant';

// assets
import legalComplianceImage from 'assets/images/landing/legal_compliance.jpg';
import forensicsInvestigationImage from 'assets/images/landing/forensics_investigation.jpg';
import informationGovernanceImage from 'assets/images/landing/information_governance.jpg';

const featureImageStyle = {
    width: '100%',
    borderRadius: '12px'
};
// =============================|| LANDING - FEATURE PAGE ||============================= //

const FeaturePage = () => {
    const theme = useTheme();
    return (
        <Container>
            <Grid container spacing={gridSpacing}>
                <Grid item xs={12} lg={5} md={10}>
                    {/* <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12}>
                            <Grid container spacing={1}>
                                <Grid item>
                                    <Typography variant="h5" color="primary">
                                        Top Features
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="h2" component="div">
                                What Complete Discovery brings to you?
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2">
                                Get a backup solution that can save time, cut costs, and give everyone in your organization a better way to restore their data.
                            </Typography>
                        </Grid>
                    </Grid> */}
                </Grid>
                <Grid item xs={12}>
                    <Grid container justifyContent="center" spacing={gridSpacing} sx={{ textAlign: 'center' }}>
                        <Grid item md={4} sm={6}>
                            <FadeInWhenVisible>
                                <SubCard>
                                    <Grid container justifyContent="center" spacing={2}>
                                        <Grid item>
                                            <img src={legalComplianceImage} alt="Legal Compliance" style={featureImageStyle} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="h3">Legal Compliance</Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body2">
                                                Download, archive, and preserve SaaS and cloud data. Complete Discovery’s AI makes ediscovery of large, offsite storage, messaging, and databases faster and more complete than ever before, all while preserving the forensic soundness of the collection.
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </SubCard>
                            </FadeInWhenVisible>
                        </Grid>
                        <Grid item md={4} sm={6}>
                            <FadeInWhenVisible>
                                <SubCard>
                                    <Grid container justifyContent="center" spacing={2}>
                                        <Grid item>
                                            <img src={forensicsInvestigationImage} alt="Legal Compliance" style={featureImageStyle} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="h3">Forensics and Investigation</Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body2">
                                            Authenticate, download, and search applications like Slack, Google Workspace, and Microsoft 365 using intuitive AI based on the Elastic Slack, while maintaining forensic soundness. Generate easy to read and understand reports and conversation strings which are representative of the native application with never-before-seen speed and accuracy.
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </SubCard>
                            </FadeInWhenVisible>
                        </Grid>
                        <Grid item md={4} sm={6}>
                            <FadeInWhenVisible>
                                <SubCard>
                                    <Grid container justifyContent="center" spacing={2}>
                                        <Grid item>
                                            <img src={informationGovernanceImage} alt="Legal Compliance" style={featureImageStyle} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="h3">Information Governance</Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body2">
                                                Gain insight and control of the cloud apps your users rely on and keep local copies. Setup scheduled archiving and search rules and notifications when actions violate policty of changes are made to the environment. Roll back to specific dates and maintain versions all within  the Complete Discovery ecosystem.
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </SubCard>
                            </FadeInWhenVisible>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Container>
    );
};

export default FeaturePage;
