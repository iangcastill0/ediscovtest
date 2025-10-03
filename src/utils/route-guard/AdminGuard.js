import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// project imports
import useAuth from 'hooks/useAuth';

// ==============================|| AUTH GUARD ||============================== //

/**
 * Authentication guard for routes
 * @param {PropTypes.node} children children element/node
 */
const AdminGuard = ({ children }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || !(user.roles.includes('admin') || user.roles.includes('superadmin'))) {
            navigate('login', { replace: true });
        }
    }, [user, navigate]);

    return children;
};

AdminGuard.propTypes = {
    children: PropTypes.node
};

export default AdminGuard;
