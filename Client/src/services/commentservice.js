import api from "./api";

export const addComment = async (data) => {
    const response = await api.post(
        "/addcomment",
        data
    );

    return response.data;
};

export const addcommentonProject = async (data) => {
    const response = await api.post(
        "/addcomment/project",
        data
    );

    return response.data;
};