import api from "./api";

export const getStagesByProject = async (projectId) => {
    const response = await api.get(
        `/stages/project/${projectId}`
    );

    return response.data;
};

export const getProjectsWithStages = async () => {
    const response = await api.get(
        "/stages/projectwithstages"
    );

    return response.data;
};

export const getDepartmentManagers = async (departmentId) => {
    const response = await api.get(
        `/stages/departmentmanagers/${departmentId}`
    );

    return response.data || [];
};

export const createStage = async (data) => {
    const response = await api.post(
        "/stages",
        data
    );

    return response.data;
};

export const updateStage = async (id, data) => {

    const response = await api.put(
        `/stages/${id}`,
        data
    );
    return response.data;
};