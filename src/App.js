import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import SellerLogin from "./SellerLogin";
import { Navigate } from "react-router-dom";
import DashBoard from "./StoreRoutes/DashBoard";
import StoreCategories from "./StoreRoutes/Categories";
import SellerProduct from "./StoreRoutes/SellerProduct";
import Stock from "./StoreRoutes/Stock";
import AddStoreCat from "./StoreRoutes/AddCatStore";
import Wallet from "./StoreRoutes/SellerWallet"
import StoreOrder from "./StoreRoutes/StoreOrder";
import StoreSidenav from "./components/Sidenav/Sidenav";
import AddSellerProduct from "./StoreRoutes/addProduct";
import SearchProduct from "./StoreRoutes/SearchProduct";
import Profile from './StoreRoutes/Profile';
import UnapprovedProducts from "StoreRoutes/UnapprovedProducts";

function PrivateRoute({ element }) {
  const token = localStorage.getItem("token");
  return token ? element : <Navigate to="/seller-login" replace />;
}


function App() {
  const { pathname } = useLocation();
  const showSidebar = pathname !== "/seller-login";

  return (
    <>
      {showSidebar && <StoreSidenav />}
      <Routes>
        <Route path="/seller-login" element={<SellerLogin />} />
        <Route path="/dashboard1" element={<PrivateRoute element={<DashBoard />} />} />
        <Route path="/Wallet" element={<PrivateRoute element={<Wallet />} />} />
        <Route path="/storecat" element={<PrivateRoute element={<StoreCategories />} />} />
        <Route path="/sellerProduct" element={<PrivateRoute element={<SellerProduct />} />} />
        <Route path="/add-seller-product" element={<PrivateRoute element={<AddSellerProduct />}/>} />
        <Route path="/stock" element={<PrivateRoute element={<Stock />}/>} />
        <Route path="/Profile" element={<PrivateRoute element={<Profile />}/>} />
        <Route path="/addstorecat" element={<PrivateRoute element={<AddStoreCat />}/>} />
        <Route path="/store-orders" element={<PrivateRoute element={<StoreOrder />}/>} />
        <Route path="/search-products" element={<PrivateRoute element={<SearchProduct />}/>} />
        <Route path="/unapproved-products" element={<PrivateRoute element={<UnapprovedProducts />}/>} />
        <Route path="*" element={<Navigate to="/seller-login" />} />
      </Routes>
    </>
  );
}

export default App;
