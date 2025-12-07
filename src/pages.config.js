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
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};