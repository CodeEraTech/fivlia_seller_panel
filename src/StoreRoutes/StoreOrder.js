import React, { useState, useEffect } from "react";
import { Button, Typography, CircularProgress, Modal, Box, FormControl, Select, MenuItem } from "@mui/material";
import io from "socket.io-client";
import DataTable from "react-data-table-component";
import MDBox from "../components/MDBox";
import { useMaterialUIController } from "../context";

const headerContainerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
  padding: "15px",
  background: "#f4f6f8",
  borderRadius: "10px",
};

const inputSearchStyle = {
  padding: "10px 14px",
  borderRadius: 6,
  border: "1px solid #ccc",
  fontSize: 14,
  width: 220,
};

const updateBtnStyle = {
  backgroundColor: "#007bff",
  color: "#fff",
  textTransform: "capitalize",
};

const invoiceButton = {
  padding: "6px 12px", // smaller padding to prevent cut
  minWidth: "80px",    // ensures text fits
  borderRadius: "6px",
  border: "none",
  backgroundColor: "#007bff",
  color: "#fff",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 500,
  transition: "all 0.3s ease",
  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
  textTransform: "none", // keep text normal, not uppercase
};

const modalBoxStyle = {
  background: "white",
  borderRadius: 8,
  p: 2,
  maxWidth: 400,
  mx: "auto",
  mt: "5%",
  boxShadow: 3,
};

const customTableStyles = {
  headCells: {
    style: {
      fontSize: "16px",
      fontWeight: "bold",
      backgroundColor: "#3c95ef",
      color: "white",
      padding: "12px",
    },
  },
  cells: {
    style: {
      fontSize: "14px",
      paddingTop: "16px",
      paddingBottom: "16px",
    },
  },
};

function StoreOrder({ isDashboard = false }) {
  const [controller] = useMaterialUIController();
  const { miniSidenav } = controller;

  const [socket, setSocket] = useState(null);
  const [orders, setOrders] = useState([]);
  const [deliveryStatuses, setDeliveryStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [variants, setVariants] = useState({});

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  // ✅ Fetch orders and statuses
  const STATUS_FLOW = {
    Pending: ["Accepted", "Cancelled"],
    Accepted: ["Going to Pickup", "Cancelled"],
    "Going to Pickup": ["Delivered", "Cancelled"],
    Delivered: [],
    Cancelled: []
  };

  const getAllowedStatuses = (currentStatus) => {
    if (!currentStatus) return [];
    const statusTitle =
      deliveryStatuses.find(
        (s) => s.statusCode === currentStatus || s.statusTitle === currentStatus
      )?.statusTitle || currentStatus;

    return STATUS_FLOW[statusTitle] || [];
  };

useEffect(() => {
  const storeId = localStorage.getItem("sellerId");
  if (!storeId) return;

  const newSocket = io(process.env.REACT_APP_API_URL, {
    transports: ["websocket"],
  });

  // ✅ Join seller room
  newSocket.emit("joinSeller", { storeId: storeId });

  // ✅ Listen for confirmation
  newSocket.on("joinedSellerRoom", (data) => {
    console.log("✅ Joined seller socket:", data);
  });

  // ✅ Listen for new orders
  newSocket.on("storeOrder", (data) => {
    console.log("🟢 New order received via socket:", data);
    // Re-fetch orders
    fetchOrders(); // 👇 we'll define this function
  });

  // ✅ Handle disconnect
  newSocket.on("disconnect", () => {
    console.log("⚪ Seller socket disconnected");
  });

  setSocket(newSocket);

  return () => {
    newSocket.disconnect();
  };
}, []);

const fetchOrders = async () => {
  setLoading(true);
  try {
    const storeId = localStorage.getItem("sellerId");
    if (!storeId) throw new Error("Store ID missing");

    const params = `?storeId=${storeId}&page=${page}&limit=${perPage}&search=${searchTerm}`;
    const [ordersRes, statusesRes] = await Promise.all([
      fetch(`${process.env.REACT_APP_API_URL}/orders${params}`),
      fetch(`${process.env.REACT_APP_API_URL}/getdeliveryStatus`),
    ]);

    const ordersData = await ordersRes.json();
    const statusesData = await statusesRes.json();

    if (!Array.isArray(ordersData.orders)) throw new Error("Invalid orders data");
    if (!Array.isArray(statusesData.Status)) throw new Error("Invalid statuses data");

    const filteredStatuses = statusesData.Status.filter((s) =>
      ["accepted", "cancelled"].includes(s.statusTitle.toLowerCase())
    );

    setOrders(ordersData.orders);
    setTotalRows(ordersData.count || ordersData.orders.length);
    setDeliveryStatuses(filteredStatuses);
    setError("");
  } catch (err) {
    console.error(err);
    setError(err.message || "Error loading data");
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchOrders();
}, [page, perPage, searchTerm]);


  const statusColor = (status) => {
    const map = {
      "100": "#ff9800",
      "101": "#2196f3",
      "102": "#9c27b0",
      "103": "#ff5722",
      "104": "#f44336",
      "105": "#4caf50",
      "106": "#4caf50",
    };
    return map[status] || "#666";
  };

  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "95%",           // slightly wider for small screens
    maxWidth: 700,          // keeps large screen layout
    bgcolor: "background.paper",
    boxShadow: 24,
    borderRadius: 4,
    p: 3,
    maxHeight: "80vh",
    overflowY: "auto",       // vertical scroll
    overflowX: "hidden",     // prevents horizontal scroll
  };

  const tableWrapperStyle = {
    overflowX: "auto",      // scroll horizontally if needed
    marginTop: 8,
  };


 const getStatusInfo = (status) => {
  const info = deliveryStatuses.find(
    (s) => s.statusCode === status || s.statusTitle === status
  );
  return info ? { title: info.statusTitle, image: info.image } : { title: status || "-", image: null };
};



  const truncateText = (text, max = 30) =>
    !text ? "-" : text.length > max ? `${text.slice(0, max)}...` : text;

  const openDetailsModal = (o) => {
    setSelectedOrder(o);
    setDetailsModalOpen(true);
  };
  const openAddressModal = (o) => {
    setSelectedOrder(o);
    setAddressModalOpen(true);
  };
  const openEditModal = (o) => {
    setSelectedOrder(o);
    const info = deliveryStatuses.find(
      (s) => s.statusCode === o.orderStatus || s.statusTitle === o.orderStatus
    );
    setNewStatus(info ? info.statusCode : o.orderStatus || "");
    setEditModalOpen(true);
  };
  const closeModal = () => {
    setDetailsModalOpen(false);
    setAddressModalOpen(false);
    setEditModalOpen(false);
    setSelectedOrder(null);
    setNewStatus("");
  };

  const handleSave = async () => {
    if (!selectedOrder || !newStatus || newStatus === selectedOrder.orderStatus) return;
    try {
      const statusInfo = deliveryStatuses.find((s) => s.statusCode === newStatus);
      const statusTitle = statusInfo?.statusTitle || newStatus;
      const res = await fetch(`${process.env.REACT_APP_API_URL}/orderStatus/${selectedOrder._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusTitle }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const { update } = await res.json();

      setOrders((prev) =>
        prev.map((o) =>
          o._id === selectedOrder._id ? { ...o, orderStatus: update.orderStatus } : o
        )
      );
      closeModal();
    } catch (err) {
      console.error(err);
      setError(err.message || "Error updating status");
    }
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/thermal-invoice/${orderId}`, {
        method: "GET",
      });

      if (!res.ok) throw new Error("Failed to fetch PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `thermal_invoice_${orderId}.pdf`;
      link.click();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading invoice:", err);
    }
  };

  const columns = [
    {
      name: "No.",
      selector: (row, index) => (page - 1) * perPage + index + 1,
      width: "70px",
      center: "true",
    },
    { name: "Order ID", selector: (row) => row.orderId || "-", sortable: true },
    {
      name: "Details",
      cell: (row) => {
        const item = row.items?.[0];
        return item ? (
          <div
            style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
            onClick={() => openDetailsModal(row)}
          >
            <img
              src={`${process.env.REACT_APP_IMAGE_LINK}${item.image}`}
              alt={item.name}
              style={{ width: 40, height: 40, marginRight: 6, objectFit: "cover", borderRadius: 4 }}
            />
            {truncateText(item.name)}
          </div>
        ) : (
          "-"
        );
      },
      grow: 4
    },
    {
      name: "Address",
      cell: (row) => (
        <span style={{ cursor: "pointer" }} onClick={() => openAddressModal(row)}>
          {truncateText(row.addressId?.fullAddress)}
        </span>
      ),
    },
    {
      name: "Payment",
      selector: (row) => row.paymentStatus || "-",
      cell: (row) => (
        <span style={{ color: statusColor(row.paymentStatus) }}>{row.paymentStatus || "-"}</span>
      ),
    },

    {
      name: "Invoice",
      cell: (row) => (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {row.orderStatus?.toLowerCase() === "delivered" || row.orderStatus === "106" ? (
            <Button
              variant="contained"
              style={invoiceButton}
              onClick={() => handleDownloadInvoice(row.orderId)} // use orderId
            >
              Invoice
            </Button>
          ) : (
            <Typography
              variant="body2"
              style={{ color: "#999", fontStyle: "italic" }}
            >
              Not available
            </Typography>
          )}
        </div>
      ),
    },


    {
      name: "Status",
      cell: (row) => {
        const info = getStatusInfo(row.orderStatus);
        return (
          <div style={{ display: "flex", alignItems: "center", color: statusColor(row.orderStatus) }}>
            {info.image && (
              <img
                src={`${process.env.REACT_APP_IMAGE_LINK}${info.image}`}
                alt={info.title}
                style={{ width: 20, height: 20, marginRight: 6, objectFit: "contain", borderRadius: 2 }}
              />
            )}
            {info.title}
          </div>
        );
      },
    },
    {
      name: "Action",
      cell: (row) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="contained" style={updateBtnStyle} onClick={() => openEditModal(row)}>
            Edit
          </Button>
        </div>
      ),
      ignoreRowClick: true,
      allowoverflow: true,
      button: "true",
    },
  ];

  return (
    <>
      <MDBox
        p={2}
        style={{
          marginLeft: isDashboard ? "0px" : miniSidenav ? "100px" : "270px",
          transition: "margin-left 0.3s ease",
          position: "relative",
        }}
      >
        <div style={headerContainerStyle}>
          <div>
            <Typography variant="h5" fontWeight="bold">
              Orders
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              View and manage orders
            </Typography>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <input
              type="text"
              placeholder="Search orders…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              style={inputSearchStyle}
            />
          </div>
        </div>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {loading && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(255,255,255,0.7)",
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 1,
            }}
          >
            <CircularProgress />
          </Box>
        )}
        <div style={{ background: "white", borderRadius: "10px", padding: "10px" }}>
          <DataTable
            columns={columns}
            data={orders}
            customStyles={customTableStyles}
            pagination={true}
            paginationServer={true}
            paginationTotalRows={totalRows}
            paginationPerPage={perPage}
            onChangePage={(page) => setPage(page)}
            onChangeRowsPerPage={(newPerPage, page) => {
              setPerPage(newPerPage);
              setPage(page);
            }}
            noDataComponent={
              <div style={{ padding: 20, textAlign: "center", fontSize: 16 }}>
                No orders found
              </div>
            }
            highlightOnHover
            striped
            responsive
          />
        </div>
      </MDBox>

      <Modal open={detailsModalOpen} onClose={closeModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "98%",
            maxWidth: 950,
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 4,
            p: 3,
            maxHeight: "85vh",
            overflowY: "auto",
          }}
        >
          {selectedOrder && (
            <>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Order Details - {selectedOrder.orderId}
              </Typography>

              <Typography fontSize={14} mb={2}>
                <strong>Status:</strong> {getStatusInfo(selectedOrder.orderStatus).title || "-"}
              </Typography>

              <Box sx={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: 900,
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "2px solid #ddd", background: "#f4f4f4" }}>
                      <th style={{ textAlign: "left", padding: "10px", width: "10%" }}>SKU</th>
                      <th style={{ textAlign: "right", padding: "10px", width: "10%" }}>Price</th>
                      <th style={{ textAlign: "right", padding: "10px", width: "8%" }}>Qty</th>
                      <th style={{ textAlign: "left", padding: "10px", width: "40%" }}>Product</th>
                      <th style={{ textAlign: "left", padding: "10px", width: "12%" }}>Variant</th>
                      <th style={{ textAlign: "right", padding: "10px", width: "10%" }}>Price (Incl. GST)</th>
                      <th style={{ textAlign: "right", padding: "10px", width: "10%" }}>Subtotal</th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedOrder.items.map((item, index) => {
                      const price = item.price || 0;
                      const subtotal = price * (item.quantity || 0);
                      return (
                        <tr key={item._id || index} style={{ borderBottom: "1px solid #eee" }}>
                          <td style={{ padding: "10px", verticalAlign: "middle" }}>{item.sku}</td>
                          <td style={{ padding: "10px", textAlign: "right", verticalAlign: "middle" }}>₹{price}</td>
                          <td style={{ padding: "10px", textAlign: "right", verticalAlign: "middle" }}>{item.quantity}</td>

                          {/* Product Column using CSS Grid */}
                          <td style={{ padding: "10px", verticalAlign: "middle" }}>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "60px 1fr",
                                alignItems: "center",
                                gap: "12px",
                              }}
                            >
                              <img
                                src={`${process.env.REACT_APP_IMAGE_LINK}${item.image}`}
                                alt={item.name}
                                style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }}
                              />
                              <div style={{ wordBreak: "break-word" }}>{item.name}</div>
                            </div>
                          </td>

                          <td style={{ padding: "10px", verticalAlign: "middle" }}>{item.variantName || "-"}</td>
                          <td style={{ padding: "10px", textAlign: "right", verticalAlign: "middle" }}>₹{price}</td>
                          <td style={{ padding: "10px", textAlign: "right", verticalAlign: "middle" }}>₹{subtotal}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Box>

              <Box mt={3} display="flex" justifyContent="flex-end">
                <Button variant="contained" style={{ color: "#f9f9f9ff" }} onClick={closeModal}>
                  Close
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>


      <Modal open={addressModalOpen} onClose={closeModal}>
        <Box sx={{ ...modalBoxStyle, maxWidth: 400 }}>
          <Typography variant="h6" mb={2}>
            Delivery Address
          </Typography>
          <Typography fontSize={14} color="textSecondary">
            {selectedOrder?.addressId?.fullAddress || "No address available"}
          </Typography>
          <Box mt={2}>
            <Button variant="contained" style={{ color: "#ffffffff" }} fullWidth onClick={closeModal}>
              Close
            </Button>
          </Box>
        </Box>
      </Modal>

      <Modal open={editModalOpen} onClose={closeModal}>
        <Box sx={{ ...modalBoxStyle, maxWidth: 400 }}>
          <Typography variant="h6" mb={2}>
            Edit Order Status
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              displayEmpty
              renderValue={(selected) => {
                if (!selected) return <em style={{ color: "#999" }}>Select Status</em>;
                const statusInfo = getStatusInfo(selected);
                return (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {statusInfo.image && (
                      <img
                        src={`${process.env.REACT_APP_IMAGE_LINK}${statusInfo.image}`}
                        alt={statusInfo.title}
                        style={{ width: 20, height: 20 }}
                      />
                    )}
                    <span>{statusInfo.title}</span>
                  </Box>
                );
              }}
            >
              <MenuItem value="" disabled>
                <em>Select Status</em>
              </MenuItem>
              {deliveryStatuses.map((status) => {
                const isAllowed = getAllowedStatuses(selectedOrder?.orderStatus).includes(status.statusTitle);

                let displayTitle = status.statusTitle;
                if (displayTitle.toLowerCase() === "accepted") displayTitle = "Accept";
                if (displayTitle.toLowerCase() === "cancelled") displayTitle = "Cancel";

                return (
                  <MenuItem key={status._id} value={status.statusCode} disabled={!isAllowed}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {status.image && (
                        <img
                          src={`${process.env.REACT_APP_IMAGE_LINK}${status.image}`}
                          alt={displayTitle}
                          style={{ width: 20, height: 20 }}
                        />
                      )}
                      {displayTitle}
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <Box display="flex" gap={2}>
            <Button variant="outlined" style={{color:"#636363ff"}} fullWidth onClick={closeModal}>
              Cancel
            </Button>
            <Button
              variant="contained"
              fullWidth
              style={{color:"white"}}
              disabled={!newStatus || newStatus === selectedOrder?.orderStatus}
              onClick={handleSave}
            >
              Update
            </Button>
          </Box>
        </Box>
      </Modal>

    </>
  );
}

export default StoreOrder;
