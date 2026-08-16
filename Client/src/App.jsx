import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import ProtectedRoute from "./components/ProtectedRoute";
import Tasks from "./pages/Tasks";
import Users from "./pages/Users";
import AddTask from "./pages/AddTask";
import TaskDetails from "./pages/TaskDetails";
import EditTask from "./pages/EditTask";
import CreateUser from "./pages/createUser";
import UpdateUser from "./pages/Updateuser";
import UserDetails from "./pages/UserDetails";
import EditTaskEmb from "./pages/EditTaskEmb";


function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/dashboard" element={ <ProtectedRoute> <Dashboard /> </ProtectedRoute>} />

        <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />

        <Route path="/projects/:projectId" element={<ProjectDetails />} />

        <Route path="/tasks" element={<Tasks />} />

        <Route path="/users" element={<Users />} />

        <Route path="/users/create" element={<CreateUser />} />

        <Route path="/users/:id" element={<UserDetails />} />

        <Route path="/users/:id/edit" element={<UpdateUser />} />

        <Route path="/tasks/add" element={<AddTask />} />

        <Route path="/tasks/:id" element={<TaskDetails />} />

        <Route path="/tasks/:taskId/edit" element={<EditTask />} />

        <Route path="/tasks/:taskId/edit-employee" element={<EditTaskEmb />}/>




      </Routes>
    </BrowserRouter>
  );
}

export default App;