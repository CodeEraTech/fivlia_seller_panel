import DashboardIcon from "@mui/icons-material/Dashboard";
import CategoryIcon from "@mui/icons-material/Category";
import InventoryIcon from "@mui/icons-material/Inventory";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LogoutIcon from "@mui/icons-material/Logout";
import AssignmentIcon from "@mui/icons-material/Assignment";

import DashBoard from './StoreRoutes/DashBoard';
import StoreCategories from './StoreRoutes/Categories';
import StoreProduct from './StoreRoutes/StoreProduct';
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
    route: "/storeproduct",
    component: <StoreProduct />,
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
