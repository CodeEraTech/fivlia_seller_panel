import React, { useEffect, useState } from "react";
import MDBox from "components/MDBox";
import { useMaterialUIController } from "../context";
import {
  Button,
  Chip,
  Popper,
  Paper,
  ClickAwayListener,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useNavigate } from "react-router-dom";

const headerCell = {
  padding: "14px 12px",
  border: "1px solid #ddd",
  fontSize: 18,
  fontWeight: "bold",
  backgroundColor: "#007bff",
  color: "white",
};

const bodyCell = {
  padding: "12px",
  border: "1px solid #eee",
  fontSize: 17,
  backgroundColor: "#fff",
};

function StoreTabel() {
  const [controller] = useMaterialUIController();
  const { miniSidenav } = controller;
  const [stores, setStores] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedZones, setSelectedZones] = useState([]);
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [actionStore, setActionStore] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getAllStores = async () => {
      try {
        const result = await fetch("https://api.fivlia.in/getStore");
        if (result.status === 200) {
          const res = await result.json();
          setStores(res.stores);
        } else {
          console.log("Something went wrong");
        }
      } catch (err) {
        console.log(err);
      }
    };
    getAllStores();
  }, []);

  // handle popper open/close for zones
  const handleZonesClick = (event, zones) => {
    if (anchorEl && anchorEl === event.currentTarget) {
      setAnchorEl(null);
      setSelectedZones([]);
    } else {
      setAnchorEl(event.currentTarget);
      setSelectedZones(zones);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedZones([]);
  };

  const open = Boolean(anchorEl);

  // handle 3-dot action menu open/close
  const handleActionClick = (event, store) => {
    setActionAnchorEl(event.currentTarget);
    setActionStore(store);
  };

  const handleActionClose = () => {
    setActionAnchorEl(null);
    setActionStore(null);
  };

  const openActionMenu = Boolean(actionAnchorEl);

  return (
    <MDBox
      p={2}
      style={{
        marginLeft: miniSidenav ? "80px" : "250px",
        transition: "margin-left 0.3s ease",
      }}
    >
      <div className="city-container">
        <div
          className="add-city-box"
          style={{
            width: "100%",
            borderRadius: 15,
            padding: 20,
            overflowX: "auto",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
              flexWrap: "wrap",
            }}
          >
            <div>
              <span style={{ fontWeight: "bold", fontSize: 26 }}>Store List</span>
              <br />
              <span style={{ fontSize: 17 }}>View and manage all stores</span>
            </div>

            <div>
              <Button
                style={{
                  backgroundColor: "#00c853",
                  height: 45,
                  width: 160,
                  fontSize: 12,
                  color: "white",
                  letterSpacing: "1px",
                }}
                onClick={() => navigate("/create-store")}
              >
                + Create Store
              </Button>
            </div>
          </div>

          {/* Table */}
          <div style={{ width: "100%", overflowX: "auto", maxWidth: "100%" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: 0,
                overflow: "hidden",
                boxShadow: "0 0 10px rgba(0,0,0,0.1)",
              }}
            >
              <thead>
                <tr>
                  <th style={headerCell}>Sr. No</th>
                  <th style={headerCell}>Store Name</th>
                  <th style={headerCell}>Owner Info</th>
                  <th style={headerCell}>City</th>
                  <th style={headerCell}>Zone(s)</th>
                  <th style={{ ...headerCell, width: "100px", textAlign: "center" }}>Products</th>
                  <th style={{ ...headerCell, textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((store, index) => (
                  <tr key={store._id}>
                    <td style={{ ...bodyCell, textAlign: "center" }}>{index + 1}</td>

                    <td style={bodyCell}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {store.image ? (
                          <img
                            src={store.image}
                            alt="store"
                            style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 60,
                              height: 60,
                              borderRadius: 8,
                              backgroundColor: "#ccc",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#555",
                              fontSize: 12,
                            }}
                          >
                            No Image
                          </div>
                        )}
                        <span style={{marginLeft:'30px'}}>{store.storeName}</span>
                      </div>
                    </td>

                    <td style={bodyCell}>
                      <div>
                        <strong>{store.ownerName || "N/A"}</strong>
                        <br />
                      </div>
                    </td>

                    <td style={bodyCell}>{store.city?.name || "N/A"}</td>

                    <td style={{ ...bodyCell, width: 140 }}>
                      {store.zone && store.zone.length > 0 ? (
                        <>
                          {store.zone.slice(0, 2).map((z) => (
                            <Chip
                              key={z._id}
                              label={z.title}
                              size="small"
                              style={{ marginRight: 4, marginBottom: 4 }}
                            />
                          ))}

                          {store.zone.length > 2 && (
                            <Button
                              size="small"
                              style={{ minWidth: 30, padding: "0 8px", textTransform: "none" }}
                              onClick={(e) => handleZonesClick(e, store.zone)}
                            >
                              +{store.zone.length - 2} more
                            </Button>
                          )}

                          <Popper
                            open={open && selectedZones === store.zone}
                            anchorEl={anchorEl}
                            placement="bottom-start"
                            style={{ zIndex: 1500 }}
                          >
                            <ClickAwayListener onClickAway={handleClose}>
                              <Paper style={{ padding: 10, maxWidth: 250 }}>
                                {selectedZones.map((z) => (
                                  <Chip
                                    key={z._id}
                                    label={z.title}
                                    size="small"
                                    style={{ margin: 2 }}
                                  />
                                ))}
                              </Paper>
                            </ClickAwayListener>
                          </Popper>
                        </>
                      ) : (
                        "N/A"
                      )}
                    </td>

                    <td style={bodyCell}>{store.Category?.length || 0}</td>

                    {/* Action cell with 3-dot menu */}
                    <td style={{ ...bodyCell, width: 150, textAlign: "center" }}>
                      <IconButton onClick={(e) => handleActionClick(e, store)} size="small">
                        <MoreVertIcon />
                      </IconButton>

                      <Menu
                        anchorEl={actionAnchorEl}
                        open={openActionMenu && actionStore?._id === store._id}
                        onClose={handleActionClose}
                        anchorOrigin={{
                          vertical: "bottom",
                          horizontal: "right",
                        }}
                        transformOrigin={{
                          vertical: "top",
                          horizontal: "right",
                        }}
                      >
                        <MenuItem
                          onClick={() => {
                            handleActionClose();
                            navigate("/edit-store", { state: { store } });
                          }}
                        >
                          Edit
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            handleActionClose();
                            navigate('/store-login',{state:store._id})
                          }}
                        >
                          Login
                        </MenuItem>
                      </Menu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MDBox>
  );
}

export default StoreTabel;
