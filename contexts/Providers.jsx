import { AuthProvider } from "./AuthContext";

function Providers({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

export default Providers;
