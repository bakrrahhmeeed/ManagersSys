import api from "./api";

export const getStagesByProject = async (projectId) => {
    const response = await api.get(
        `/stages/project/${projectId}`
    );

    return response.data;
};