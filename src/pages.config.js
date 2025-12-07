import Home from './pages/Home';
import Principles from './pages/Principles';
import Whitepaper from './pages/Whitepaper';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Principles": Principles,
    "Whitepaper": Whitepaper,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};