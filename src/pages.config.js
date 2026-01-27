import Admin from './pages/Admin';
import Agora from './pages/Agora';
import Block from './pages/Block';
import BlockExplorer from './pages/BlockExplorer';
import CustomizeProfile from './pages/CustomizeProfile';
import Home from './pages/Home';
import Lessons from './pages/Lessons';
import Oracle from './pages/Oracle';
import Principles from './pages/Principles';
import Profile from './pages/Profile';
import Sanctum from './pages/Sanctum';
import Transaction from './pages/Transaction';
import Whitepaper from './pages/Whitepaper';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "Agora": Agora,
    "Block": Block,
    "BlockExplorer": BlockExplorer,
    "CustomizeProfile": CustomizeProfile,
    "Home": Home,
    "Lessons": Lessons,
    "Oracle": Oracle,
    "Principles": Principles,
    "Profile": Profile,
    "Sanctum": Sanctum,
    "Transaction": Transaction,
    "Whitepaper": Whitepaper,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};