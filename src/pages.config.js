import Home from './pages/Home';
import Principles from './pages/Principles';
import Whitepaper from './pages/Whitepaper';
import Oracle from './pages/Oracle';
import Profile from './pages/Profile';
import Sanctum from './pages/Sanctum';
import sanctum from './pages/sanctum';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Principles": Principles,
    "Whitepaper": Whitepaper,
    "Oracle": Oracle,
    "Profile": Profile,
    "Sanctum": Sanctum,
    "sanctum": sanctum,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};