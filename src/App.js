import React,{useEffect} from "react";
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
import { getMessaging, onMessage } from "firebase/messaging";
import firebaseApp from "./firebaseConfig";

function PrivateRoute({ element }) {
  const token = localStorage.getItem("token");
  return token ? element : <Navigate to="/seller-login" replace />;
}


function App() {
  const messaging = getMessaging(firebaseApp);

  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission().then((permission) => {
        console.log("🔔 Notification permission:", permission);
      });
    }
  }, []);

    useEffect(() => {
    // Listen for foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("🔔 Foreground notification received:", payload);

      // You can use alert or a better notification UI here
     if (Notification.permission === "granted") {
  const { title, body } = payload.notification;
  const click_action = payload.data?.click_action;

  const notification = new Notification(title, {
    body,
    icon: "/logo192.png", // optional icon
    data: { click_action }, // needed for click handler
  });

  notification.onclick = (event) => {
  const targetUrl = notification.data?.click_action;
  if (targetUrl) window.open(targetUrl, "_blank");
};
}


      // OR use a toast library like react-toastify for better UX
      // toast.info(`${payload.notification.title}: ${payload.notification.body}`);
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
