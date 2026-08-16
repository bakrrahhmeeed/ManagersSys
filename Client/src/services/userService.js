import api from "./api";

export const getUsers = async () => {
    const response = await api.get("/users");

    return response.data?.users || [];
};


export const getUserById = async (id) => {
    const response = await api.get(
        `/users/${id}`
    );

    return response.data;
};


export const createUser = async (data) => {
    const response = await api.post(
        "/users",
        data
    );

    return response.data;
};


export const updateUser = async (id, data) => {
    const response = await api.put(
        `/users/${id}`,
        data
    );

    return response.data;
};


export const deleteUser = async (id) => {
    const response = await api.delete(
        `/users/deletuser/${id}`
    );

    return response.data;
};


export const updatePassword = async (
    id,
    password,
    oldPassword
) => {
    const response = await api.put(
        `/users/pass/${id}`,
        {
            password,
            oldPassword,
        }
    );

    return response.data;
};


export const getProjectManagers = async () => {
    const response = await api.get(
        "/users/projectmanagers"
    );

    return response.data || [];
};


export const getUsersByDepartment = async (
    departmentId
) => {
    const response = await api.get(
        `/users/department/${departmentId}`
    );

    return response.data || [];
};

export const getUserOptions = async () => {
    const response = await api.get("/users/options");

    return response.data;
};
