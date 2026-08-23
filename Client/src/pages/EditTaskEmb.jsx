import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    FaArrowLeft,
    FaSave,
    FaTasks,
    FaCalendarAlt,
    FaExclamationTriangle,
} from "react-icons/fa";

import {
    getTask,
    updateTaskEmployee,
} from "../services/tasksService";

import "../styles/EditTask.css";


const EditTaskEmb = () => {

    const { taskId } = useParams();

    const navigate = useNavigate();

    const [isCompleted, setIsCompleted] = useState(false);

    const [task, setTask] = useState(null);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");


    // =========================================================
    // FORM
    // =========================================================

    const [form, setForm] = useState({

        Status: "",


        Blocker: "",

    });


    // =========================================================
    // LOAD TASK
    // =========================================================

    useEffect(() => {

        loadTask();

    }, [taskId]);


    const loadTask = async () => {

        try {

            setLoading(true);

            setError("");


            const data = await getTask(taskId);


            /*
             * getTask returns the task data
             * from the existing backend.
             */

            const taskData = data?.[0]?.[0];


            if (!taskData) {

                throw new Error(
                    "Task not found."
                );

            }


            setTask(taskData);

            if (taskData.Status === "Completed") {

    setIsCompleted(true);

} else {

    setIsCompleted(false);
}

//             if (taskData.Status === "Completed") {

//     setError(
//         "This task is already completed and cannot be edited."
//     );

//     return;
// }


            // =====================================================
            // SET FORM
            // =====================================================

            setForm({

                Status:
                    taskData.Status || "",

                Blocker:
                    taskData.Blocker || "",

            });


        } catch (err) {

            console.error(
                "Load employee task error:",
                err
            );


            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Failed to load task."
            );


        } finally {

            setLoading(false);

        }

    };



    // =========================================================
    // HANDLE STATUS
    // =========================================================

    const handleStatusChange = (e) => {

        const value = e.target.value;


        setForm((prev) => ({

            ...prev,

            Status: value,


            Blocker:
                value === "Blocked"
                    ? prev.Blocker
                    : "",

        }));

    };


    // =========================================================
    // HANDLE INPUT
    // =========================================================

    const handleChange = (e) => {

        const {
            name,
            value,
        } = e.target;


        setForm((prev) => ({

            ...prev,

            [name]: value,

        }));

    };


    // =========================================================
    // SUBMIT
    // =========================================================

    const handleSubmit = async (e) => {

        e.preventDefault();


        setError("");

        setSuccess("");


        // =====================================================
        // STATUS VALIDATION
        // =====================================================

        if (!form.Status) {

            setError(
                "Please select a status."
            );

            return;

        }





        // =====================================================
        // BLOCKER VALIDATION
        // =====================================================

        if (
            form.Status === "Blocked" &&
            !form.Blocker.trim()
        ) {

            setError(
                "Please enter a blocker description."
            );

            return;

        }


        try {

            setSaving(true);


            // =================================================
            // EMPLOYEE UPDATE
            // =================================================

            await updateTaskEmployee(
                taskId,
                {

                    Status:
                        form.Status,

                    Blocker:
                        form.Status === "Blocked"
                            ? form.Blocker.trim()
                            : null,

                }
            );


            // =================================================
            // SUCCESS
            // =================================================

            setSuccess(
                "Task updated successfully."
            );


            setTimeout(() => {

                navigate(
                    `/tasks/${taskId}`
                );

            }, 700);


        } catch (err) {

            console.error(
                "Employee task update error:",
                err
            );


            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Failed to update task."
            );


        } finally {

            setSaving(false);

        }

    };


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (

            <div className="edit-task-page">

                <div className="edit-task-loading">

                    Loading task...

                </div>

            </div>

        );

    }


    // =========================================================
    // ERROR WITHOUT TASK
    // =========================================================

    if (!task) {

if (isCompleted) {

    return (
        <div className="edit-task-page">

            <div className="edit-task-error">

                <FaExclamationTriangle />

                <h2>
                    Task Cannot Be Edited
                </h2>

                <p>
                    This task is already completed and cannot be edited.
                </p>

                <button
                    type="button"
                    onClick={() =>
                        navigate(`/tasks/${taskId}`)
                    }
                >
                    <FaArrowLeft />
                    Back to Task
                </button>

            </div>

        </div>
    );
}

        return (

            <div className="edit-task-page">

                <div className="edit-task-error">

                    <FaExclamationTriangle />

                    <h2>
                        Unable to load task
                    </h2>

                    <p>
                        {error || "Task not found."}
                    </p>


                    <button
                        type="button"
                        onClick={() =>
                            navigate("/tasks")
                        }
                    >

                        <FaArrowLeft />

                        Back to Tasks

                    </button>

                </div>

            </div>

        );

    }


    // =========================================================
    // PAGE
    // =========================================================

    return (

        <div className="edit-task-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="edit-task-header">


                <button
                    type="button"
                    className="edit-task-back"
                    onClick={() =>
                        navigate(
                            `/tasks/${taskId}`
                        )
                    }
                >

                    <FaArrowLeft />

                    Back to Task

                </button>


                <div className="edit-task-title-row">


                    <div className="edit-task-icon">

                        <FaTasks />

                    </div>


                    <div>

                        <span>
                            Editing Task #{task.TaskID}
                        </span>


                        <h1>
                            Update Task
                        </h1>


                        <p>
                            Update the status of your assigned task.
                        </p>

                    </div>

                </div>

            </div>


            {/* =================================================
                FORM
            ================================================= */}

            <form
                className="edit-task-form"
                onSubmit={handleSubmit}
            >


                <section className="edit-task-card">


                    <div className="edit-task-card-header">

                        <h2>
                            Task Information
                        </h2>

                    </div>


                    <div className="edit-task-form-grid">


                        {/* =================================================
                            TASK TITLE - READ ONLY
                        ================================================= */}

                        <div className="edit-task-field full">

                            <label>
                                Task Title
                            </label>

                            <input
                                type="text"
                                value={
                                    task.TaskTitle || ""
                                }
                                disabled
                            />

                        </div>


                        {/* =================================================
                            DESCRIPTION - READ ONLY
                        ================================================= */}

                        <div className="edit-task-field full">

                            <label>
                                Description
                            </label>

                            <textarea
                                value={
                                    task.TaskDescription || ""
                                }
                                disabled
                                rows="5"
                            />

                        </div>


                        {/* =================================================
                            ASSIGNED TO - READ ONLY
                        ================================================= */}

                        <div className="edit-task-field">

                            <label>
                                Assigned To
                            </label>

                            <input
                                type="text"
                                value={
                                    task.AssignedToName ||
                                    ""
                                }
                                disabled
                            />

                        </div>


                        {/* =================================================
                            PRIORITY - READ ONLY
                        ================================================= */}

                        <div className="edit-task-field">

                            <label>
                                Priority
                            </label>

                            <input
                                type="text"
                                value={
                                    task.PriorityLevel ||
                                    ""
                                }
                                disabled
                            />

                        </div>


                        {/* =================================================
                            STATUS - EDITABLE
                        ================================================= */}

                        <div className="edit-task-field">

                            <label>
                                Status
                            </label>


                            <select
                                name="Status"
                                value={
                                    form.Status
                                }
                                onChange={
                                    handleStatusChange
                                }
                            >

                                <option value="">
                                    Select Status
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


                        {/* =================================================
                            DUE DATE - READ ONLY
                        ================================================= */}

                        <div className="edit-task-field">

                            <label>

                                <FaCalendarAlt />

                                Due Date

                            </label>


                            <input
                                type="date"
                                value={
                                    task.DueDate
                                        ? task.DueDate.substring(
                                            0,
                                            10
                                        )
                                        : ""
                                }
                                disabled
                            />

                        </div>



                        {/* =================================================
                            BLOCKER
                        ================================================= */}

                        <div className="edit-task-field full">

                            <label>

                                <FaExclamationTriangle />

                                Blocker

                            </label>


                            <textarea
                                name="Blocker"
                                value={
                                    form.Blocker
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={
                                    form.Status !==
                                    "Blocked"
                                }
                                placeholder={
                                    form.Status ===
                                    "Blocked"
                                        ? "Explain why this task is blocked..."
                                        : "Blocker is only available when the task is blocked."
                                }
                                rows="4"
                            />

                        </div>


                    </div>

                </section>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <div className="edit-task-message error">

                        <FaExclamationTriangle />

                        {error}

                    </div>

                )}


                {/* =================================================
                    SUCCESS
                ================================================= */}

                {success && (

                    <div className="edit-task-message success">

                        {success}

                    </div>

                )}


                {/* =================================================
                    ACTIONS
                ================================================= */}

                <div className="edit-task-actions">


                    <button
                        type="button"
                        className="edit-task-cancel"
                        onClick={() =>
                            navigate(
                                `/tasks/${taskId}`
                            )
                        }
                        disabled={saving}
                    >

                        Cancel

                    </button>


                    <button
                        type="submit"
                        className="edit-task-save"
                        disabled={saving}
                    >

                        <FaSave />

                        {saving
                            ? "Saving..."
                            : "Save Changes"
                        }

                    </button>

                </div>


            </form>

        </div>

    );

};


export default EditTaskEmb;