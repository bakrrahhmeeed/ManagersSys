import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import { getUsers } from "../services/userService";

import "../styles/Users.css";

function Users() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getUsers();

      setUsers(data);
    } catch (err) {
      console.error("Users error:", err);
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        String(user.UserID).includes(query) ||
        String(user.FullName || "")
          .toLowerCase()
          .includes(query) ||
        String(user.UserName || "")
          .toLowerCase()
          .includes(query) ||
        String(user.Email || "")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && user.IsActive) ||
        (statusFilter === "Inactive" && !user.IsActive);

      return matchesSearch && matchesStatus;
    });
  }, [users, search, statusFilter]);

  const getInitials = (name) => {
    if (!name) return "?";

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="users-loading">
          <div className="users-spinner"></div>
          <p>Loading users...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="users-error">
          <h2>Users</h2>
          <p>{error}</p>

          <button onClick={loadUsers}>
            Try Again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="users-page">

        {/* HEADER */}
        <div className="users-page-header">

          <div>
            <h1>Users</h1>
            <p>Manage and view system users</p>
          </div>

          <button
            className="add-user-btn"
            onClick={() => {
              // هنربطه بعدين بالـ Add User
            }}
          >
            <span>+</span>
            Add User
          </button>

        </div>


        {/* FILTER BAR */}
        <div className="users-toolbar">

          <div className="users-search">

            <span>⌕</span>

            <input
              type="text"
              placeholder="Search by name, username, email or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {search && (
              <button
                onClick={() => setSearch("")}
              >
                ×
              </button>
            )}

          </div>


          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

        </div>


        {/* USERS TABLE */}
        <section className="users-panel">

          <div className="users-panel-header">

            <div>
              <h2>System Users</h2>

              <span>
                {filteredUsers.length} user
                {filteredUsers.length === 1 ? "" : "s"}
              </span>
            </div>

          </div>


          {filteredUsers.length === 0 ? (

            <div className="users-empty">
              <strong>No users found</strong>
              <span>
                Try changing your search or filter.
              </span>
            </div>

          ) : (

            <div className="users-table-wrapper">

              <table className="users-table">

                <thead>
                  <tr>
                    <th>User</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Branch</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredUsers.map((user) => (

                    <tr key={user.UserID}>

                      {/* USER */}
                      <td>

                        <div className="user-cell">

                          <div className="user-avatar">
                            {getInitials(user.FullName)}
                          </div>

                          <div className="user-info">

                            <strong>
                              {user.FullName || "-"}
                            </strong>

                            <span>
                              #{user.UserID}
                            </span>

                          </div>

                        </div>

                      </td>


                      {/* USERNAME */}
                      <td>
                        <span className="username-cell">
                          {user.UserName || "-"}
                        </span>
                      </td>


                      {/* EMAIL */}
                      <td>
                        <span className="email-cell">
                          {user.Email || "-"}
                        </span>
                      </td>


                      {/* DEPARTMENT */}
                      <td>
                        <span className="id-badge">
                          {user.DepartmentName ?? "-"}
                        </span>
                      </td>


                      {/* BRANCH */}
                      <td>
                        <span className="id-badge">
                          {user.BranchName ?? "-"}
                        </span>
                      </td>


                      {/* STATUS */}
                      <td>

                        <span
                          className={`user-status ${
                            user.IsActive
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          <i></i>

                          {user.IsActive
                            ? "Active"
                            : "Inactive"}
                        </span>

                      </td>


                      {/* ACTION */}
                      <td>

                        <button
                          className="user-view-btn"
                          onClick={() =>
                            navigate(
                              `/users/${user.UserID}`
                            )
                          }
                        >
                          View
                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </div>
    </DashboardLayout>
  );
}

export default Users;