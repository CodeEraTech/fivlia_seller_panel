import React,{useEffect} from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import SellerLogin from "./SellerLogin";
import { Navigate } from "react-router-dom";
import DashBoard from "./StoreRoutes/DashBoard";
import StoreCategories from "./StoreRoutes/Categories";
import FoodCategory from "./StoreRoutes/FoodCategory/FoodCategory";
import AddStoreFoodCategory from "./StoreRoutes/FoodCategory/AddStoreFoodCategory";
import SellerProduct from "./StoreRoutes/SellerProduct";
import Stock from "./StoreRoutes/Stock";
import AddStoreCat from "./StoreRoutes/AddCatStore";
import Wallet from "./StoreRoutes/SellerWallet"
import StoreOrder from "./StoreRoutes/StoreOrder";
import StoreSidenav from "./components/Sidenav/Sidenav";
import AddSellerProduct from "./StoreRoutes/addProduct";
import SearchProduct from "./StoreRoutes/SearchProduct";
import Profile from './StoreRoutes/Profile';
import CouponManagement from './StoreRoutes/coupon';
import UnapprovedProducts from "StoreRoutes/UnapprovedProducts";
import { getMessaging, onMessage } from "firebase/messaging";
import firebaseApp from "./firebaseConfig";
import { toast } from "react-toastify";
import { isFoodSellerFromStorage } from "utils/sellerType";

function PrivateRoute({ element }) {
  const token = localStorage.getItem("token");
  return token ? element : <Navigate to="/seller-login" replace />;
}

function SellerTypeRoute({ element, foodOnly }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/seller-login" replace />;

  const isFoodSeller = isFoodSellerFromStorage();
  if (foodOnly && !isFoodSeller) return <Navigate to="/storecat" replace />;
  if (foodOnly === false && isFoodSeller) return <Navigate to="/food-category" replace />;

  return element;
}


function App() {
  const messaging = getMessaging(firebaseApp);

  useEffect(() => {
   const unsubscribe = onMessage(messaging, (payload) => {
  console.log("🔔 Foreground notification received:", payload);

  const title = payload.notification?.title || payload.data?.title || "No Title";
    const body = payload.notification?.body || payload.data?.body || "No Body";

  toast.info(`${title}: ${body}`, {
    position: "top-right",
    autoClose: 5000,
  });
});


    return () => unsubscribe();
  }, [messaging]);



  const { pathname } = useLocation();
  const showSidebar = pathname !== "/seller-login";

  return (
    <>
      {showSidebar && <StoreSidenav />}
      <Routes>
        <Route path="/seller-login" element={<SellerLogin />} />
        <Route path="/dashboard1" element={<PrivateRoute element={<DashBoard />} />} />
        <Route path="/Wallet" element={<PrivateRoute element={<Wallet />} />} />
        <Route path="/storecat" element={<SellerTypeRoute foodOnly={false} element={<StoreCategories />} />} />
        <Route path="/food-category" element={<SellerTypeRoute foodOnly element={<FoodCategory />} />} />
        <Route path="/add-food-category" element={<SellerTypeRoute foodOnly element={<AddStoreFoodCategory />} />} />
        <Route path="/sellerProduct" element={<PrivateRoute element={<SellerProduct />} />} />
        <Route path="/add-seller-product" element={<PrivateRoute element={<AddSellerProduct />}/>} />
        <Route path="/stock" element={<PrivateRoute element={<Stock />}/>} />
        <Route path="/Profile" element={<PrivateRoute element={<Profile />}/>} />
        <Route path="/offers" element={<PrivateRoute element={<CouponManagement />}/>} />
        <Route path="/coupons" element={<PrivateRoute element={<CouponManagement />}/>} />
        <Route path="/addstorecat" element={<SellerTypeRoute foodOnly={false} element={<AddStoreCat />}/>} />
        <Route path="/store-orders" element={<PrivateRoute element={<StoreOrder />}/>} />
        <Route path="/search-products" element={<PrivateRoute element={<SearchProduct />}/>} />
        <Route path="/unapproved-products" element={<PrivateRoute element={<UnapprovedProducts />}/>} />
        <Route path="*" element={<Navigate to="/seller-login" />} />
      </Routes>
    </>
  );
}

export default App;
