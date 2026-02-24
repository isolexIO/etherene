/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
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
import License from './pages/License';
import Copyright from './pages/Copyright';
import PrivacyPolicy from './pages/PrivacyPolicy';
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
    "License": License,
    "Copyright": Copyright,
    "PrivacyPolicy": PrivacyPolicy,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};