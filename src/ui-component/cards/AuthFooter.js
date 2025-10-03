// material-ui
import { Link, Typography, Stack } from '@mui/material';
import config from '../../config';
// ==============================|| FOOTER - AUTHENTICATION 2 & 3 ||============================== //

const AuthFooter = () => (
    <Stack direction="row" justifyContent="space-between">
        <Typography variant="subtitle2" component={Link} href={`${config.serverName}`} target="_blank" underline="hover">
            {`${config.serverName}`}
        </Typography>
        <Typography variant="subtitle2" component={Link} href="https://evestigate.com" target="_blank" underline="hover">
            &copy; evestigate.com
        </Typography>
    </Stack>
);

export default AuthFooter;
