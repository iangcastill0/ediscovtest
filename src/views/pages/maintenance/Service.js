import { Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Grid, Stack, Typography, useMediaQuery, Container, Box } from '@mui/material';
import AuthWrapper2 from '../AuthWrapper2';
import Logo from 'ui-component/Logo';
import { DASHBOARD_PATH } from 'config';

const termsContent = [
    {
        title: "1. License Grant",
        sections: [
            `1.1 Complete Discovery LLC ("we," "us," or "our") grants you a limited, non-exclusive, non-transferable, and revocable license to access and use our eDiscovery data capture solution, Complete Discovery ("the Service"), solely for your internal business purposes, subject to these Terms of Service.`,
            `1.2 This license does not transfer ownership of the Service to you, nor does it grant you any rights to the Service beyond those expressly stated in these Terms.`
        ]
    },
    {
        title: "2. Service Availability",
        sections: [
            "2.1 Complete Discovery is provided on a Software-as-a-Service (SaaS) basis. While we strive to ensure high availability and reliability of the Service, we do not guarantee uninterrupted access or any specific level of uptime.",
            "2.2 You acknowledge that the Service may be unavailable or offline due to maintenance, updates, or factors beyond our control."
        ]
    },
    {
        title: "3. Security and Risk",
        sections: [
            "3.1 While we implement industry-standard security measures to protect the Service and your data, no application, operating system, database, or cloud provider can guarantee absolute security against cyber incidents, and you understand that Complete Discovery cannot be held liable for cybersecurity incidents or breaches.",
            "3.2 You use the Service at your own risk. We strongly recommend that you maintain appropriate cybersecurity insurance to mitigate potential risks.",
            "3.3 You use the Service at your own risk. We strongly recommend that you maintain appropriate cybersecurity standards; for example, use the provided multifactor authentication (MFA), enforce strong passwords, do not allow password sharing or account sharing, and train employees on cybersecurity. You should also regularly review the Complete Discovery logs for suspect activity.",
            "3.4 Complete Discovery encrypts all data with an encryption key you provide. The key is unique to your organization and..."
        ]
    },
    {
        title: "4. Data Ownership and Retrieval",
        sections: [
            "4.1 All data stored in Complete Discovery remains the property of the customer.",
            "4.2 You may retrieve your data from the Service anytime during the active subscription period."
        ]
    },
    {
        title: "5. Customer Responsibility for Content",
        sections: [
            "5.1 You are solely responsible for the content you access, acquire, store, and use through the Service.",
            "5.2 You must ensure that you have the legal right to collect and store all data in the Service and that your use complies with all applicable U.S. and international privacy laws and regulations."
        ]
    },
    {
        title: "6. Subscription and Termination",
        sections: [
            "6.1 The Service is provided on a subscription basis.",
            "6.2 Either party may terminate the subscription at any time, subject to the terms outlined in this agreement."
        ]
    },
    {
        title: "7. Payment and Account Status",
        sections: [
            "7.1 Subscription fees are due by the 1st of each month.",
            "7.2 If payment is not received by the 15th of the month, all access to the Service will be suspended until the account is brought current.",
            "7.3 If the account remains unpaid by the last day of the month, we will archive your data for an additional 30 days.",
            "7.4 If the account is not brought current within this 30-day archive period, we reserve the right to irretrievably delete all your data."
        ]
    },
    {
        title: "8. Intellectual Property",
        sections: [
            "8.1 All intellectual property rights in the Service, including but not limited to software, designs, and documentation, remain the exclusive property of Complete Discovery LLC or its licensors."
        ]
    },
    {
        title: "9. Limitation of Liability",
        sections: [
            "9.1 To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues resulting from your use of the Service."
        ]
    },
    {
        title: "10. Modifications to the Service and Terms",
        sections: [
            "10.1 We reserve the right to modify or discontinue, temporarily or permanently, the Service or any features thereof without prior notice.",
            "10.2 We may update these Terms from time to time. Your continued use of the Service after such changes constitutes your acceptance of the new Terms."
        ]
    },
    {
        title: "11. Governing Law and Jurisdiction",
        sections: [
            "11.1 These Terms shall be governed by and construed in accordance with the laws of the state of Florida, without regard to its conflict of law provisions."
        ]
    },
    {
        title: "12. Data Collection for Security Purposes",
        sections: [
            "12.1 To enhance the security of Complete Discovery and protect users' data, we collect certain information about users and their access to the Service. This information includes, but is not limited to:",
            "a) IP address",
            "b) Geographic region of the IP address",
            "c) Browser type and version",
            "d) Operating system",
            "e) Device information",
            "f) Login timestamps",
            "g) Other technical information that may help identify the user and secure their account",
            "12.2 This information is collected and used solely for the purposes of:",
            "a) Authenticating users and their devices",
            "b) Detecting and preventing unauthorized access",
            "c) Identifying and mitigating potential security threats",
            "d) Improving the overall security of the Service",
            "12.3 We process and store this information in accordance with our Privacy Policy and applicable data protection laws.",
            "12.4 You acknowledge and consent to the collection and use of this information as described in this section as a condition of using the Service."
        ]
    }
];

const Service = () => {
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
                                TERMS OF SERVICE
                            </Typography>
                            <Box sx={{ textAlign: 'left', width: '100%' }}>
                                {termsContent.map((section, index) => (
                                    <Box key={index} sx={{ mb: 3 }}>
                                        {section.title && (
                                            <Typography variant="h4" gutterBottom>
                                                {section.title}
                                            </Typography>
                                        )}
                                        {section.sections.map((text, idx) => (
                                            <Typography variant="body1" sx={{ml: 2}} paragraph key={idx}>
                                                {text}
                                            </Typography>
                                        ))}
                                    </Box>
                                ))}
                            </Box>
                            <Box>
                                <Typography variant="h4" gutterBottom>
                                    By using Complete Discovery, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                                </Typography>
                                <Typography variant="h5" sx={{float: 'right'}} gutterBottom>
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

export default Service;
