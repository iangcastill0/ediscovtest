import ReactDOM from 'react-dom';

// third party
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';

// project imports
import App from 'App';
import { BASE_PATH } from 'config';
import { store } from 'store';
import * as serviceWorker from 'serviceWorker';
import reportWebVitals from 'reportWebVitals';
import { ConfigProvider } from 'contexts/ConfigContext';

// style + assets
import 'assets/scss/style.scss';
//
// import { mergeStyles } from '@fluentui/react';
// import { Msal2Provider } from '@microsoft/mgt-msal2-provider';
import { CacheService, Providers, LoginType } from '@microsoft/mgt-element';
import { initializeIcons } from '@uifabric/icons';

// Providers.globalProvider = new Msal2Provider({
//     clientId: process.env.REACT_APP_CLIENT_ID,
//     loginType: LoginType.Popup,
//     scopes: [
//       'User.Read.All',
//       'eDiscovery.Read.All',
//       'eDiscovery.ReadWrite.All',
//     ],
//   });
  
  CacheService.config.people.isEnabled = true;
  initializeIcons();
//
// ==============================|| REACT DOM RENDER  ||============================== //

ReactDOM.render(
    <Provider store={store}>
        <ConfigProvider>
            <BrowserRouter basename={BASE_PATH}>
                <App />
            </BrowserRouter>
        </ConfigProvider>
    </Provider>,
    document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
