import React from "react";
import { useLocation, useNavigate, NavLink } from "react-router-dom";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";
import StoreIcon from "@mui/icons-material/Store";
import SidenavRoot from "components/Sidenav/SidenavRoot";
import SidenavCollapse from "components/Sidenav/SidenavCollapse";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import {
  useMaterialUIController,
  setMiniSidenav,
} from "context";

import StoreRoutes from "route"; // Update this path if needed
import { logoutSeller } from "utils/logoutSeller";

function StoreSidenav() {
  const storeName = localStorage.getItem("storeName") || "Fivlia";
  const [controller, dispatch] = useMaterialUIController();
  const { miniSidenav, transparentSidenav, whiteSidenav, darkMode } = controller;
  const location = useLocation();
  const navigate = useNavigate();
  const closeSidenav = () => setMiniSidenav(dispatch, true);

  const renderRoutes = StoreRoutes.map(({ type, name, key, icon, route }) => {
    const active = location.pathname === route;
    if (type === "collapse") {
      if (key === "logout") {
        return (
          <MDBox key={key} sx={{ cursor: "pointer" }} onClick={async() => {
            if (window.confirm("Are you sure you want to log out?")) {
              try {
                await logoutSeller(); // ✅ calls backend + clears storage + redirects to "/"
              } catch (err) {
                console.error("Logout error:", err);
                localStorage.clear();
                navigate("/storeLogin");
              }
            }
          }}>
            <SidenavCollapse name={name} icon={icon} active={false} />
          </MDBox>
        );
      }

      return (
        <NavLink
          to={route}
          key={key}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <SidenavCollapse name={name} icon={icon} active={active} />
        </NavLink>
      );
    }

    return null;
  });

  return (
    <SidenavRoot
      variant="permanent"
      ownerState={{ transparentSidenav, whiteSidenav, miniSidenav, darkMode }}
      onMouseEnter={() => setMiniSidenav(dispatch, false)}
      onMouseLeave={() => setMiniSidenav(dispatch, false)}
    >
      <MDBox pt={3} pb={1} px={miniSidenav ? 1 : 4} textAlign="center">
        <MDTypography
          variant="h6"
          color="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
          sx={{ gap: 1, fontSize: miniSidenav ? "18px" : "20px" }}
        >
          <StoreIcon fontSize="medium" style={{ color: "white" }} />
          {!miniSidenav && (
            // eslint-disable-next-line jsx-a11y/no-distracting-elements
            <marquee
              behavior="scroll"
              direction="left"
              scrollamount="4"
              style={{ marginLeft: "8px", whiteSpace: "nowrap" }}
            >
              {storeName} Store
            </marquee>
          )}
          {miniSidenav && "Fivlia"}
        </MDTypography>
      </MDBox>

      {/* Divider below branding */}
      <Divider sx={{ backgroundColor: "rgba(255,255,255,0.2)", mx: 2, my: 1 }} />

      {/* Route List */}
      <List>{renderRoutes}</List>
    </SidenavRoot>
  );
}

export default StoreSidenav;
