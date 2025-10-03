import { useTheme } from '@mui/material/styles';
import { Grid, Typography, Box } from '@mui/material';
import { useState, useEffect } from 'react';

import ProjectTaskCard from './ProjectTaskCard';
import CustomerSatisfactionCard from './CustomerSatisfactionCard';
import IconGridCard from './IconGridCard';
import WeatherCard from './WeatherCard';

import RevenueCard from 'ui-component/cards/RevenueCard';
import ReportCard from 'ui-component/cards/ReportCard';
import IconNumberCard from 'ui-component/cards/IconNumberCard';
import SideIconCard from 'ui-component/cards/SideIconCard';

import { gridSpacing } from 'store/constant';

// Icons
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentTwoTone';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltTwoTone';
import AccountCircleTwoTone from '@mui/icons-material/AccountCircleTwoTone';
import EmojiEventsTwoToneIcon from '@mui/icons-material/EmojiEventsTwoTone';
import PanToolTwoToneIcon from '@mui/icons-material/PanToolTwoTone';
import DescriptionTwoToneIcon from '@mui/icons-material/DescriptionTwoTone';
import FolderOpenTwoToneIcon from '@mui/icons-material/FolderOpenTwoTone';

import axios from 'utils/axios';
import { formatSizeUnits } from 'utils/utils';

const Statistics = () => {
  const theme = useTheme();

  const [statisticsData, setStatisticsData] = useState({
    activeUsers: 0,
    totalUsers: 0,
    subscribedUsers: 0,
    trialUsers: 0,
    suspendedUsers: 0,
    slackArchives:[],
    gmailArchives:[],
    gDriveArchives:[],
    outlookArchives:[],
    onedriveArchives:[],
    dropboxArchives:[],
    slackWorkspaces:[],
    googleWorkspaces:[],
    ms365Workspaces:[],
    dropboxWorkspaces:[],
  });

  useEffect(() => {
    const init = async () => {
      try {
        const resp = await axios.get(`/admin/statistics`);
        console.log(resp.data);
        if (resp.data.ok && resp.data.data) {
          setStatisticsData(resp.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
      }
    };

    init();
  },);

  const {
    activeUsers,
    totalUsers,
    subscribedUsers,
    trialUsers,
    suspendedUsers,
    slackArchives,
    gmailArchives,
    gDriveArchives,
    outlookArchives,
    onedriveArchives,
    dropboxArchives,
    slackWorkspaces,
    googleWorkspaces,
    ms365Workspaces,
    dropboxWorkspaces,
  } = statisticsData;

  let slackArchiveSize = 0;
  let gmailArchiveSize = 0;
  let gdriveArchiveSize = 0;
  let outlookArchiveSize = 0;
  let onedriveArchiveSize = 0;
  let dropboxArchiveSize = 0;

  slackArchives.forEach((archive) => (slackArchiveSize += archive.size));
  gmailArchives.forEach((archive) => (gmailArchiveSize += archive.size));
  gDriveArchives.forEach((archive) => (gdriveArchiveSize += archive.size));
  outlookArchives.forEach((archive) => (outlookArchiveSize += archive.size));
  onedriveArchives.forEach((archive) => (onedriveArchiveSize += archive.size));
  dropboxArchives.forEach((archive) => (dropboxArchiveSize += archive.size));

  return (
    <Grid container spacing={gridSpacing}>
      {/* === USERS SECTION === */}
      <Grid item xs={12}>
        <Box mt={2} mb={1}>
          <Typography variant="h4">Users</Typography>
        </Box>
      </Grid>

      <Grid item xs={12} lg={3} sm={6}>
        <ReportCard
          primary={totalUsers}
          secondary="Total Users"
          color={theme.palette.primary.main}
          iconPrimary={AccountCircleTwoTone}
        />
      </Grid>
      <Grid item xs={12} lg={3} sm={6}>
        <ReportCard
          primary={activeUsers}
          secondary="Active Users"
          color={theme.palette.success.main}
          iconPrimary={AssessmentOutlinedIcon}
        />
      </Grid>
      <Grid item xs={12} lg={3} sm={6}>
        <ReportCard
          primary={subscribedUsers}
          secondary="Subscribed Users"
          color={theme.palette.info.main}
          iconPrimary={EmojiEventsTwoToneIcon}
        />
      </Grid>
      <Grid item xs={12} lg={3} sm={6}>
        <ReportCard
          primary={trialUsers}
          secondary="Trial Users"
          color={theme.palette.warning.main}
          iconPrimary={PanToolTwoToneIcon}
        />
      </Grid>
      <Grid item xs={12} lg={3} sm={6}>
        <ReportCard
          primary={suspendedUsers}
          secondary="Suspended Users"
          color={theme.palette.error.main}
          iconPrimary={ThumbDownAltOutlinedIcon}
        />
      </Grid>

      {/* === ARCHIVES SECTION === */}
      <Grid item xs={12}>
        <Box mt={4} mb={1}>
          <Typography variant="h4">Archives</Typography>
        </Box>
      </Grid>

      <Grid item xs={12} lg={3} sm={6}>
        <IconNumberCard
          title="Slack Archives"
          primary={slackArchives?.length}
          secondary={formatSizeUnits(slackArchiveSize)} // Display size here
          color={theme.palette.primary.dark}
          iconPrimary={DescriptionTwoToneIcon}
        />
      </Grid>
      <Grid item xs={12} lg={3} sm={6}>
        <IconNumberCard
          title="Gmail Archives"
          primary={gmailArchives?.length}
          secondary={formatSizeUnits(gmailArchiveSize)} // Display size here
          color={theme.palette.secondary.main}
          iconPrimary={DescriptionTwoToneIcon}
        />
      </Grid>
      <Grid item xs={12} lg={3} sm={6}>
        <IconNumberCard
          title="Google Drive Archives"
          primary={gDriveArchives?.length}
          secondary={formatSizeUnits(gdriveArchiveSize)} // Display size here
          color={theme.palette.warning.dark}
          iconPrimary={FolderOpenTwoToneIcon}
        />
      </Grid>
      <Grid item xs={12} lg={3} sm={6}>
        <IconNumberCard
          title="Outlook Archives"
          primary={outlookArchives?.length}
          secondary={formatSizeUnits(outlookArchiveSize)} // Display size here
          color={theme.palette.info.dark}
          iconPrimary={DescriptionTwoToneIcon}
        />
      </Grid>
      <Grid item xs={12} lg={3} sm={6}>
        <IconNumberCard
          title="OneDrive Archives"
          primary={onedriveArchives?.length}
          secondary={formatSizeUnits(onedriveArchiveSize)} // Display size here
          color={theme.palette.success.main}
          iconPrimary={FolderOpenTwoToneIcon}
        />
      </Grid>
      <Grid item xs={12} lg={3} sm={6}>
        <IconNumberCard
          title="Dropbox Archives"
          primary={dropboxArchives?.length}
          secondary={formatSizeUnits(dropboxArchiveSize)} // Display size here
          color={theme.palette.error.main}
          iconPrimary={FolderOpenTwoToneIcon}
        />
      </Grid>

      {/* === WORKSPACES SECTION === */}
      <Grid item xs={12}>
        <Box mt={4} mb={1}>
          <Typography variant="h4">Workspaces</Typography>
        </Box>
      </Grid>

      <Grid item xs={12} lg={3} sm={6}>
        <RevenueCard
          primary="Slack Workspaces"
          secondary={slackWorkspaces?.length}
          content="Connected"
          iconPrimary={AssessmentOutlinedIcon}
          color={theme.palette.primary.main}
        />
      </Grid>
      <Grid item xs={12} lg={3} sm={6}>
        <RevenueCard
          primary="Google Workspaces"
          secondary={googleWorkspaces?.length}
          content="Connected"
          iconPrimary={AssessmentOutlinedIcon}
          color={theme.palette.success.main}
        />
      </Grid>
      <Grid item xs={12} lg={3} sm={6}>
        <RevenueCard
          primary="MS365 Workspaces"
          secondary={ms365Workspaces?.length}
          content="Connected"
          iconPrimary={AssessmentOutlinedIcon}
          color={theme.palette.warning.main}
        />
      </Grid>
      <Grid item xs={12} lg={3} sm={6}>
        <RevenueCard
          primary="Dropbox Workspaces"
          secondary={dropboxWorkspaces?.length}
          content="Connected"
          iconPrimary={AssessmentOutlinedIcon}
          color={theme.palette.error.main}
        />
      </Grid>

      {/* === OPTIONAL CARDS === */}
      <Grid item xs={12} mt={4}>
        <ProjectTaskCard />
      </Grid>

      <Grid item xs={12} lg={4} mt={4}>
        <CustomerSatisfactionCard />
      </Grid>

      <Grid item xs={12} lg={4}>
        <IconGridCard />
      </Grid>

      <Grid item xs={12} lg={4} md={12}>
        <WeatherCard />
      </Grid>
    </Grid>
  );
};

export default Statistics;