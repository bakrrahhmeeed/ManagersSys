import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import {
    FaLayerGroup,
    FaBuilding,
    FaUser,
    FaSortNumericDown,
    FaCalendarAlt,
    FaStickyNote,
    FaArrowLeft
} from "react-icons/fa";

import {
    createStage,
    getDepartmentManagers
} from "../services/stageService";

import { getDepartments } from "../services/departmentService";

import "../styles/CreateStage.css";

const CreateStage = () => {
    const navigate = useNavigate();

    const [departments, setDepartments] = useState([]);
    const [managers, setManagers] = useState([]);

    const [searchParams] = useSearchParams();

    const projectId = searchParams.get("projectId");

    const [formData, setFormData] = useState({
        stageName: "",
        stageOrder: "",
        departmentId: "",
        responsibleUserId: "",
        endDate: "",
        notes: ""
    });

    const [loading, setLoading] = useState(false);
    const [loadingManagers, setLoadingManagers] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const loadDepartments = async () => {
            try {
                const data = await getDepartments();
                setDepartments(data || []);
            } catch (err) {
                setError(
                    err?.response?.data?.message ||
                    "Failed to load departments."
                );
            }
        };

        loadDepartments();
    }, []);

    useEffect(() => {
        if (!formData.departmentId) {
            setManagers([]);
            setFormData(prev => ({
                ...prev,
                responsibleUserId: ""
            }));
            return;
        }

        const loadManagers = async () => {
            try {
                setLoadingManagers(true);
                setError("");

                const data = await getDepartmentManagers(
                    formData.departmentId
                );

                setManagers(data || []);

                setFormData(prev => ({
                    ...prev,
                    responsibleUserId: ""
                }));
            } catch (err) {
                setManagers([]);

                setError(
                    err?.response?.data?.message ||
                    "Failed to load department managers."
                );
            } finally {
                setLoadingManagers(false);
            }
        };

        loadManagers();
    }, [formData.departmentId]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        setError("");
        setSuccess("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!projectId) {
            setError("Project not found.");
            return;
        }

        if (
            !formData.stageName.trim() ||
            !formData.stageOrder ||
            !formData.departmentId ||
            !formData.responsibleUserId ||
            !formData.endDate
        ) {
            setError("Please fill all required fields.");
            return;
        }

        if (Number(formData.stageOrder) < 1) {
            setError("Stage order must be greater than 0.");
            return;
        }

        try {
            setLoading(true);

            await createStage({
                projectId: Number(projectId),
                stageName: formData.stageName.trim(),
                stageOrder: Number(formData.stageOrder),
                targetEndDate: formData.endDate,
                responsibleUserId: Number(
                    formData.responsibleUserId
                ),
                notes: formData.notes.trim(),
                departmentId: Number(formData.departmentId)
            });

            setSuccess("Stage created successfully.");

            setTimeout(() => {
                navigate(`/stages`);
            }, 700);

        } catch (err) {
            setError(
                err?.response?.data?.message ||
                "Failed to create stage."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-stage-page">

            <div className="create-stage-header">

                <button
                    type="button"
                    className="back-button"
                    onClick={() => navigate(-1)}
                >
                    <FaArrowLeft />
                    Back
                </button>

                <div>
                    <h1>Add Stage</h1>
                    <p>
                        Create a new stage for this project.
                    </p>
                </div>

            </div>

            <div className="create-stage-card">

                <div className="form-header">

                    <div className="form-icon">
                        <FaLayerGroup />
                    </div>

                    <div>
                        <h2>Stage Information</h2>
                        <p>
                            Enter the details for the new project stage.
                        </p>
                    </div>

                </div>

                {error && (
                    <div className="form-message error">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="form-message success">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="form-grid">

                        <div className="form-group full-width">

                            <label>
                                Stage Name
                                <span>*</span>
                            </label>

                            <div className="input-wrapper">

                                <FaLayerGroup />

                                <input
                                    type="text"
                                    name="stageName"
                                    value={formData.stageName}
                                    onChange={handleChange}
                                    placeholder="Enter stage name"
                                    disabled={loading}
                                />

                            </div>

                        </div>

                        <div className="form-group">

                            <label>
                                Stage Order
                                <span>*</span>
                            </label>

                            <div className="input-wrapper">

                                <FaSortNumericDown />

                                <input
                                    type="number"
                                    name="stageOrder"
                                    min="1"
                                    value={formData.stageOrder}
                                    onChange={handleChange}
                                    placeholder="e.g. 1"
                                    disabled={loading}
                                />

                            </div>

                            <small>
                                Stage order must be unique within this project.
                            </small>

                        </div>

                        <div className="form-group">

                            <label>
                                Department
                                <span>*</span>
                            </label>

                            <div className="input-wrapper">

                                <FaBuilding />

                                <select
                                    name="departmentId"
                                    value={formData.departmentId}
                                    onChange={handleChange}
                                    disabled={loading}
                                >

                                    <option value="">
                                        Select Department
                                    </option>

                                    {departments.map(department => (
                                        <option
                                            key={department.DepartmentID}
                                            value={department.DepartmentID}
                                        >
                                            {department.DepartmentName}
                                        </option>
                                    ))}

                                </select>

                            </div>

                        </div>

                        <div className="form-group">

                            <label>
                                Responsible Department Manager
                                <span>*</span>
                            </label>

                            <div className="input-wrapper">

                                <FaUser />

                                <select
                                    name="responsibleUserId"
                                    value={formData.responsibleUserId}
                                    onChange={handleChange}
                                    disabled={
                                        loading ||
                                        !formData.departmentId ||
                                        loadingManagers
                                    }
                                >

                                    <option value="">
                                        {!formData.departmentId
                                            ? "Select Department First"
                                            : loadingManagers
                                            ? "Loading Managers..."
                                            : managers.length === 0
                                            ? "No Department Manager Found"
                                            : "Select Department Manager"}
                                    </option>

                                    {managers.map(manager => (
                                        <option
                                            key={manager.UserID}
                                            value={manager.UserID}
                                        >
                                            {manager.FullName}
                                        </option>
                                    ))}

                                </select>

                            </div>

                        </div>

                        <div className="form-group">

                            <label>
                                Target End Date
                                <span>*</span>
                            </label>

                            <div className="input-wrapper">

                                <FaCalendarAlt />

                                <input
                                    type="date"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    disabled={loading}
                                />

                            </div>

                        </div>

                        <div className="form-group full-width">

                            <label>
                                Notes
                            </label>

                            <div className="textarea-wrapper">

                                <FaStickyNote />

                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    placeholder="Add notes about this stage..."
                                    rows="5"
                                    disabled={loading}
                                />

                            </div>

                        </div>

                    </div>

                    <div className="form-actions">

                        <button
                            type="button"
                            className="cancel-button"
                            onClick={() => navigate(-1)}
                            disabled={loading}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="submit-button"
                            disabled={loading}
                        >
                            {loading
                                ? "Creating..."
                                : "Create Stage"}
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
};

export default CreateStage;