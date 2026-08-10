import Header from "../components/Header";

const DashboardLayout = ({ children }) => {
  return (
    <div className="dashboard-layout">

      <Header />

      <main className="dashboard-main">
        {children}
      </main>

    </div>
  );
};

export default DashboardLayout;
