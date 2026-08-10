import { Link, useLocation , useNavigate } from "react-router-dom";
import { FaHome, FaFolderOpen, FaUsers, FaTasks , FaSignOutAlt } from "react-icons/fa";
import "../styles/Sidebar.css";

import { useContext } from "react";

import { AuthContext } from "../context/AuthContext";




const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user , logout} = useContext(AuthContext);

  const handleLogout = () => {
  logout();
  navigate("/");
};

  const menuItems = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: <FaHome />,
  },
  {
    title: "Projects",
    path: "/projects",
    icon: <FaFolderOpen />,
  },
  {
    title: "Tasks",
    path: "/tasks",
    icon: <FaTasks />,
  },
];

if (user?.roleName === "Administrator") {
  menuItems.splice(2, 0, {
    title: "Users",
    path: "/users",
    icon: <FaUsers />,
  });
}



  return (
    <aside className="sidebar">

      <div className="sidebar-logo">
        <h2>RAYA</h2>
        <h4>{user?.fullName}</h4>
        <h5>{user?.roleName}</h5>
      </div>

     <nav className="sidebar-menu">
  {menuItems.map((item) => (
    <Link
      key={item.path}
      to={item.path}
      className={location.pathname === item.path ? "active" : ""}
    >
      {item.icon}
      <span>{item.title}</span>
    </Link>
  ))}
</nav>

<div className="sidebar-footer">
  <button
    className="logout-btn"
    onClick={handleLogout}
  >
    <FaSignOutAlt />
    <span>Logout</span>
  </button>
</div>

    </aside>
  );
};

export default Sidebar;