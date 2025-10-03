import React, { useState, useEffect } from 'react';
import { Box, Button, Modal, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Select, MenuItem, FormControlLabel, Radio, RadioGroup, Typography, Divider, LinearProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSlack, faGoogle, faMicrosoft, faDropbox } from '@fortawesome/free-brands-svg-icons';
import axios from 'utils/axios';

const InviteUsers = () => {
    const [users, setUsers] = useState([]);
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');  // Error state for email
    const [globalPermissions, setGlobalPermissions] = useState('Read');
    const [workspacePermissions, setWorkspacePermissions] = useState({
        slack: [],
        google: [],
        ms365: [],
        dropbox: []
    });
    const [isEditMode, setIsEditMode] = useState(false);
    const [permissionType, setPermissionType] = useState('global'); // 'global' or 'workspace'
    const [loading, setLoading] = useState(false);
    const [workspaces, setWorkspaces] = useState({
        slack: [],
        google: [],
        ms365: [],
        dropbox: []
    });
    const [confirmationOpen, setConfirmationOpen] = useState(false); // Confirmation dialog state
    const [userToRemove, setUserToRemove] = useState(null); // Store user to remove

    useEffect(() => {
        const fetchWorkspacesAndUsers = async () => {
            setLoading(true);
            try {
                const slackResponse = await axios.get('/slack/teams?includeInvites=false');
                const msResponse = await axios.get('/ms365/workspaces?includeInvites=false');
                const googleResponse = await axios.get('/google/workspaces?includeInvites=false');
                const dropboxResponse = await axios.get('/dropbox/workspaces?includeInvites=false');
                setWorkspaces({
                    slack: slackResponse.data.data.map(team => ({ id: team._id, name: team.name })),
                    google: googleResponse.data.data.map(ws => ({ id: ws.workspace._id, name: ws.workspace.displayName })),
                    ms365: msResponse.data.data.map(ws => ({ id: ws.workspace._id, name: ws.workspace.displayName })),
                    dropbox: dropboxResponse.data.data.map(ws => ({ id: ws.workspace._id, name: ws.workspace.displayName }))
                });
    
                const invitedUsersResponse = await axios.get('/invite/users');
                setUsers(invitedUsersResponse.data.inviteUsers);
            } catch (error) {
                console.error("Error fetching workspaces or users: ", error);
            }
            setLoading(false);
        };
        fetchWorkspacesAndUsers();
    }, []);

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    const handleInvite = async () => {
        if (!validateEmail(email)) {
            setEmailError('Invalid email format');
            return;
        }
        setEmailError('');

        const inviteData = {
            invitedUser: email,
            globalPermission: permissionType === 'global' ? globalPermissions : '',
            workspacePermissions: permissionType === 'global' ? {slack:[], google: [], ms365: [], dropbox: []} : workspacePermissions,
            permissionType
        };

        if (isEditMode) {
            await axios.post('/invite/update', inviteData);
        } else {
            await axios.post('/invite/send', inviteData);
        }

        const updatedUsers = await axios.get('/invite/users');
        setUsers(updatedUsers.data.inviteUsers);
        resetForm();
    };

    const resetForm = () => {
        setOpen(false);
        setEmail('');
        setEmailError('');
        setGlobalPermissions('Read');
        setWorkspacePermissions({
            slack: [],
            google: [],
            ms365: [],
            dropbox: []
        });
        setIsEditMode(false);
        setPermissionType('global');
    };

    const handleWorkspacePermissionChange = (workspaceKey, workspaceId, permission) => {
        setWorkspacePermissions(prevPermissions => {
            // Find if the workspace permission already exists
            const existingPermissionIndex = prevPermissions[workspaceKey].findIndex(wp => wp.id === workspaceId);
            
            // If the permission already exists, update it
            if (existingPermissionIndex >= 0) {
                return {
                    ...prevPermissions,
                    [workspaceKey]: prevPermissions[workspaceKey].map(wp =>
                        wp.id === workspaceId ? { ...wp, permission } : wp
                    )
                };
            } 
            
            // Otherwise, add a new permission entry
            return {
                ...prevPermissions,
                [workspaceKey]: [
                    ...prevPermissions[workspaceKey],
                    { id: workspaceId, permission }
                ]
            };
        });
    };
    

    const handleEdit = (user) => {
        setEmail(user.invitedUser);
        if (user.permissionType === 'global') {
            setPermissionType('global');
            setGlobalPermissions(user.globalPermission);
        } else {
            setPermissionType('workspace');
            setWorkspacePermissions(user.workspacePermissions);
        }
        setIsEditMode(true);
        setOpen(true);
    };

    const handleRemoveConfirmation = (user) => {
        setUserToRemove(user);
        setConfirmationOpen(true);
    };

    const handleConfirmRemove = async () => {
        try {
            await axios.post('/invite/remove', { invitedUser: userToRemove.invitedUser });
            const updatedUsers = await axios.get('/invite/users');
            setUsers(updatedUsers.data.inviteUsers);
            setConfirmationOpen(false);
        } catch (error) {
            console.error("Error removing user: ", error);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <Button variant="contained" onClick={() => { resetForm(); setOpen(true); }}>
                Invite User
            </Button>

            <TableContainer component={Paper} sx={{ mt: 3 }}>
                {loading && <LinearProgress />}
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>User Email</TableCell>
                            <TableCell>Global Permissions</TableCell>
                            <TableCell>Workspace Permissions</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user, index) => (
                            <TableRow key={index}>
                                <TableCell>{user.invitedUser}</TableCell>
                                <TableCell>{user.globalPermission}</TableCell>
                                <TableCell>
                                    {Object.keys(user.workspacePermissions).map((workspaceKey) => (
                                        user.workspacePermissions[workspaceKey].map(wp => (
                                            <div key={wp.id}>
                                                {workspaceKey.charAt(0).toUpperCase() + workspaceKey.slice(1)}: {wp.permission}
                                            </div>
                                        ))
                                    ))}
                                </TableCell>
                                <TableCell>{user.status}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleEdit(user)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleRemoveConfirmation(user)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Modal for inviting or editing a user */}
            <Modal open={open} onClose={() => setOpen(false)}>
                <Box sx={{
                    p: 4,
                    backgroundColor: 'white',
                    margin: 'auto',
                    width: '500px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    position: 'relative',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    paddingBottom: '20px'
                }}>
                    <Typography variant="h5" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
                        {isEditMode ? 'Update User' : 'Invite User'}
                    </Typography>

                    <TextField
                        fullWidth
                        label="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={!!emailError}
                        helperText={emailError}
                        disabled={isEditMode}
                        sx={{ mb: 2 }}
                    />

                    <Typography variant="h6" sx={{ mt: 2 }}>
                        Select Permission Type
                    </Typography>
                    <RadioGroup
                        row
                        value={permissionType}
                        onChange={(e) => setPermissionType(e.target.value)}
                        sx={{ justifyContent: 'center', mb: 3 }}
                    >
                        <FormControlLabel value="global" control={<Radio />} label="Global Permissions" />
                        <FormControlLabel value="workspace" control={<Radio />} label="Workspace Permissions" />
                    </RadioGroup>

                    {permissionType === 'global' && (
                        <>
                            <Typography variant="h6">Global Permissions</Typography>
                            <Select
                                fullWidth
                                value={globalPermissions}
                                onChange={(e) => setGlobalPermissions(e.target.value)}
                                sx={{ mb: 3 }}
                            >
                                <MenuItem value="Read">Read</MenuItem>
                                <MenuItem value="Write">Write</MenuItem>
                            </Select>
                        </>
                    )}

                    {permissionType === 'workspace' && (
                        <>
                            {workspaces.slack.length > 0 && (
                                <>
                                    <Typography variant="h6" sx={{ mb: 1 }}>
                                        Slack Workspaces
                                    </Typography>
                                    {workspaces.slack.map((workspace) => (
                                        <Box key={workspace.id} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <FontAwesomeIcon icon={faSlack} style={{ marginRight: '8px' }} />
                                            <Typography variant="body1" sx={{ flexGrow: 1 }}>{workspace.name}</Typography>
                                            <Select
                                                value={workspacePermissions.slack.find(wp => wp.id === workspace.id)?.permission || 'None'}
                                                onChange={(e) => handleWorkspacePermissionChange('slack', workspace.id, e.target.value)}
                                                sx={{ minWidth: '120px' }}
                                            >
                                                <MenuItem value="None">None</MenuItem>
                                                <MenuItem value="Read">Read</MenuItem>
                                                <MenuItem value="Write">Write</MenuItem>
                                            </Select>
                                        </Box>
                                    ))}
                                    <Divider sx={{ mb: 2 }} />
                                </>
                            )}

                            {workspaces.google.length > 0 && (
                                <>
                                    <Typography variant="h6" sx={{ mb: 1 }}>
                                        Google Workspaces
                                    </Typography>
                                    {workspaces.google.map((workspace) => (
                                        <Box key={workspace.id} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <FontAwesomeIcon icon={faGoogle} style={{ marginRight: '8px' }} />
                                            <Typography variant="body1" sx={{ flexGrow: 1 }}>{workspace.name}</Typography>
                                            <Select
                                                value={workspacePermissions.google.find(wp => wp.id === workspace.id)?.permission || 'None'}
                                                onChange={(e) => handleWorkspacePermissionChange('google', workspace.id, e.target.value)}
                                                sx={{ minWidth: '120px' }}
                                            >
                                                <MenuItem value="None">None</MenuItem>
                                                <MenuItem value="Read">Read</MenuItem>
                                                <MenuItem value="Write">Write</MenuItem>
                                            </Select>
                                        </Box>
                                    ))}
                                    <Divider sx={{ mb: 2 }} />
                                </>
                            )}

                            {workspaces.ms365.length > 0 && (
                                <>
                                    <Typography variant="h6" sx={{ mb: 1 }}>
                                        Microsoft Workspaces
                                    </Typography>
                                    {workspaces.ms365.map((workspace) => (
                                        <Box key={workspace.id} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <FontAwesomeIcon icon={faMicrosoft} style={{ marginRight: '8px' }} />
                                            <Typography variant="body1" sx={{ flexGrow: 1 }}>{workspace.name}</Typography>
                                            <Select
                                                value={workspacePermissions.ms365.find(wp => wp.id === workspace.id)?.permission || 'None'}
                                                onChange={(e) => handleWorkspacePermissionChange('ms365', workspace.id, e.target.value)}
                                                sx={{ minWidth: '120px' }}
                                            >
                                                <MenuItem value="None">None</MenuItem>
                                                <MenuItem value="Read">Read</MenuItem>
                                                <MenuItem value="Write">Write</MenuItem>
                                            </Select>
                                        </Box>
                                    ))}
                                    <Divider sx={{ mb: 2 }} />
                                </>
                            )}

                            {workspaces.dropbox.length > 0 && (
                                <>
                                    <Typography variant="h6" sx={{ mb: 1 }}>
                                        Dropbox Workspaces
                                    </Typography>
                                    {workspaces.dropbox.map((workspace) => (
                                        <Box key={workspace.id} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <FontAwesomeIcon icon={faDropbox} style={{ marginRight: '8px' }} />
                                            <Typography variant="body1" sx={{ flexGrow: 1 }}>{workspace.name}</Typography>
                                            <Select
                                                value={workspacePermissions.dropbox.find(wp => wp.id === workspace.id)?.permission || 'None'}
                                                onChange={(e) => handleWorkspacePermissionChange('dropbox', workspace.id, e.target.value)}
                                                sx={{ minWidth: '120px' }}
                                            >
                                                <MenuItem value="None">None</MenuItem>
                                                <MenuItem value="Read">Read</MenuItem>
                                                <MenuItem value="Write">Write</MenuItem>
                                            </Select>
                                        </Box>
                                    ))}
                                    <Divider sx={{ mb: 2 }} />
                                </>
                            )}
                        </>
                    )}


                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                        <Button onClick={() => resetForm()} sx={{ mr: 1 }} variant="outlined">
                            Cancel
                        </Button>
                        <Button variant="contained" color="primary" onClick={handleInvite}>
                            {isEditMode ? 'Update' : 'Invite'}
                        </Button>
                    </Box>
                </Box>
            </Modal>

            {/* Confirmation Dialog for Removing a User */}
            <Dialog
                open={confirmationOpen}
                onClose={() => setConfirmationOpen(false)}
            >
                <DialogTitle>Remove User</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to remove this user from the invitation list?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmationOpen(false)} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmRemove} color="secondary" variant="contained">
                        Remove
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default InviteUsers;
 