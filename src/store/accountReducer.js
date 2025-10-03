// action - state management
import { LOGIN, LOGOUT, REGISTER, TWOFACTOR, REFRESH } from './actions';

// ==============================|| ACCOUNT REDUCER ||============================== //

const initialState = {
    isLoggedIn: false,
    isInitialized: false,
    isTwoFactor: false,
    user: null
};

const accountReducer = (state = initialState, action) => {
    switch (action.type) {
        case REGISTER: {
            const { user } = action.payload;
            return {
                ...state,
                user
            };
        }
        case LOGIN: {
            const { user } = action.payload;
            return {
                ...state,
                isLoggedIn: true,
                isInitialized: true,
                user
            };
        }
        case REFRESH: {
            const { user } = action.payload;
            return {
                ...state,
                user
            };
        }
        case TWOFACTOR: {
            return {
                ...state,
                isLoggedIn: true,
                isTwoFactor: true
            };
        }
        case LOGOUT: {
            return {
                ...state,
                isInitialized: true,
                isLoggedIn: false,
                isTwoFactor: false,
                user: null
            };
        }
        default: {
            return { ...state };
        }
    }
};

export default accountReducer;
