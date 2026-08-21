import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaFolderOpen,
  FaUsers,
  FaTasks,
  FaSignOutAlt,
  FaPlus,
  FaLayerGroup
} from "react-icons/fa";

import "../styles/Sidebar.css";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const role = String(
    user?.roleName || ""
  ).toLowerCase();

  const canCreateProject =
    role === "administrator" ||
    role === "secretary";

  const canViewStages =
    role === "administrator" ||
    role === "pmo manager" ||
    role === "project manager" ||
    role === "department manager";

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
      children: [
        {
          title: "All",
          path: "/projects",
        },

        ...(canCreateProject
          ? [
              {
                title: "New Project",
                path: "/projects/add",
                icon: <FaPlus />,
              },
            ]
          : []),
      ],
    },

    ...(canViewStages
      ? [
          {
            title: "Stages",
            path: "/stages",
            icon: <FaLayerGroup />,
          },
        ]
      : []),

    {
      title: "Tasks",
      path: "/tasks",
      icon: <FaTasks />,
    },
  ];

 if (role === "administrator") {
  menuItems.push({
    title: "Users",
    path: "/users",
    icon: <FaUsers />,
  });
}

  return (
    <aside className="sidebar">

      <nav className="sidebar-menu">

        {menuItems.map((item) => {

          const isProjects =
            item.title === "Projects";

          const isActive =
            location.pathname === item.path ||
            location.pathname.startsWith(
              `${item.path}/`
            );

          return (
            <div
              key={item.path}
              className="sidebar-item-wrapper"
            >

              <Link
                to={item.path}
                className={
                  isActive
                    ? "active"
                    : ""
                }
              >
                {item.icon}
                <span>{item.title}</span>
              </Link>

              {isProjects &&
                isActive &&
                item.children && (

                  <div className="sidebar-submenu">

                    {item.children.map(
                      (child) => (

                        <Link
                          key={child.path}
                          to={child.path}
                          className={
                            location.pathname ===
                            child.path
                              ? "submenu-active"
                              : ""
                          }
                        >

                          {child.icon &&
                            child.icon}

                          <span>
                            {child.title}
                          </span>

                        </Link>

                      )
                    )}

                  </div>

                )}

            </div>
          );

        })}

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