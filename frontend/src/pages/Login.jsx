import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context";
import api from "../client";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const { setUser } = useAuth();
    const navigate = useNavigate();

    async function handleLogin() {
        try {
            await api.post("/login", {
                email: email, 
                password: password
            });

            const response = await api.get("/me");
            setUser(response.data);
            navigate("/profile");
        } catch (err) {
            console.log(err.response?.data);
        }
    }

    return (
        <div>
        <h1>Login</h1>

        <div>
            <label>Email: </label>
            <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            />
        </div>
        <br />

        <div>
            <label>Password: </label>
            <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            />
        </div>
        <br />

        <button onClick={handleLogin}>Login</button>
        </div>
    );
}