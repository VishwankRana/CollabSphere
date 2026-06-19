import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./auth/useAuth.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import { getDefaultDocumentPath } from "./lib/documents.js";
import DocumentPage from "./pages/DocumentPage.jsx";
import InterviewRoomPage from "./pages/InterviewRoomPage.jsx";
import InterviewAnalyticsPage from "./pages/InterviewAnalyticsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";

function App() {
  const { isAuthenticated, user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to={isAuthenticated ? getDefaultDocumentPath(user) : "/login"}
              replace
            />
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/docs/:id" element={<DocumentPage />} />
          <Route path="/rooms/:id" element={<InterviewRoomPage />} />
          <Route path="/rooms/:id/analytics" element={<InterviewAnalyticsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
