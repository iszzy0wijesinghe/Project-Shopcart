import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

const AuthWrapper = ({ children, allowedRoles }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [authChecked, setAuthChecked] = useState(false); // Track whether authentication was checked

  useEffect(() => {
    const checkAuth = async () => {
      if (authChecked) return; // Prevent duplicate API calls
      setAuthChecked(true);

      try {
        const res = await api.get("/api/auth/check_auth");
        setUserRole(res.data.role);

        // If user role is not allowed, redirect to login
        if (!allowedRoles.includes(res.data.role)) {
          navigate("/login");
        } else {
          setLoading(false);
        }
      } catch (error) {
        navigate("/login");
      }
    };

    checkAuth();
  }, [navigate, allowedRoles, authChecked]);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>Checking authentication...</div>;

  return <>{children}</>;
};

export default AuthWrapper;