import { FaBell } from "react-icons/fa";
import "../styles/Header.css";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import alRayaLogo from "../assets/al raya logo.jpeg";

const Header = () => {
  const { user } = useContext(AuthContext);

  const fullName = user?.fullName || "User";
  const role = user?.roleName || "User";

  const initial = fullName.charAt(0).toUpperCase();

  const handleNotifications = () => {
    console.log("Notifications clicked");
  };

  return (
    <header className="header">
      <div className="header-left">
        <img

          src={alRayaLogo}

          alt="Al Raya"

          className="header-logo"

        />
      </div>

      <div className="header-right">
        <button
          type="button"
          className="notification-btn"
          onClick={handleNotifications}
          title="Notifications"
        >
          <FaBell />
          <span className="notification-badge">0</span>
        </button>

        <div className="header-user">
          <div className="header-user-avatar">
            {initial}
          </div>

          <div className="header-user-info">
            <span className="header-user-name">
              {fullName}
            </span>

            <span className="header-user-role">
              {role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;