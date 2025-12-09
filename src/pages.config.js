import Home from './pages/Home';
import Principles from './pages/Principles';
import Whitepaper from './pages/Whitepaper';
import Oracle from './pages/Oracle';
import Profile from './pages/Profile';
import Sanctum from './pages/Sanctum';
import BlockExplorer from './pages/BlockExplorer';
import Transaction from './pages/Transaction';
import Block from './pages/Block';
import Agora from './pages/Agora';
import CustomizeProfile from './pages/CustomizeProfile';
import Lessons from './pages/Lessons';
import DirectMessages from './pages/DirectMessages';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Principles": Principles,
    "Whitepaper": Whitepaper,
    "Oracle": Oracle,
    "Profile": Profile,
    "Sanctum": Sanctum,
    "BlockExplorer": BlockExplorer,
    "Transaction": Transaction,
    "Block": Block,
    "Agora": Agora,
    "CustomizeProfile": CustomizeProfile,
    "Lessons": Lessons,
    "DirectMessages": DirectMessages,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};