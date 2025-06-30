import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import StoreLogin from "./StoreLogin";
import DashBoard from "./StoreRoutes/DashBoard";
import StoreCategories from "./StoreRoutes/Categories";
import StoreProduct from "./StoreRoutes/StoreProduct";
import Stock from "./StoreRoutes/Stock";
import AddStoreCat from "./StoreRoutes/AddCatStore";
import StoreOrder from "./StoreRoutes/StoreOrder";
import StoreSidenav from "./components/Sidenav/Sidenav";

function App() {
  const { pathname } = useLocation();
  const showSidebar = pathname !== "/"; // hide sidebar on login page

  return (
    <>
      {showSidebar && <StoreSidenav />}
      <Routes>
        <Route path="/" element={<StoreLogin />} />
        <Route path="/dashboard1" element={<DashBoard />} />
        <Route path="/storecat" element={<StoreCategories />} />
        <Route path="/storeproduct" element={<StoreProduct />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/addstorecat" element={<AddStoreCat />} />
        <Route path="/store-orders" element={<StoreOrder />} />
      </Routes>
    </>
  );
}

export default App;
