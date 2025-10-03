import PropTypes from 'prop-types';

// material-ui
import { Grid, Typography, Box } from '@mui/material';

// project imports
import MainCard from './MainCard';

// =============================|| ICON NUMBER CARD ||============================= //

const IconNumberCard = ({ title, primary, secondary, color, iconPrimary }) => {
  const IconPrimary = iconPrimary;
  const primaryIcon = iconPrimary ? <IconPrimary /> : null;

  return (
    <MainCard>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12}>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Box display="flex" alignItems="center">
                {primaryIcon && (
                  <Typography variant="subtitle2" sx={{ color, marginRight: 1 }}>
                    {primaryIcon}
                  </Typography>
                )}
                <Typography variant="h5" color="inherit">
                  {title}
                </Typography>
              </Box>
            </Grid>
            <Grid item>
              <Typography variant="h3">{primary}</Typography>
            </Grid>
          </Grid>
          {secondary && (
            <Box mt={1}>
              <Typography variant="body2" color="textSecondary">
                {secondary}
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </MainCard>
  );
};

IconNumberCard.propTypes = {
  title: PropTypes.string,
  primary: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  secondary: PropTypes.string,
  color: PropTypes.string,
  iconPrimary: PropTypes.object,
};

export default IconNumberCard;