import { useContext } from "react";
import { NavLink } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";

import {
  FaBell,
  FaFolder,
  FaUsers,
  FaListCheck,
  FaCalendarDays,
} from "react-icons/fa6";

import "../styles/Header.css";

const Header = () => {
  const { user } = useContext(AuthContext);

  return (
    <header className="header">

      {/* =====================================================
          LEFT SIDE
      ===================================================== */}

      <div className="header-left">

        {/* LOGO */}

        <div className="header-logo">
          RAYA
        </div>


        {/* NAVIGATION */}

        <nav className="header-nav">

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `header-nav-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <FaCalendarDays />

            <span>
              Dashboard
            </span>
          </NavLink>


          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `header-nav-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <FaFolder />

            <span>
              Projects
            </span>
          </NavLink>


          <NavLink
            to="/users"
            className={({ isActive }) =>
              `header-nav-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <FaUsers />

            <span>
              Users
            </span>
          </NavLink>


          <NavLink
            to="/tasks"
            className={({ isActive }) =>
              `header-nav-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <FaListCheck />

            <span>
              Tasks
            </span>
          </NavLink>

        </nav>

      </div>


      {/* =====================================================
          RIGHT SIDE
      ===================================================== */}

      <div className="header-right">

        {/* NOTIFICATION */}

        <button
          type="button"
          className="notification-btn"
          aria-label="Notifications"
        >

          <FaBell />

          <span className="notification-badge">
            3
          </span>

        </button>


        {/* USER */}

        <div className="header-user">

          <div className="user-avatar">
            {user?.fullName
              ? user.fullName
                  .charAt(0)
                  .toUpperCase()
              : "A"}
          </div>


          <div className="user-info">

            <h4>
              {user?.fullName ||
                "Abo Bakr Ahmed Hussein"}
            </h4>

            <span>
              {user?.roleName ||
                "Administrator"}
            </span>

          </div>


          <span className="user-arrow">
            ˅
          </span>

        </div>

      </div>

    </header>
  );
};

export default Header;