import { useAuth } from "../Context";

export default function Profile() {
    const { user } = useAuth();

    if (!user) {
        return <p>Loading profile...</p>;
    }

    return (
        <div>
            <h1>My Profile</h1>

            <p><strong>Student ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Full Name:</strong> {user.full_name}</p>
            <p><strong>Department:</strong> {user.department}</p>
            <p><strong>Degree Program:</strong> {user.degree_program}</p>
            <p><strong>Year of Study:</strong> {user.study_year}</p>
        </div>
    );
}