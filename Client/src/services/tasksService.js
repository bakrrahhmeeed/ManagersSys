import api from "./api";

export const getTasks = async () => {
  const response = await api.get("/tasks");

  return response.data;
};