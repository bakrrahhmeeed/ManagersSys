import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaPlus,
    FaSearch,
    FaTimes,
    FaEdit,
    FaTrash,
    FaEye,
    FaSyncAlt,
    FaUsers,
    FaBuilding,
    FaCodeBranch,
} from "react-icons/fa";

import DashboardLayout from "../layouts/DashboardLayout";
import { getUsers, deleteUser } from "../services/userService";

import "../styles/Users.css";

function Users() {
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState(null);

        const getCurrentUserRole = () => {
        try {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                const user = JSON.parse(storedUser);
                const storedRole = user.roleName || "";
                if (storedRole) return storedRole;
            }

            const token = localStorage.getItem("token");
            if (!token) return "";

            const tokenPart = token.split(".")[1];
            if (!tokenPart) return "";

            const base64 = tokenPart
                .replace(/-/g, "+")
                .replace(/_/g, "/")
                .padEnd(Math.ceil(tokenPart.length / 4) * 4, "=");

            const payload = JSON.parse(atob(base64));

            return payload.roleName || "";
        } catch {
            return "";
        }
    };

        const currentUserRole = getCurrentUserRole();
    const canAddUser = [
        "administrator",
    ].includes(String(currentUserRole).trim().toLowerCase());

    const canEditUser =[
        "administrator",
    ].includes(String(currentUserRole).trim().toLowerCase());

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getUsers();

            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Users error:", err);

            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to load users."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();

        return users.filter((user) => {
            const matchesSearch =
                !query ||
                String(user.UserID || "").includes(query) ||
                String(user.FullName || "")
                    .toLowerCase()
                    .includes(query) ||
                String(user.UserName || "")
                    .toLowerCase()
                    .includes(query) ||
                String(user.Email || "")
                    .toLowerCase()
                    .includes(query) ||
                String(user.DepartmentName || "")
                    .toLowerCase()
                    .includes(query) ||
                String(user.BranchName || "")
                    .toLowerCase()
                    .includes(query);

            const matchesStatus =
                statusFilter === "All" ||
                (statusFilter === "Active" && Boolean(user.IsActive)) ||
                (statusFilter === "Inactive" && !Boolean(user.IsActive));

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

    const handleDelete = async (user) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${user.FullName}"?`
        );

        if (!confirmed) return;

        try {
            setDeletingId(user.UserID);

            await deleteUser(user.UserID);

            setUsers((prev) =>
                prev.filter(
                    (item) => item.UserID !== user.UserID
                )
            );
        } catch (err) {
            console.error("Delete user error:", err);

            alert(
                err.response?.data?.message ||
                err.message ||
                "Failed to delete user."
            );
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="users-loading">
                    <div className="users-spinner" />
                    <p>Loading users...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="users-error">
                    <FaUsers className="users-error-icon" />

                    <h2>Users</h2>

                    <p>{error}</p>

                    <button onClick={loadUsers}>
                        <FaSyncAlt />
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

                        <p>
                            Manage and view system users
                        </p>
                    </div>
{canAddUser&&(
                    <button
                        className="add-user-btn"
                        onClick={() => navigate("/users/create")}
                    >
                        <FaPlus />
                        Add User
                    </button>)}
                </div>


                <div className="users-toolbar">

                    <div className="users-search">
                        <FaSearch />

                        <input
                            type="text"
                            placeholder="Search by name, username, email or ID..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                        />

                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                            >
                                <FaTimes />
                            </button>
                        )}
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value)
                        }
                    >
                        <option value="All">
                            All Status
                        </option>

                        <option value="Active">
                            Active
                        </option>

                        <option value="Inactive">
                            Inactive
                        </option>
                    </select>

                    <button
                        className="users-refresh-btn"
                        onClick={loadUsers}
                        title="Refresh"
                    >
                        <FaSyncAlt />
                    </button>

                </div>

             
                <section className="users-panel">

              
                    <div className="users-panel-header">

                        <div>
                            <h2>System Users</h2>

                            <span>
                                {filteredUsers.length} user
                                {filteredUsers.length === 1
                                    ? ""
                                    : "s"}
                            </span>
                        </div>

                    </div>

  
                    {filteredUsers.length === 0 ? (
                        <div className="users-empty">

                            <FaUsers />

                            <strong>
                                No users found
                            </strong>

                            <span>
                                Try changing your search or filter.
                            </span>

                        </div>
                    ) : (

         
                        <div className="users-cards">

                            {filteredUsers.map((user) => (

                                <article
                                    className="user-card"
                                    key={user.UserID}
                                >


                                    <div className="user-card-top">

                                        <div className="user-card-avatar">
                                            {getInitials(
                                                user.FullName
                                            )}
                                        </div>

                                        <div className="user-card-actions">

                                            <button
                                                className="user-action view"
                                                onClick={() =>
                                                    navigate(
                                                        `/users/${user.UserID}`
                                                    )
                                                }
                                                title="View"
                                            >
                                                <FaEye />
                                            </button>

                                           {canEditUser&&( <button
                                                className="user-action edit"
                                                onClick={() =>
                                                    navigate(
                                                        `/users/${user.UserID}/edit`
                                                    )
                                                }
                                                title="Edit"
                                            >
                                                <FaEdit />
                                            </button>)}

                                        {canEditUser&&(    <button
                                                className="user-action delete"
                                                onClick={() =>
                                                    handleDelete(user)
                                                }
                                                disabled={
                                                    deletingId ===
                                                    user.UserID
                                                }
                                                title="Delete"
                                            >
                                                <FaTrash />
                                            </button>)}

                                        </div>

                                    </div>

                                    <div className="user-card-name">

                                        <h3>
                                            {user.FullName || "-"}
                                        </h3>

                                        <span>
                                            ID: {user.UserID}
                                        </span>

                                    </div>

                                 
                                    <div className="user-card-username">
                                        @{user.UserName || "-"}
                                    </div>

                                    {/* INFO */}
                                    <div className="user-card-info">

                                        <div className="user-info-row">

                                            <div className="user-info-icon">
                                                <FaUsers />
                                            </div>

                                            <div>
                                                <span>
                                                    Username
                                                </span>

                                                <strong>
                                                    {user.UserName || "-"}
                                                </strong>
                                            </div>

                                        </div>

                                        <div className="user-info-row">

                                            <div className="user-info-icon">
                                                <FaBuilding />
                                            </div>

                                            <div>
                                                <span>
                                                    Department
                                                </span>

                                                <strong>
                                                    {user.DepartmentName ||
                                                        user.DepartmentID ||
                                                        "No Department"}
                                                </strong>
                                            </div>

                                        </div>

                                        <div className="user-info-row">

                                            <div className="user-info-icon">
                                                <FaCodeBranch />
                                            </div>

                                            <div>
                                                <span>
                                                    Branch
                                                </span>

                                                <strong>
                                                    {user.BranchName ||
                                                        user.BranchID ||
                                                        "No Branch"}
                                                </strong>
                                            </div>

                                        </div>

                                    </div>

                                    <div className="user-card-email">

                                        <span>
                                            Email
                                        </span>

                                        <strong>
                                            {user.Email || "-"}
                                        </strong>

                                    </div>


                                    <div className="user-card-footer">

                                        <span
                                            className={`user-status ${
                                                user.IsActive
                                                    ? "active"
                                                    : "inactive"
                                            }`}
                                        >
                                            <i />

                                            {user.IsActive
                                                ? "Active"
                                                : "Inactive"}
                                        </span>

                                        <span className="user-card-id">
                                            #{user.UserID}
                                        </span>

                                    </div>

                                </article>

                            ))}

                        </div>

                    )}

                </section>

            </div>
        </DashboardLayout>
    );
}

export default Users;