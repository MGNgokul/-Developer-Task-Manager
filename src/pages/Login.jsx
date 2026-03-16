import { useEffect } from "react";
import LoginForm from "../components/auth/LoginForm";

function Login() {
  useEffect(() => {
    document.body.classList.add("login-page-active");
    return () => document.body.classList.remove("login-page-active");
  }, []);

  return <LoginForm />;
}

export default Login;
