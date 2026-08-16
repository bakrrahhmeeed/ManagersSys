import api from "./api";

export const getTasks = async () => {
    const response = await api.get("/tasks");
    return response.data;
};

export const createTask = async (taskData) => {
    const response = await api.post("/tasks", taskData);

    return response.data;
};

export const getTask = async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
};

export const updateTask = async (taskId, taskData) => {
    const response = await api.put(`/tasks/${taskId}`, taskData);

    return response.data;
};

export const getUsersByDepartment = async (departmentId) => {
    const response = await api.get(
        `/users/department/${departmentId}`
    );

    return response.data;
};

export const updateTaskEmployee = async (taskId, taskData) => {
    const response = await api.put(
        `/tasks/employee/${taskId}`,
        taskData
    );

    return response.data;
};