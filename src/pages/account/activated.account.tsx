// src/pages/account/ActivateAccount.tsx

import { useEffect, useState, useRef } from "react";
import { Result, Spin } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../../services/auth.service";

export default function ActivateAccount() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const hasCalled = useRef(false);

    useEffect(() => {
        const activate = async () => {
            if (hasCalled.current) return;
            hasCalled.current = true;

            const key = searchParams.get("key");

            if (!key) {
                setSuccess(false);
                setLoading(false);
                return;
            }

            try {
                await authService.activateAccount(key);

                setSuccess(true);

                setTimeout(() => {
                    navigate("/login");
                }, 3000);
            } catch (error) {
                setSuccess(false);
            } finally {
                setLoading(false);
            }
        };

        activate();
    }, [navigate, searchParams]);

    if (loading) {
        return (
            <div
                style={{
                    height: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <Spin size="large" />
            </div>
        );
    }

    return success ? (
        <Result
            status="success"
            title="Account activated successfully"
            subTitle="Redirecting to login page..."
        />
    ) : (
        <Result
            status="error"
            title="Account activation failed"
            subTitle="Activation key is invalid or expired."
        />
    );
}