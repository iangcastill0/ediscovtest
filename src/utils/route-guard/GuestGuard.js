import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// project imports
import useAuth from 'hooks/useAuth';
import { DASHBOARD_PATH } from 'config';

// ==============================|| GUEST GUARD ||============================== //

/**
 * Guest guard for routes having no auth required
 * @param {PropTypes.node} children children element/node
 */

const GuestGuard = ({ children }) => {
    const { isLoggedIn, isTwoFactor } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoggedIn && !isTwoFactor)
        return;
        console.log(isLoggedIn, isTwoFactor);
        if (isLoggedIn && !isTwoFactor) {
            navigate('/two-factor', { replace: true });
        }

        if (isLoggedIn && isTwoFactor) {
            navigate(DASHBOARD_PATH, { replace: true });
        }

    }, [isLoggedIn, isTwoFactor, navigate]);

    return children;
};

GuestGuard.propTypes = {
    children: PropTypes.node
};

export default GuestGuard;
