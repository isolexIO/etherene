import Home from './pages/Home';
import Principles from './pages/Principles';
import Whitepaper from './pages/Whitepaper';
import Oracle from './pages/Oracle';
import Profile from './pages/Profile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Principles": Principles,
    "Whitepaper": Whitepaper,
    "Oracle": Oracle,
    "Profile": Profile,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};