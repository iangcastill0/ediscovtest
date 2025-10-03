import axiosServices from "./axios";

const getUsers = async () => {
    const response = await axiosServices.get(`/admin/users`);
    return response.data;
}

const addUser = async (data) => {
    return await axiosServices.post(`/admin/users/add`, data);
}

const deleteUsers = async () => {
    const response = await axiosServices.delete(`/admin/users/delete`);
    return response.data;
}

const getUserActions = async () => {
    const response = await axiosServices.get(`/admin/users/actions`);
    return response.data;
}

const suspendUser = async (email) => {
    const response = await axiosServices.post(`/admin/users/suspend`, {email});
    return response.data;
}

const unSuspendUser = async (email) => {
    const response = await axiosServices.post(`/admin/users/un-suspend`, {email});
    return response.data;
}

const getSubscriptionPlans = async () => {
    const response = await axiosServices.get(`/admin/financial/plans`);
    
    return response.data;
}

const createSubscriptionPlan = async (title, description, price, workspaceCount, storageSpace) => {
    const response = await axiosServices.post(`/admin/financial/plan`, {title, description, price, workspaceCount, storageSpace});
    
    return response.data;
}

const deleteSubscriptionPlan = async (id) => {
    const response = await axiosServices.delete(`/admin/financial/plan/${id}`);
    
    return response.data;
}

const getPaymentHistory = async () => {
    const response = await axiosServices.get(`/admin/financial/history`);
    
    return response.data.histories;
}

const getStatistics = async () => {
    const response = await axiosServices.get(`/admin/statistics`);
    
    return response.data;
}

export {
    getUsers,
    getUserActions,
    suspendUser,
    unSuspendUser,
    getSubscriptionPlans,
    createSubscriptionPlan,
    deleteSubscriptionPlan,
    getPaymentHistory,
    getStatistics,
    addUser,
    deleteUsers
}