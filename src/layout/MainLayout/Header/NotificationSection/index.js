import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import {
    Avatar,
    Badge,
    Box,
    ClickAwayListener,
    Grid,
    Paper,
    Popper,
    Stack,
    Typography,
    useMediaQuery,
    LinearProgress,
    Chip,
    Collapse,
    IconButton,
    Card,
    Link
} from '@mui/material';
import PerfectScrollbar from 'react-perfect-scrollbar';
import MainCard from 'ui-component/cards/MainCard';
import Transitions from 'ui-component/extended/Transitions';
import axiosServices from 'utils/axios';
import useAuth from 'hooks/useAuth';
import { IconBell, IconChevronDown, IconChevronUp } from '@tabler/icons';
import useDownload from 'hooks/useDownload';
import { useNavigate } from 'react-router-dom';
import { formatSizeUnits } from 'utils/utils';

const NotificationSection = () => {
    const theme = useTheme();
    const [open, setOpen] = useState(false);
    const [archiveStates, setArchiveStates] = useState([]);
    const [expandedDownloads, setExpandedDownloads] = useState(true);
    const [expandedArchives, setExpandedArchives] = useState(true);
    const anchorRef = useRef(null);
    const { user } = useAuth();
    const { downloadList, downloadBadge } = useDownload();
    const navigate = useNavigate();

    const getViewedNotifications = () => {
        const storedViewed = localStorage.getItem('viewedNotifications');
        return storedViewed ? new Set(JSON.parse(storedViewed)) : new Set();
    };
    const [viewedNotifications, setViewedNotifications] = useState(getViewedNotifications());

    const fetchArchiveStates = async () => {
        if (!user?._id) return;
        try {
            const response = await axiosServices.get(`/archive/progress/${user._id}`);
            setArchiveStates(response.data?.data || []);
        } catch (error) {
            console.error('Error fetching archive states:', error);
        }
    };

    useEffect(() => {
        fetchArchiveStates();
        const archiveInterval = setInterval(fetchArchiveStates, 1000 * 30);
        return () => clearInterval(archiveInterval);
    }, [user?._id]);

    const sortedArchives = [...archiveStates].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    const isProcessing = archiveStates.some((archive) => archive.state === 'processing');
    const archiveNotificationCount = sortedArchives.filter((archive) => !viewedNotifications.has(archive._id)).length;
    const totalNotifications = archiveNotificationCount + downloadBadge;

    const [animateBadge, setAnimateBadge] = useState(false);
    const prevTotalNotifications = useRef(totalNotifications);

    useEffect(() => {
        if (totalNotifications > prevTotalNotifications.current) {
            setAnimateBadge(true);
            const timer = setTimeout(() => {
                setAnimateBadge(false);
            }, 500);
            return () => clearTimeout(timer);
        }
        prevTotalNotifications.current = totalNotifications;
    }, [totalNotifications]);


    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen);
        if (!open) {
            const newViewed = new Set(archiveStates.map((a) => a._id));
            setViewedNotifications(newViewed);
            localStorage.setItem('viewedNotifications', JSON.stringify([...newViewed]));
        }
    };

    const handleClose = (event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target)) return;
        setOpen(false);
    };

    return (
        <>
            <Box sx={{ ml: 2, mr: 3 }}>
                <Badge
                    badgeContent={totalNotifications}
                    color="error"
                    overlap="circular"
                    sx={{
                        '@keyframes shake': {
                            '0%, 100%': { transform: 'translateX(0)' },
                            '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-3px)' },
                            '20%, 40%, 60%, 80%': { transform: 'translateX(3px)' }
                        },
                        '& .MuiBadge-badge': {
                            animation: animateBadge ? 'shake 0.5s ease-in-out' : 'none'
                        }
                    }}
                >
                    <Avatar
                        variant="rounded"
                        sx={{
                            '@keyframes pulseGlow': {
                                '0%': {
                                    boxShadow: `0 0 0 0 ${theme.palette.error.light}`
                                },
                                '70%': {
                                    boxShadow: '0 0 0 10px rgba(0, 0, 0, 0)'
                                },
                                '100%': {
                                    boxShadow: '0 0 0 0 rgba(0, 0, 0, 0)'
                                }
                            },
                            animation: isProcessing ? 'pulseGlow 2s infinite' : 'none',
                            transition: 'all .2s ease-in-out',
                            background: theme.palette.secondary.light,
                            color: theme.palette.secondary.dark,
                            '&:hover': {
                                background: theme.palette.secondary.dark,
                                color: theme.palette.secondary.light
                            }
                        }}
                        ref={anchorRef}
                        onClick={handleToggle}
                    >
                        <IconBell stroke={1.5} size="20px" />
                    </Avatar>
                </Badge>
            </Box>

            <Popper placement="bottom-end" open={open} anchorEl={anchorRef.current} transition disablePortal sx={{ zIndex: 1200, width: '420px' }}>
                {({ TransitionProps }) => (
                    <ClickAwayListener onClickAway={handleClose}>
                        <Transitions position="top-right" in={open} {...TransitionProps}>
                            <Paper sx={{ borderRadius: 3, p: 2, width: '100%', maxHeight: '620px', overflow: 'hidden' }}>
                                <MainCard border={false} elevation={16} content={false} boxShadow shadow={theme.shadows[16]}>
                                    {/* Download Section */}
                                    <Grid container direction="column" spacing={2}>
                                        <Grid item xs={12} sx={{ px: 2 }}>
                                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                                <Chip
                                                    label={`Downloads (${downloadBadge})`}
                                                    sx={{ bgcolor: theme.palette.info.main, color: '#fff', fontWeight: 'bold' }}
                                                />
                                                <IconButton onClick={() => setExpandedDownloads(!expandedDownloads)}>
                                                    {expandedDownloads ? <IconChevronUp /> : <IconChevronDown />}
                                                </IconButton>
                                            </Stack>
                                        </Grid>
                                        <Collapse in={expandedDownloads}>
                                            <PerfectScrollbar style={{ maxHeight: '250px', padding: '10px' }}>
                                                {downloadList.map((download) => (
                                                    <Card key={download.id} sx={{ p: 2, mb: 2, borderRadius: 2, boxShadow: 2 }}>
                                                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                                                            <Typography fontWeight="bold">{download.name}</Typography>
                                                        </Stack>
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={download.progress}
                                                            sx={{ mt: 1, height: 6, borderRadius: 5 }}
                                                        />
                                                        <Typography color="textSecondary">
                                                            {`${download.progress ? `${download.progress}%` : formatSizeUnits(download.loaded)} - ${download.status}`}
                                                            {download.completedAt
                                                                ? ` (Completed: ${new Date(download.completedAt).toLocaleString()})`
                                                                : ''}
                                                        </Typography>
                                                    </Card>
                                                ))}
                                            </PerfectScrollbar>
                                        </Collapse>
                                    </Grid>

                                    {/* Archive Section */}
                                    <Grid container direction="column" spacing={2}>
                                        <Grid item xs={12} sx={{ px: 2 }}>
                                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                                <Chip
                                                    label={`Archive States (${sortedArchives.length})`}
                                                    sx={{ bgcolor: theme.palette.primary.main, color: '#fff', fontWeight: 'bold' }}
                                                />
                                                <IconButton onClick={() => setExpandedArchives(!expandedArchives)}>
                                                    {expandedArchives ? <IconChevronUp /> : <IconChevronDown />}
                                                </IconButton>
                                            </Stack>
                                        </Grid>
                                        <Collapse in={expandedArchives}>
                                            <PerfectScrollbar style={{ maxHeight: '250px', padding: '10px' }}>
                                                {sortedArchives.map((archive) => (
                                                    <Link
                                                        href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            if (archive.state === 'completed') {
                                                                const path =
                                                                    archive.type === 'Slack'
                                                                        ? `/archive/${archive.type}/${archive.appId}/backup/${archive.archiveId}?name=${archive.archiveId}`
                                                                        : `/archive/${archive.detailType}/${archive.appId}/backup/${archive.archiveId}?name=${archive.archiveId}`;
                                                                navigate(path);
                                                            }
                                                        }}
                                                        key={archive._id}
                                                        sx={{ textDecoration: 'none' }}
                                                    >
                                                        <Card sx={{ p: 2, mb: 2, borderRadius: 2, boxShadow: 2 }}>
                                                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                                                <Typography fontWeight="bold">
                                                                    {archive.type} {`->`} {archive.filters.jobName}
                                                                </Typography>
                                                            </Stack>
                                                            <LinearProgress
                                                                variant="determinate"
                                                                value={Math.min(100, (archive.processedCount / archive.totalCount) * 100)}
                                                                sx={{ mt: 1, height: 6, borderRadius: 5 }}
                                                            />
                                                            <Typography color="textSecondary">{`${archive.processedCount}/${archive.totalCount} - ${archive.state}`}</Typography>
                                                        </Card>
                                                    </Link>
                                                ))}
                                            </PerfectScrollbar>
                                        </Collapse>
                                    </Grid>
                                </MainCard>
                            </Paper>
                        </Transitions>
                    </ClickAwayListener>
                )}
            </Popper>
        </>
    );
};

export default NotificationSection;