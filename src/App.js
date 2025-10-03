// routing
import Routes from 'routes';

// project imports
import Locales from 'ui-component/Locales';
import NavigationScroll from 'layout/NavigationScroll';
import RTLLayout from 'ui-component/RTLLayout';
import Snackbar from 'ui-component/extended/Snackbar';
import ThemeCustomization from 'themes';
import { SlackProvider } from 'contexts/SlackContext';
import { MS365Provider } from 'contexts/MS365Context';
import ArchiveProvider from 'contexts/ArchiveContext';
import { DownloadProvider } from "contexts/DownloadContext";
import { MSOutlookProvider } from 'contexts/MSOutlookContext';
import { MSOnedriveProvider } from 'contexts/MSOnedriveContext';
import { MSSharepointProvider } from 'contexts/MSSharepointContext';
import { MSTeamsProvider } from 'contexts/MSTeamsContext';
import { GoogleGmailProvider } from 'contexts/GoogleGmailContext';
import { GoogleDriveProvider } from 'contexts/GoogleDriveContext';
import { GoogleCalendarProvider } from 'contexts/GoogleCalendarContext';
import { GoogleChatProvider } from 'contexts/GoogleChatContext';
// auth provider
// import { FirebaseProvider as AuthProvider } from 'contexts/FirebaseContext';
// import { AWSCognitoProvider as AuthProvider } from 'contexts/AWSCognitoContext';
import { JWTProvider as AuthProvider } from 'contexts/JWTContext';
import { SupportSettingsProvider } from 'contexts/SupportSettingsContext';
// import { Auth0Provider as AuthProvider } from 'contexts/Auth0Context';

// ==============================|| APP ||============================== //

const App = () => (
    <ThemeCustomization>
        {/* RTL layout */}
        <RTLLayout>
            <Locales>
                <NavigationScroll>
                    <AuthProvider>
                        <DownloadProvider>
                            <SlackProvider>
                                <ArchiveProvider>
                                    <MS365Provider>
                                        <MSOutlookProvider>
                                            <MSOnedriveProvider>
                                                <MSSharepointProvider>
                                                    <MSTeamsProvider>
                                                        <GoogleGmailProvider>
                                                            <GoogleDriveProvider>
                                                                <GoogleCalendarProvider>
                                                                    <GoogleChatProvider>
                                                                        <SupportSettingsProvider>
                                                                            <>
                                                                                <Routes />
                                                                                <Snackbar />
                                                                            </>
                                                                        </SupportSettingsProvider>
                                                                    </GoogleChatProvider>
                                                                </GoogleCalendarProvider>
                                                            </GoogleDriveProvider>
                                                        </GoogleGmailProvider>
                                                    </MSTeamsProvider>
                                                </MSSharepointProvider>
                                            </MSOnedriveProvider>
                                        </MSOutlookProvider>
                                    </MS365Provider>
                                </ArchiveProvider>
                            </SlackProvider>
                        </DownloadProvider>
                    </AuthProvider>
                </NavigationScroll>
            </Locales>
        </RTLLayout>
    </ThemeCustomization>
);

export default App;
