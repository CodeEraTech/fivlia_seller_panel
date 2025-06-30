import React, { useState, useEffect } from "react";
import MDBox from "../components/MDBox";
import { useMaterialUIController } from "../context";
import {
  Modal,
  Box,
  Typography,
  Select,
  MenuItem,
  Button,
  FormControl,
} from "@mui/material";

const styles = `
  .order-container {
    width: 100%;
    font-family: 'Urbanist', sans-serif;
  }
  .order-box {
    width: 100%;
    border-radius: 15px;
    padding: 20px;
    background-color: #fff;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 20px;
  }
  .controls-container {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 15px;
  }
  .control-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .control-item label {
    font-size: 16px;
    color: #333;
  }
  .control-item select, .control-item input {
    font-size: 16px;
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #ccc;
    outline: none;
  }
  .search-input {
    border-radius: 20px;
    height: 45px;
    width: 200px;
    padding-left: 15px;
  }
  .table-container {
    overflow-x: auto;
    width: 100%;
  }
  .orders-table {
    width: 100%;
    border-collapse: collapse;
    box-shadow: 0 0 5px rgba(0,0,0,0.1);
    border: 1px solid #007bff;
  }
  .header-cell {
    padding: 14px 12px;
    border: 1px solid #ddd;
    font-size: 18px;
    font-weight: bold;
    background-color: #007bff;
    color: white;
    text-align: left;
  }
  .body-cell {
    padding: 12px;
    border: 1px solid #eee;
    font-size: 17px;
    background-color: #fff;
    text-align: left;
  }
  .truncate-text {
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-block;
  }
  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    flex-wrap: wrap;
    gap: 15px;
  }
  .pagination button {
    padding: 8px 16px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-size: 16px;
  }
  .pagination button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  .error-message {
    color: #d32f2f;
    font-size: 14px;
    margin-top: 5px;
  }
  .edit-button {
    background-color: #007bff;
    color: white;
    font-weight: bold;
    text-transform: capitalize;
  }
  .modal-content {
    background: white;
    border-radius: 8px;
    padding: 16px;
    max-width: 400px;
    margin: 5% auto;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    border: 1px solid #e0e0e0;
  }
  .modal-header {
    font-size: 20px;
    font-weight: 600;
    color: #1a237e;
    margin-bottom: 12px;
  }
  .modal-button {
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  .modal-button:hover {
    transform: translateY(-1px);
  }
  .status-select {
    border-radius: 6px;
    background: #f8f9fa;
    border: 1px solid #007bff;
  }
  .status-select .MuiSelect-select {
    padding: 10px 14px;
    font-size: 16px;
    color: #344767;
  }
  .status-select .MuiOutlinedInput-notchedOutline {
    border: none;
  }
  @media (max-width: 768px) {
    .controls-container {
      flex-direction: column;
      align-items: flex-start;
    }
    .control-item {
      width: 100%;
    }
    .control-item select, .control-item input {
      width: 100%;
      box-sizing: border-box;
    }
    .modal-content {
      width: 90%;
      margin: 10% auto;
    }
  }
`;

function StoreOrder() {
  const [controller] = useMaterialUIController();
  const { miniSidenav } = controller;
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [entriesToShow, setEntriesToShow] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const storeId = localStorage.getItem("storeId");
        if (!storeId) {
          alert("Store ID missing");
          return setError("Store ID missing");
        }

        const res = await fetch(`https://fivlia.onrender.com/orders?storeId=${storeId}`);
        const data = await res.json();
        if (data.orders && Array.isArray(data.orders)) {
          setOrders(data.orders);
          setError("");
        } else {
          alert("Invalid orders data");
          setError("Invalid orders data");
        }
        setCurrentPage(1);
      } catch (err) {
        console.error("Error loading orders:", err);
        alert("Failed to load orders");
        setError("Failed to load orders");
      }
    };

    const fetchDrivers = async () => {
      try {
        const res = await fetch("https://fivlia.onrender.com/getDriver");
        const data = await res.json();
        if (data.Driver && Array.isArray(data.Driver)) {
          setDrivers(data.Driver);
        } else {
          alert("Invalid drivers data");
          setDrivers([]);
        }
      } catch (err) {
        console.error("Error fetching drivers:", err);
        alert("Failed to fetch drivers");
      }
    };

    fetchOrders();
    fetchDrivers();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const search = searchTerm.toLowerCase();
    return (
      order._id?.toLowerCase().includes(search) ||
      (order.addressId?.fullAddress?.toLowerCase().includes(search) || "") ||
      (order.orderStatus?.toLowerCase().includes(search) || "") ||
      (order.paymentStatus?.toLowerCase().includes(search) || "")
    );
  });

  const totalPages = Math.ceil(filteredOrders.length / entriesToShow);
  const startIndex = (currentPage - 1) * entriesToShow;
  const currentOrders = filteredOrders.slice(startIndex, startIndex + entriesToShow);

  const statusColor = (status) => {
    if (!status) return "#999";
    switch (status.toLowerCase()) {
      case "successful":
        return "green";
      case "pending":
        return "orange";
      case "failed":
        return "red";
      default:
        return "#666";
    }
  };

  const truncateText = (text, maxLength = 30) => {
    if (!text) return "-";
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  const openDetailsModal = (order) => {
    setSelectedOrder(order);
    setDetailsModalOpen(true);
  };

  const openAddressModal = (order) => {
    setSelectedOrder(order);
    setAddressModalOpen(true);
  };

  const openEditModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus || "");
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
    if (!selectedOrder || !newStatus) return;

    try {
      const res = await fetch(`https://fivlia.onrender.com/orderStatus/${selectedOrder._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedOrders = orders.map((order) =>
          order._id === selectedOrder._id
            ? { ...order, orderStatus: data.update.orderStatus }
            : order
        );
        setOrders(updatedOrders);
        closeModal();
      } else {
        alert("Failed to update status");
        setError("Failed to update order status");
      }
    } catch (err) {
      console.error("Error updating order status:", err);
      alert("Error updating status");
      setError("Error updating order status");
    }
  };

  return (
    <>
      <style>{styles}</style>
      <MDBox
        p={2}
        style={{ marginLeft: miniSidenav ? "80px" : "250px", transition: "margin-left 0.3s ease" }}
      >
        <div className="order-container">
          <div className="order-box">
            <div className="header">
              <div>
                <span style={{ fontWeight: "bold", fontSize: 26 }}>Orders</span>
                <br />
                <span style={{ fontSize: 16 }}>View and manage orders</span>
              </div>
            </div>

            <div className="controls-container">
              <div className="control-item">
                <label>Entries</label>
                <select
                  value={entriesToShow}
                  onChange={(e) => setEntriesToShow(Number(e.target.value))}
                >
                  {[5, 10, 20].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="control-item">
                <label>Search</label>
                <input
                  className="search-input"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th className="header-cell">No.</th>
                    <th className="header-cell">Order ID</th>
                    <th className="header-cell">Details</th>
                    <th className="header-cell">Address</th>
                    <th className="header-cell">Payment</th>
                    <th className="header-cell">Status</th>
                    <th className="header-cell">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrders.length > 0 ? (
                    currentOrders.map((order, index) => {
                      const item = order.items?.[0];
                      return (
                        <tr key={order._id}>
                          <td className="body-cell">{startIndex + index + 1}</td>
                          <td className="body-cell">{order._id || "-"}</td>
                          <td
                            className="body-cell"
                            onClick={() => openDetailsModal(order)}
                            style={{ cursor: "pointer" }}
                          >
                            {item ? (
                              <>
                                <img
                                  src={item.image || ""}
                                  alt={item.name || "Item"}
                                  style={{
                                    width: 40,
                                    height: 40,
                                    marginRight: 6,
                                    verticalAlign: "middle",
                                    objectFit: "cover",
                                  }}
                                />
                                <span className="truncate-text">{truncateText(item.name)}</span>
                              </>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td
                            className="body-cell"
                            onClick={() => openAddressModal(order)}
                            style={{ cursor: "pointer" }}
                          >
                            <span className="truncate-text">{truncateText(order.addressId?.fullAddress)}</span>
                          </td>
                          <td
                            className="body-cell"
                            style={{ color: statusColor(order.paymentStatus) }}
                          >
                            {order.paymentStatus || "-"}
                          </td>
                          <td
                            className="body-cell"
                            style={{ color: statusColor(order.orderStatus) }}
                          >
                            {order.orderStatus || "-"}
                          </td>
                          <td
                            className="body-cell"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              className="edit-button"
                              onClick={() => openEditModal(order)}
                            >
                              Edit
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        className="body-cell"
                        style={{ textAlign: "center" }}
                      >
                        No orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <span>
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + entriesToShow, filteredOrders.length)} of{" "}
                {filteredOrders.length} orders
              </span>
              <div>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </MDBox>

      <Modal open={detailsModalOpen} onClose={closeModal}>
        <Box className="modal-content">
          <Typography className="modal-header">Order Details</Typography>
          {selectedOrder?.items?.length > 0 ? (
            selectedOrder.items.map((item, i) => (
              <Box
                key={i}
                display="flex"
                alignItems="center"
                mb={1}
              >
                <img
                  src={item.image || ""}
                  alt={item.name || "Item"}
                  style={{
                    width: 50,
                    height: 50,
                    marginRight: 12,
                    objectFit: "cover",
                    borderRadius: 4,
                  }}
                />
                <Typography sx={{ fontSize: '14px', color: '#344767' }}>
                  {item.name}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography sx={{ color: '#666' }}>No items available</Typography>
          )}
          <Box mt={2}>
            <Button
              className="modal-button"
              variant="contained"
              onClick={closeModal}
              sx={{
                background: '#007bff',
                color: 'white',
                width: '100%',
                '&:hover': { background: '#0056b3' }
              }}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Modal>

      <Modal open={addressModalOpen} onClose={closeModal}>
        <Box className="modal-content">
          <Typography className="modal-header">Delivery Address</Typography>
          <Typography sx={{ fontSize: '14px', color: '#344767' }}>
            {selectedOrder?.addressId?.fullAddress || "No address available"}
          </Typography>
          <Box mt={2}>
            <Button
              className="modal-button"
              variant="contained"
              onClick={closeModal}
              sx={{
                background: '#007bff',
                color: 'white',
                width: '100%',
                '&:hover': { background: '#0056b3' }
              }}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Modal>

      <Modal open={editModalOpen} onClose={closeModal}>
        <Box className="modal-content">
          <Typography className="modal-header">Edit Order Status</Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Select
              className="status-select"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              displayEmpty
              renderValue={(selected) => {
                if (!selected) {
                  return <em style={{ color: '#999' }}>Select Status</em>;
                }
                return selected;
              }}
            >
              <MenuItem value="" disabled>
                <em>Select Status</em>
              </MenuItem>
              <MenuItem value="Accepted">Accepted</MenuItem>
              <MenuItem value="Picked">Picked</MenuItem>
              <MenuItem value="On the Way">On the Way</MenuItem>
              <MenuItem value="Delivered">Delivered</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>

          <Box display="flex" justifyContent="space-between" gap={2}>
            <Button
              className="modal-button"
              variant="outlined"
              onClick={closeModal}
              sx={{ borderColor: '#007bff', color: '#007bff', '&:hover': { background: '#e6f0ff' } }}
            >
              Cancel
            </Button>
            <Button
              className="modal-button"
              variant="contained"
              onClick={handleSave}
              disabled={!newStatus}
              sx={{
                background: '#007bff',
                color: 'white',
                '&:hover': { background: '#0056b3' },
                '&:disabled': { background: '#ccc', color: '#666' }
              }}
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