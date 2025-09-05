import DashboardIcon from "@mui/icons-material/Dashboard";
import WalletIcon from "@mui/icons-material/Wallet";
import CategoryIcon from "@mui/icons-material/Category";
import InventoryIcon from "@mui/icons-material/Inventory";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LogoutIcon from "@mui/icons-material/Logout";
import AssignmentIcon from "@mui/icons-material/Assignment";
import Wallet from "./StoreRoutes/SellerWallet"
import DashBoard from './StoreRoutes/DashBoard';
import StoreCategories from './StoreRoutes/Categories';
import SellerProduct from './StoreRoutes/SellerProduct';
import Stock from './StoreRoutes/Stock';
import StoreOrder from './StoreRoutes/StoreOrder';

const StoreRoutes = [
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard1",
    icon: <DashboardIcon />,
    route: "/dashboard1",
    component: <DashBoard />,
  },
    {
    type: "collapse",
    name: "Wallet",
    key: "Wallet",
    icon: <WalletIcon />,
    route: "/Wallet",
    component: <Wallet />,
  },
  {
    type: "collapse",
    name: "Categories",
    key: "categories",
    icon: <CategoryIcon />,
    route: "/storecat",
    component: <StoreCategories />,
  },
  {
    type: "collapse",
    name: "Products",
    key: "products",
    icon: <InventoryIcon />,
    route: "/sellerProduct",
    component: <SellerProduct />,
  },
  {
    type: "collapse",
    name: "Stock",
    key: "stock",
    icon: <AssignmentIcon />,
    route: "/stock",
    component: <Stock />,
  },
  {
    type: "collapse",
    name: "Orders",
    key: "orders",
    icon: <ShoppingCartIcon />,
    route: "/store-orders",
    component: <StoreOrder />,
  },
  {
    type: "collapse",
    name: "Log-Out",
    key: "logout",
    icon: <LogoutIcon />,
    route: "#",
  },
];

export default StoreRoutes;
