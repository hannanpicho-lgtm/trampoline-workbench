import AdminDashboard from './pages/AdminDashboard';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import Leaderboard from './pages/Leaderboard';
import UserProfile from './pages/UserProfile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "Dashboard": Dashboard,
    "LandingPage": LandingPage,
    "Leaderboard": Leaderboard,
    "UserProfile": UserProfile,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};