import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./auth/useAuth.jsx";
import AppShellLayout from "./components/AppShellLayout";
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
import QuestionBankPage from "./pages/QuestionBankPage.jsx";
import QuestionFormPage from "./pages/QuestionFormPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/rooms/:id" element={<InterviewRoomPage />} />
          <Route path="/rooms/:id/replay" element={<InterviewReplayPage />} />

          <Route element={<AppShellLayout />}>
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <InterviewDashboardPage />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route path="/docs/:id" element={<DocumentPage />} />
            <Route path="/rooms/new" element={<CreateInterviewRoomPage />} />
            <Route path="/question-bank" element={<QuestionBankPage />} />
            <Route path="/question-bank/new" element={<QuestionFormPage />} />
            <Route path="/question-bank/:id/edit" element={<QuestionFormPage />} />
            <Route path="/join/:inviteToken" element={<JoinInterviewPage />} />
            <Route path="/rooms/:id/analytics" element={<InterviewAnalyticsPage />} />
            <Route path="/rooms/:id/ended" element={<InterviewEndedPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
