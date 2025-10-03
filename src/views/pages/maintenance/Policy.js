import { Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Grid, Stack, Typography, useMediaQuery, Container, Box } from '@mui/material';
import AuthWrapper2 from '../AuthWrapper2';
import Logo from 'ui-component/Logo';
import { DASHBOARD_PATH } from 'config';

const privacyPolicyContent = [
    {
        title: "1. Introduction",
        sections: [
            `Complete Discovery LLC ("we," "us," or "our") operates the website completediscovery.com and provides eDiscovery data capture services (collectively, the "Service"). This Privacy Policy informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.`
        ]
    },
    {
        title: "2. Information Collection and Use",
        sections: [
            "We collect several different types of information for various purposes to provide and improve our Service to you."
        ]
    },
    {
        title: "2.1 Types of Data Collected",
        sections: [
            "a) Personal Data",
            `While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). Personally identifiable information may include, but is not limited to:`,
            "- Email address",
            "- First name and last name",
            "- Phone number",
            "- Address, State, Province, ZIP/Postal code, City",
            "- Cookies and Usage Data"
        ]
    },
    {
        title: "b) Usage Data",
        sections: [
            `We may also collect information on how the Service is accessed and used ("Usage Data"). This Usage Data may include information such as your computer's Internet Protocol address (e.g., IP address), browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, unique device identifiers and other diagnostic data.`
        ]
    },
    {
        title: "c) Location Data",
        sections: [
            `We collect information about your general location based on your IP address, including the region from which your IP address originates.`
        ]
    },
    {
        title: "2.2 Tracking & Cookies Data",
        sections: [
            `We use cookies and similar tracking technologies to track the activity on our Service and hold certain information.`,
            `Cookies are files with small amount of data which may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.`
        ]
    },
    {
        title: "3. Use of Data",
        sections: [
            `Complete Discovery LLC uses the collected data for various purposes:`,
            "- To provide and maintain the Service",
            "- To notify you about changes to our Service",
            "- To allow you to participate in interactive features of our Service when you choose to do so",
            "- To provide customer care and support",
            "- To provide analysis or valuable information so that we can improve the Service",
            "- To monitor the usage of the Service",
            "- To detect, prevent, and address technical issues",
            "- To comply with legal obligations"
        ]
    },
    {
        title: "4. Legal Basis for Processing Personal Data Under GDPR",
        sections: [
            `If you are from the European Economic Area (EEA), Complete Discovery LLC's legal basis for collecting and using the personal information described in this Privacy Policy depends on the Personal Data we collect and the specific context in which we collect it.`,
            `We may process your Personal Data because:`,
            "- We need to perform a contract with you",
            "- You have given us permission to do so",
            "- The processing is in our legitimate interests and it's not overridden by your rights",
            "- To comply with the law"
        ]
    },
    {
        title: "5. Retention of Data",
        sections: [
            `Complete Discovery LLC will retain your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your Personal Data to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our legal agreements and policies.`
        ]
    },
    {
        title: "6. Transfer of Data",
        sections: [
            `Your information, including Personal Data, may be transferred to — and maintained on — computers located outside of your state, province, country or other governmental jurisdiction where the data protection laws may differ from those of your jurisdiction.`,
            `If you are located outside the United States and choose to provide information to us, please note that we transfer the data, including Personal Data, to the United States and process it there.`,
            `Your consent to this Privacy Policy followed by your submission of such information represents your agreement to that transfer.`
        ]
    },
    {
        title: "7. Disclosure of Data",
        sections: [
            `We may disclose your Personal Data in the good faith belief that such action is necessary to:`,
            "- Comply with a legal obligation",
            "- Protect and defend the rights or property of Complete Discovery LLC",
            "- Prevent or investigate possible wrongdoing in connection with the Service",
            "- Protect the personal safety of users of the Service or the public",
            "- Protect against legal liability"
        ]
    },
    {
        title: "8. Security of Data",
        sections: [
            `The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.`
        ]
    },
    {
        title: "9. Your Data Protection Rights Under GDPR",
        sections: [
            `If you are a resident of the European Economic Area (EEA), you have certain data protection rights. Complete Discovery LLC aims to take reasonable steps to allow you to correct, amend, delete, or limit the use of your Personal Data.`,
            `If you wish to be informed what Personal Data we hold about you and if you want it to be removed from our systems, please contact us.`,
            `In certain circumstances, you have the following data protection rights:`,
            "- The right to access, update or to delete the information we have on you",
            "- The right of rectification",
            "- The right to object",
            "- The right of restriction",
            "- The right to data portability",
            "- The right to withdraw consent"
        ]
    },
    {
        title: "10. Your California Privacy Rights (CCPA)",
        sections: [
            `If you are a California resident, you have certain rights under the California Consumer Privacy Act (CCPA), including:`,
            "- The right to know about the personal information we collect about you and how it is used and shared",
            "- The right to delete personal information collected from you (with some exceptions)",
            "- The right to opt-out of the sale of your personal information",
            "- The right to non-discrimination for exercising your CCPA rights",
            `To exercise your rights under CCPA, please contact us using the information provided in the "Contact Us" section.`
        ]
    },
    {
        title: "11. Changes To This Privacy Policy",
        sections: [
            `We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top of this Privacy Policy.`,
            `You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.`
        ]
    },
    {
        title: "12. Contact Us",
        sections: [
            `If you have any questions about this Privacy Policy, please contact us:`,
            `- By email: privacy@completediscovery.com`,
            `- By visiting this page on our website: https://completediscovery.com/privacytools`,
            `- By phone number: +1 727-287-6000`
        ]
    }
];

const PrivacyPolicy = () => {
    const theme = useTheme();
    const matchDownSM = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <AuthWrapper2>
            <Container maxWidth="lg" sx={{ minHeight: '100vh' }}>
                <Grid container justifyContent="center" alignItems="center" sx={{ minHeight: '100vh' }}>
                    <Grid item xs={12}>
                        <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ pt: 4, px: 2 }}>
                            <Link to={DASHBOARD_PATH}>
                                <Logo />
                            </Link>
                            <Typography
                                color={theme.palette.secondary.main}
                                gutterBottom
                                variant={matchDownSM ? 'h3' : 'h2'}
                                sx={{ fontWeight: 'bold' }}
                            >
                                PRIVACY POLICY
                            </Typography>
                            <Box sx={{ textAlign: 'left', width: '100%' }}>
                                {privacyPolicyContent.map((section, index) => (
                                    <Box key={index} sx={{ mb: 3 }}>
                                        {section.title && (
                                            <Typography variant="h4" gutterBottom>
                                                {section.title}
                                            </Typography>
                                        )}
                                        {section.sections.map((text, idx) => (
                                            <Typography variant="body1" sx={{ ml: 2 }} paragraph key={idx}>
                                                {text}
                                            </Typography>
                                        ))}
                                    </Box>
                                ))}
                            </Box>
                            <Box>
                                <Typography variant="body2" gutterBottom>
                                    Last updated: July 22, 2024
                                </Typography>
                            </Box>
                        </Stack>
                    </Grid>
                </Grid>
            </Container>
        </AuthWrapper2>
    );
};

export default PrivacyPolicy;
