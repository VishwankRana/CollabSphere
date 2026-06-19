import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./auth/useAuth.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import CreateInterviewRoomPage from "./pages/CreateInterviewRoomPage.jsx";
import DocumentPage from "./pages/DocumentPage.jsx";
import InterviewAnalyticsPage from "./pages/InterviewAnalyticsPage.jsx";
import InterviewDashboardPage from "./pages/InterviewDashboardPage.jsx";
import InterviewEndedPage from "./pages/InterviewEndedPage.jsx";
import InterviewReplayPage from "./pages/InterviewReplayPage.jsx";
import InterviewRoomPage from "./pages/InterviewRoomPage.jsx";
import JoinInterviewPage from "./pages/JoinInterviewPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? <InterviewDashboardPage /> : <Navigate to="/login" replace />
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/docs/:id" element={<DocumentPage />} />
          <Route path="/rooms/new" element={<CreateInterviewRoomPage />} />
          <Route path="/join/:inviteToken" element={<JoinInterviewPage />} />
          <Route path="/rooms/:id/analytics" element={<InterviewAnalyticsPage />} />
          <Route path="/rooms/:id/replay" element={<InterviewReplayPage />} />
          <Route path="/rooms/:id/ended" element={<InterviewEndedPage />} />
          <Route path="/rooms/:id" element={<InterviewRoomPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
