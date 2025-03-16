import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import CreateListing from "./CreateListing";

import Listing from "./Listing";

import MyBids from "./MyBids";

import AdminListings from "./AdminListings";

import Login from "./Login";

import ManageUsers from "./ManageUsers";

import Account from "./Account";

import EditListing from "./EditListing";

import PaymentSettings from "./PaymentSettings";

import EmailTemplates from "./EmailTemplates";

import NotificationSettings from "./NotificationSettings";

import initializeEmailTemplates from "./initializeEmailTemplates";

import Welcome from "./Welcome";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    CreateListing: CreateListing,
    
    Listing: Listing,
    
    MyBids: MyBids,
    
    AdminListings: AdminListings,
    
    Login: Login,
    
    ManageUsers: ManageUsers,
    
    Account: Account,
    
    EditListing: EditListing,
    
    PaymentSettings: PaymentSettings,
    
    EmailTemplates: EmailTemplates,
    
    NotificationSettings: NotificationSettings,
    
    initializeEmailTemplates: initializeEmailTemplates,
    
    Welcome: Welcome,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/CreateListing" element={<CreateListing />} />
                
                <Route path="/Listing" element={<Listing />} />
                
                <Route path="/MyBids" element={<MyBids />} />
                
                <Route path="/AdminListings" element={<AdminListings />} />
                
                <Route path="/Login" element={<Login />} />
                
                <Route path="/ManageUsers" element={<ManageUsers />} />
                
                <Route path="/Account" element={<Account />} />
                
                <Route path="/EditListing" element={<EditListing />} />
                
                <Route path="/PaymentSettings" element={<PaymentSettings />} />
                
                <Route path="/EmailTemplates" element={<EmailTemplates />} />
                
                <Route path="/NotificationSettings" element={<NotificationSettings />} />
                
                <Route path="/initializeEmailTemplates" element={<initializeEmailTemplates />} />
                
                <Route path="/Welcome" element={<Welcome />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}