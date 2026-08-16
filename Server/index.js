const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database").connectDB;
const authMiddleware = require("./middleware/authMiddleware");
const erorrMMiddleware = require("./middleware/erorrMiddleware");



const app = express();

const PORT = process.env.PORT || 3001 ;

const userRoutes = require("./routes/userRoutes")
const authRoute = require("./routes/authRoute")
const projectRoute = require("./routes/projectRoute")
const projectDetailRoute = require("./routes/projectDetailRoute")
const stageRoute = require("./routes/stageRoute")
const tasksRoute = require("./routes/TasksRoute")
const objectivesRoute = require("./routes/ObjectivesRoute")
const issuesRoute = require("./routes/issuesRoute")
const risksRoute = require("./routes/RisksRoute")
const dashboard = require("./routes/dashboardRoute")
const departments = require("./routes/DepartmentRoute")




connectDB();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());

app.use("/api",authRoute)




app.use(authMiddleware)
app.use("/api/users",  userRoutes);
app.use("/api/projects" ,  projectRoute)
app.use("/api",projectDetailRoute)
app.use("/api/stages", stageRoute);
app.use("/api/tasks",tasksRoute);
app.use("/api/objectives",objectivesRoute);
app.use("/api/issues", issuesRoute);
app.use("/api/risks", risksRoute);
app.use("/api/dashboard", dashboard)
app.use("/api/departments" , departments)



app.use(erorrMMiddleware);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});