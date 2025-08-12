import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import StoreLogin from "./StoreLogin";
import { Navigate } from "react-router-dom";
import DashBoard from "./StoreRoutes/DashBoard";
import StoreCategories from "./StoreRoutes/Categories";
import StoreProduct from "./StoreRoutes/StoreProduct";
import Stock from "./StoreRoutes/Stock";
import AddStoreCat from "./StoreRoutes/AddCatStore";
import StoreOrder from "./StoreRoutes/StoreOrder";
import StoreSidenav from "./components/Sidenav/Sidenav";

function ProtectedRoute({ children }) {
  const storeId = localStorage.getItem("storeId");
  return storeId ? children : <Navigate to="/storeLogin" />;
}

function App() {
  const { pathname } = useLocation();
  const showSidebar = pathname !== "/storeLogin";

  return (
    <>
      {showSidebar && <StoreSidenav />}
      <Routes>
        <Route path="/storeLogin" element={<StoreLogin />} />
        <Route path="/dashboard1" element={   <ProtectedRoute> <DashBoard /> </ProtectedRoute>} />
        <Route path="/storecat" element={<StoreCategories />} />
        <Route path="/storeproduct" element={<StoreProduct />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/addstorecat" element={<AddStoreCat />} />
        <Route path="/store-orders" element={<StoreOrder />} />

        <Route path="*" element={<Navigate to="/storeLogin" />} />
      </Routes>
    </>
  );
}

export default App;
