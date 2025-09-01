import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import SellerLogin from "./SellerLogin";
import { Navigate } from "react-router-dom";
import DashBoard from "./StoreRoutes/DashBoard";
import StoreCategories from "./StoreRoutes/Categories";
import SellerProduct from "./StoreRoutes/SellerProduct";
import Stock from "./StoreRoutes/Stock";
import AddStoreCat from "./StoreRoutes/AddCatStore";
import StoreOrder from "./StoreRoutes/StoreOrder";
import StoreSidenav from "./components/Sidenav/Sidenav";
import AddSellerProduct from "./StoreRoutes/addProduct";


function ProtectedRoute({ children }) {
  const authtoken = localStorage.getItem("token");
  return authtoken ? children : <Navigate to="/seller-login" />;
}

function App() {
  const { pathname } = useLocation();
  const showSidebar = pathname !== "/seller-login";

  return (
    <>
      {showSidebar && <StoreSidenav />}
      <Routes>
        <Route path="/seller-login" element={<SellerLogin />} />
        <Route path="/dashboard1" element={   <ProtectedRoute> <DashBoard /> </ProtectedRoute>} />
        <Route path="/storecat" element={<StoreCategories />} />
        <Route path="/sellerProduct" element={<SellerProduct />} />
        <Route path="/add-seller-product" element={<AddSellerProduct />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/addstorecat" element={<AddStoreCat />} />
        <Route path="/store-orders" element={<StoreOrder />} />
        <Route path="*" element={<Navigate to="/seller-login" />} />
      </Routes>
    </>
  );
}

export default App;
