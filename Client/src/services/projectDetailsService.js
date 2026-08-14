import api from "./api";

export const getProjectDetails = async (projectId) => {
    const response = await api.get(
        `/project/${projectId}/details`
    );

    return response.data;
};

export const updateProject = async (id, data) => {
    const response = await api.put(
        `/projects/${id}`,
        data
    );

    return response.data;
};