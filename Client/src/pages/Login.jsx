import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/Login.css";

function Login() {

    const navigate = useNavigate();

    const { login } = useContext(AuthContext);

    const [userName, setUserName] = useState("");

    const [password, setPassword] = useState("");

    const [error, setError] = useState("");

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            await login(userName, password);

            navigate("/dashboard");

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Login Failed"
            );

        }

    };

return (
    <div className="login-page">

        <div className="login-card">

            <div className="logo">
                <h1>RAYA</h1>
                <p>Management System</p>
            </div>

            <form onSubmit={handleSubmit}>

                <div className="input-group">
                    <label>Username</label>

                    <input
                        type="text"
                        placeholder="Enter your username"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                    />
                </div>

                <div className="input-group">
                    <label>Password</label>

                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                {error && (
                    <p className="error-message">{error}</p>
                )}

                <button type="submit">
                    Login
                </button>

            </form>

        </div>

    </div>
);
}

export default Login;