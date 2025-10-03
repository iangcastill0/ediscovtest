import PropTypes from 'prop-types';
import { createContext, useEffect, useReducer, useCallback } from 'react';

// third-party
import { Chance } from 'chance';
import jwtDecode from 'jwt-decode';

// reducer - state management
import { LOGIN, LOGOUT, REFRESH, TWOFACTOR } from 'store/actions';
import accountReducer from 'store/accountReducer';

// project imports
import Loader from 'ui-component/Loader';
import axios from 'utils/axios';
import { postLogoutAction } from 'utils/apiHelper';

const chance = new Chance();

// constant
const initialState = {
    isLoggedIn: false,
    isTwoFactor: false,
    isInitialized: false,
    user: null,
};

const verifyToken = (serviceToken) => {
    if (!serviceToken) {
        return false;
    }
    const decoded = jwtDecode(serviceToken);
    /**
     * Property 'exp' does not exist on type '<T = unknown>(token, options?: JwtDecodeOptions | undefined) => T'.
     */
    return decoded.exp > Date.now() / 1000;
};

const setSession = (serviceToken) => {
    if (serviceToken) {
        localStorage.setItem('serviceToken', serviceToken);
        axios.defaults.headers.common.Authorization = `${serviceToken}`;
    } else {
        localStorage.removeItem('serviceToken');
        delete axios.defaults.headers.common.Authorization;
    }
};

// ==============================|| JWT CONTEXT & PROVIDER ||============================== //
const JWTContext = createContext(null);

export const JWTProvider = ({ children }) => {
    const [state, dispatch] = useReducer(accountReducer, initialState);
    useEffect(() => {
        const init = async () => {
            try {
                console.log("JWTContext is loaded!");
                const serviceToken = window.localStorage.getItem('serviceToken');
                if (serviceToken && verifyToken(serviceToken)) {
                    setSession(serviceToken);
                    const response = await axios.get('/account/me');
                    const user = response.data.data;
                    if (user && user.isTwoFactored) {
                        dispatch({
                            type: LOGIN,
                            payload: {
                                isLoggedIn: true,
                                isTwoFactor: true,
                                user
                            }
                        });
                        dispatch({
                            type: TWOFACTOR,
                            payload: {
                                isTwoFactor: true
                            }
                        })
                    } else {
                        dispatch({
                            type: LOGOUT
                        });    
                    }
                    
                } else {
                    dispatch({
                        type: LOGOUT
                    });
                }
            } catch (err) {
                console.error(err);
                dispatch({
                    type: LOGOUT
                });
            }
        };

        init();
    }, []);

    const login = async (email, password) => {
        const response = await axios.post('/auth/login', { email, password });
        const { serviceToken, user } = response.data;
        setSession(serviceToken);
        dispatch({
            type: LOGIN,
            payload: {
                isLoggedIn: true,
                user
            }
        });
    };

    const refresh = async () => {
        const response = await axios.get('/account/me');
        const user = response.data.data;
        dispatch({
            type: REFRESH,
            payload: {
                user
            }
        });
    };

    const twoFactorSuccess = useCallback(async () => {
        await axios.post('/auth/signin-success')
        dispatch({
            type: TWOFACTOR,
            payload: {
                isTwoFactor: true
            }
        });
    }, []);

    const register = async (email, password, firstName, lastName) => {
        // todo: this flow need to be recode as it not verified
        const id = chance.bb_pin();
        const response = await axios.post('/auth/register2', {
            id,
            email,
            password,
            firstName,
            lastName
        });
        let users = response.data;

        if (window.localStorage.getItem('users') !== undefined && window.localStorage.getItem('users') !== null) {
            const localUsers = window.localStorage.getItem('users');
            users = [
                ...JSON.parse(localUsers),
                {
                    id,
                    email,
                    password,
                    name: `${firstName} ${lastName}`
                }
            ];
        }

        window.localStorage.setItem('users', JSON.stringify(Array.isArray(users) ? users : [users]));

        return response.data;
    };

    const logout = async () => {
        await postLogoutAction();
        setSession(null);
        dispatch({ type: LOGOUT });
    };

    const forgotPassword = async email => {
        const response = await axios.post('/auth/forgot-password', {
            email
        });
        const msg = response;
        // console.log(msg.data);
        return msg.data;
    };

    const resetPassword = async (token, password) => {
        const response = await axios.post('/auth/reset-password', {
            token,
            password
        });
        const msg = response;
        // console.log(msg.data);
        return msg.data;
    };

    if (state.isInitialized !== undefined && !state.isInitialized) {
        return <Loader />;
    }
    
    return (
        <JWTContext.Provider value={{ ...state, login, logout, twoFactorSuccess, register, forgotPassword, resetPassword, refresh }}>{children}</JWTContext.Provider>
    );
};

JWTProvider.propTypes = {
    children: PropTypes.node
};
export {verifyToken, setSession};
export default JWTContext;
