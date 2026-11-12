import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import TopBar from "./TopBar";
import "./Layout.css";

// Shell for every logged-in page: top bar, page content, mobile tab bar.
export default function AppLayout() {
  return (
    <div className="app-shell">
      <TopBar />
      <main className="page">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
