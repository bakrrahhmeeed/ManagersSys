import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "../styles/DashboardLayout.css";

const DashboardLayout = ({ children }) => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <Header />

      <main className="dashboard-main">
        <div className="dashboard-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
