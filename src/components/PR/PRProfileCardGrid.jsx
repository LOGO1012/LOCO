// src/components/pr/PRProfileGrid.jsx
import React from "react";

const PRProfileGrid = ({ allUsers }) => {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "10px",
            }}
        >
            {allUsers.map((user) => (
                <div
                    key={user._id}
                    style={{
                        border: "1px solid #ccc",
                        padding: "10px",
                        textAlign: "center",
                    }}
                >
                    <img
                        src={user.photo?.[0] || "https://via.placeholder.com/150"}
                        alt={user.nickname}
                        style={{ width: "100%" }}
                    />
                    <p>{user.nickname}</p>
                    <p>별점: {user.star}</p>
                    <p>성별: {user.gender}</p>
                </div>
            ))}
        </div>
    );
};

export default PRProfileGrid;
