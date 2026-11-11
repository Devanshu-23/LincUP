import {createContext, useContext, useState, useEffect} from "react";
import api from "./client";

const AuthContext = createContext(null);

export function AuthProvider( {children} ) {
    const [user, setUser] = useState(null);

    useEffect( () => {
        const fetchUser = async() => {
            try {
                const res = await api.get("me");
                setUser(res.data);
            } catch {
                setUser(null);
            }
        }
        fetchUser();
    }, []);

    return (
        <AuthContext.Provider value = {{user, setUser}}>
            {children}
        </AuthContext.Provider>
    );

}

export function useAuth() {
    return useContext(AuthContext);
}