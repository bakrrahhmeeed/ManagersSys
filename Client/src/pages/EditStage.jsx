import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import {
    FaArrowLeft,
    FaSave,
    FaLayerGroup,
    FaUser,
    FaCalendarAlt,
    FaStickyNote,
    FaExclamationTriangle
} from "react-icons/fa";

import {
    updateStage,
    getDepartmentManagers
} from "../services/stageService";

import Header from "../components/Header";
import "../styles/EditStage.css";

const EditStage = () => {

    const { id } = useParams();
    const navigate = useNavigate();

    const [stage, setStage] = useState(null);
    const [managers, setManagers] = useState([]);

    const [form, setForm] = useState({
        stageName: "",
        stageOrder: "",
        status: "",
        endDate: "",
        responsibleUserId: "",
        notes: ""
    });

    const [loading, setLoading] = useState(true);
    const [loadingManagers, setLoadingManagers] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {

        const loadStage = async () => {

            try {

                setLoading(true);
                setError("");

                const token = localStorage.getItem("token");

                const response = await fetch(
                    `http://localhost:3001/api/stages/${id}`,
                    {
                        headers: {
                            Accept: "application/json",
                            ...(token
                                ? {
                                    Authorization:
                                        `Bearer ${token}`
                                }
                                : {})
                        }
                    }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message ||
                        "Failed to load stage."
                    );
                }

                const stageData =
                    result.stage || result;

                setStage(stageData);

                setForm({
                    stageName:
                        stageData.StageName || "",

                    stageOrder:
                        stageData.StageOrder ?? "",

                    status:
                        stageData.Status || "",

                    endDate:
                        stageData.EndDate
                            ? stageData.EndDate.substring(0, 10)
                            : "",

                    responsibleUserId:
                        stageData.ResponsibleUserID ?? "",

                    notes:
                        stageData.Notes || ""
                });

            } catch (err) {

                console.error(
                    "LOAD STAGE ERROR:",
                    err
                );

                setError(
                    err.message ||
                    "Failed to load stage."
                );

            } finally {

                setLoading(false);

            }
        };

        if (id) {
            loadStage();
        }

    }, [id]);


    useEffect(() => {

        const loadDepartmentManagers = async () => {

            if (!stage?.DepartmentID) {
                return;
            }

            try {

                setLoadingManagers(true);

                const result =
                    await getDepartmentManagers(
                        stage.DepartmentID
                    );

                setManagers(result || []);

            } catch (err) {

                console.error(
                    "LOAD DEPARTMENT MANAGERS ERROR:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                    "Failed to load department managers."
                );

            } finally {

                setLoadingManagers(false);

            }
        };

        loadDepartmentManagers();

    }, [stage]);


    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value
        }));

    };


    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");

        if (!form.stageName.trim()) {

            setError(
                "Stage name is required."
            );

            return;
        }

        if (!form.stageOrder) {

            setError(
                "Stage order is required."
            );

            return;
        }

        if (!form.status) {

            setError(
                "Stage status is required."
            );

            return;
        }

        if (!form.responsibleUserId) {

            setError(
                "Responsible user is required."
            );

            return;
        }

        try {

            setSaving(true);

            const data = {
                stageName:
                    form.stageName.trim(),

                stageOrder:
                    Number(form.stageOrder),

                status:
                    form.status,

                endDate:
                    form.endDate || null,

                responsibleUserId:
                    Number(form.responsibleUserId),

                notes:
                    form.notes.trim() || null
            };

            const result =
                await updateStage(
                    id,
                    data
                );

            setSuccess(
                result.message ||
                "Stage updated successfully."
            );

            setTimeout(() => {
                navigate(-1);
            }, 800);

        } catch (err) {

            console.error(
                "UPDATE STAGE ERROR:",
                err
            );

            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to update stage."
            );

        } finally {

            setSaving(false);

        }
    };


    if (loading) {

        return (
            <div className="edit-stage-page">

                <Header />

                <div className="edit-stage-state">

                    <div className="edit-stage-spinner" />

                    <p>
                        Loading stage...
                    </p>

                </div>

            </div>
        );
    }


    if (error && !stage) {

        return (

            <div className="edit-stage-page">

                <Header />

                <div className="edit-stage-state error">

                    <FaExclamationTriangle />

                    <h2>
                        Failed to load stage
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        onClick={() =>
                            navigate(-1)
                        }
                    >
                        <FaArrowLeft />
                        Back
                    </button>

                </div>

            </div>
        );
    }


    if (
        stage?.Status === "Completed"
    ) {

        return (
            <div className="edit-stage-page">

                <Header />

                <div className="edit-stage-state error">

                    <FaExclamationTriangle />

                    <h2>
                        Stage Cannot Be Edited
                    </h2>

                    <p>
                        This stage is already completed
                        and cannot be modified.
                    </p>

                    <button
                        onClick={() =>
                            navigate(-1)
                        }
                    >
                        <FaArrowLeft />
                        Back
                    </button>

                </div>

            </div>
        );
    }


    return (
    <DashboardLayout>
        <div className="edit-stage-page">

            <Header />

            <main className="edit-stage-container">

                <div className="edit-stage-topbar">

                    <button
                        className="edit-stage-back"
                        onClick={() =>
                            navigate(-1)
                        }
                    >
                        <FaArrowLeft />
                    </button>

                    <div>

                        <div className="edit-stage-breadcrumb">
                            Stages
                            <span>/</span>
                            Edit Stage
                        </div>

                        <h1>
                            Edit Stage
                        </h1>

                        <p>
                            Update the stage information
                            and responsible manager.
                        </p>

                    </div>

                </div>


                {error && (
                    <div className="edit-stage-alert error">

                        <FaExclamationTriangle />

                        <span>
                            {error}
                        </span>

                    </div>
                )}


                {success && (
                    <div className="edit-stage-alert success">

                        <span>
                            {success}
                        </span>

                    </div>
                )}


                <form
                    className="edit-stage-card"
                    onSubmit={handleSubmit}
                >

                    <div className="edit-stage-section">

                        <div className="edit-stage-section-header">

                            <div className="edit-stage-section-icon">
                                <FaLayerGroup />
                            </div>

                            <div>

                                <h2>
                                    Stage Information
                                </h2>

                                <p>
                                    Update the basic stage
                                    information.
                                </p>

                            </div>

                        </div>


                        <div className="edit-stage-grid">

                            <div className="edit-stage-field full">

                                <label>
                                    Stage Name
                                </label>

                                <input
                                    type="text"
                                    name="stageName"
                                    value={form.stageName}
                                    onChange={handleChange}
                                    placeholder="Enter stage name"
                                />

                            </div>


                            <div className="edit-stage-field">

                                <label>
                                    Stage Order
                                </label>

                                <input
                                    type="number"
                                    name="stageOrder"
                                    min="1"
                                    value={form.stageOrder}
                                    onChange={handleChange}
                                />

                            </div>


                            <div className="edit-stage-field">

                                <label>
                                    Status
                                </label>

                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={handleChange}
                                >

                                    <option value="">
                                        Select status
                                    </option>

                                    <option value="Not Started">
                                        Not Started
                                    </option>

                                    <option value="In Progress">
                                        In Progress
                                    </option>

                                    <option value="Blocked">
                                        Blocked
                                    </option>

                                    <option value="Completed">
                                        Completed
                                    </option>

                                </select>

                            </div>


                            <div className="edit-stage-field">

                                <label>
                                    <FaCalendarAlt />
                                    End Date
                                </label>

                                <input
                                    type="date"
                                    name="endDate"
                                    value={form.endDate}
                                    onChange={handleChange}
                                />

                            </div>


                            <div className="edit-stage-field">

                                <label>
                                    <FaUser />
                                    Responsible Manager
                                </label>

                                <select
                                    name="responsibleUserId"
                                    value={
                                        form.responsibleUserId
                                    }
                                    onChange={handleChange}
                                    disabled={
                                        loadingManagers
                                    }
                                >

                                    <option value="">
                                        {loadingManagers
                                            ? "Loading managers..."
                                            : "Select manager"}
                                    </option>

                                    {managers.map(
                                        (manager) => (
                                            <option
                                                key={
                                                    manager.UserID
                                                }
                                                value={
                                                    manager.UserID
                                                }
                                            >
                                                {
                                                    manager.FullName
                                                }
                                            </option>
                                        )
                                    )}

                                </select>

                            </div>


                            <div className="edit-stage-field full">

                                <label>
                                    <FaStickyNote />
                                    Notes
                                </label>

                                <textarea
                                    name="notes"
                                    value={form.notes}
                                    onChange={handleChange}
                                    placeholder="Enter stage notes..."
                                    rows="5"
                                />

                            </div>

                        </div>

                    </div>


                    <div className="edit-stage-footer">

                        <button
                            type="button"
                            className="edit-stage-cancel"
                            onClick={() =>
                                navigate(-1)
                            }
                            disabled={saving}
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            className="edit-stage-save"
                            disabled={saving}
                        >

                            <FaSave />

                            {saving
                                ? "Saving..."
                                : "Save Changes"}

                        </button>

                    </div>

                </form>

            </main>

        </div>

    </DashboardLayout>    
        
    );
};

export default EditStage;