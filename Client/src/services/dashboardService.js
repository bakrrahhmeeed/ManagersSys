import api from "./api";

export const getDashboardSummary = async () => {
    const response = await api.get("/dashboard/summary");
    return response.data;
};

export const getDashboardProgress = async () => {
    const response = await api.get("/dashboard/getprogress");
    return response.data;
};

export const getDashboardTaskStatus = async () => {
    const response = await api.get("/dashboard/task-status");
    return response.data;
};

export const getDashboardUpcomingDeadlines = async () => {
    const response = await api.get("/dashboard/upcoming-deadlines");
    return response.data;
};

export const getDashboardTaskPriority = async () => {
    const response = await api.get("/dashboard/task-priority");
    return response.data;
};