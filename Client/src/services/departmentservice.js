import api from "./api";

export const getDepartments = async () => {
    const response = await api.get("/departments");
    return response.data;
};

export const getDepartmentsByProject = async (projectId) => {
    const response = await api.get(
        `/departments/project/${projectId}`
    );
    return response.data;
};