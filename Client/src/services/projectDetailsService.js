import axios from "axios";

export const getProjectDetails = async (projectId) => {
    const response = await axios.get(
        `http://localhost:3001/api/project/${projectId}/details`
    );

    return response.data;
};