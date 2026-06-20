import { Outlet } from "react-router-dom";

import AppTopBar from "./AppTopBar";
import Sidebar from "./Sidebar";

export default function AppShellLayout() {
  return (
    <div className="cs-app">
      <AppTopBar />
      <div className="cs-body">
        <Sidebar />
        <div className="cs-main">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
