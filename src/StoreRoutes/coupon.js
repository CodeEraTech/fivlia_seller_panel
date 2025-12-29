import React, { useEffect, useState } from "react";
import {
  Button,
  Box,
  TextField,
  CircularProgress,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import MDBox from "../components/MDBox";
import { useMaterialUIController } from "../context";
import { get, post } from "apis/apiClient";
import { ENDPOINTS } from "apis/endpoints";

// 🔵 Button style
const btnStyle = {
  backgroundColor: "#1976d2",
  color: "white",
  border: "none",
  padding: "8px 16px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
};

// 🔵 DataTable styles
const customStyles = {
  headCells: {
    style: {
      fontSize: "14px",
      fontWeight: "bold",
      backgroundColor: "#3c95ef",
      color: "white",
    },
  },
  cells: {
    style: {
      fontSize: "14px",
      paddingTop: "14px",
      paddingBottom: "14px",
    },
  },
};

function CouponManagement() {
  const [controller] = useMaterialUIController();
  const { miniSidenav } = controller;

  const storeId = localStorage.getItem("sellerId");

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // create form
  const [form, setForm] = useState({
    title: "",
    offer: "",
    limit: "",
    expireDate: "",
  });

  // edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState(null);
  const [editCoupon, setEditCoupon] = useState(null);

  // 🧠 Fetch coupons
  const fetchCoupons = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await get(`${ENDPOINTS.GET_COUPONS}/${storeId}`);
      setCoupons(res.data.coupons || []);
    } catch (err) {
      console.error(err);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [storeId]);

  // 🧨 Create coupon
  const handleCreateCoupon = async () => {
    if (!form.title || !form.offer || !form.limit || !form.expireDate) {
      Swal.fire("Missing Fields", "Fill all fields", "warning");
      return;
    }

    if (Number(form.offer) <= 0 || Number(form.offer) > 100) {
      Swal.fire("Invalid Offer", "Offer must be 1–100%", "warning");
      return;
    }

    if (Number(form.limit) <= 0) {
      Swal.fire("Invalid Limit", "Limit must be > 0", "warning");
      return;
    }

    if (new Date(form.expireDate) <= new Date()) {
      Swal.fire("Invalid Date", "Expiry must be future", "warning");
      return;
    }

    try {
      setCreating(true);
      await post(ENDPOINTS.CREATE_COUPON, {
        storeId,
        title: form.title,
        offer: Number(form.offer),
        limit: Number(form.limit),
        expireDate: form.expireDate,
      });

      Swal.fire("Success", "Coupon created", "success");
      setForm({ title: "", offer: "", limit: "", expireDate: "" });
      fetchCoupons();
    } catch (err) {
      Swal.fire("Error", "Server error", "error");
    } finally {
      setCreating(false);
    }
  };

  // 🔁 Toggle status
  const handleToggleStatus = async (coupon) => {
    if (new Date(coupon.expireDate) <= new Date() && !coupon.status) {
      Swal.fire("Expired", "Cannot activate expired coupon", "warning");
      return;
    }

    try {
      await post(`${ENDPOINTS.EDIT_COUPON}/${coupon._id}`, {
        status: !coupon.status,
      });

      fetchCoupons();
    } catch (err) {
      Swal.fire("Error", "Failed to update status", "error");
    }
  };

  // ✏️ Open edit modal
  const openEditModal = (coupon) => {
    setEditingCouponId(coupon._id); // ID kept separately

    setEditCoupon({
      title: coupon.title,
      offer: coupon.offer,
      limit: coupon.limit,
      expireDate: coupon.expireDate?.split("T")[0],
    });
    setEditOpen(true);
  };

  // 💾 Save edit
  const handleEditSave = async () => {
    try {
      await post(`${ENDPOINTS.EDIT_COUPON}/${editingCouponId}`, editCoupon);

      Swal.fire("Updated", "Coupon updated", "success");
      setEditOpen(false);
      fetchCoupons();
    } catch (err) {
      setEditOpen(false);
      Swal.fire("Error", "Update failed", "error");
    }
  };

  // 🧱 Table columns
  const columns = [
    {
      name: "Sr",
      selector: (_, i) => i + 1,
      width: "70px",
      center: true,
    },
    { name: "Title", selector: (r) => r.title, grow: 2 },
    { name: "Offer", selector: (r) => `${r.offer}%`, center: true },
    { name: "Limit", selector: (r) => r.limit, center: true },
    {
      name: "Expiry",
      selector: (r) => new Date(r.expireDate).toLocaleDateString(),
      center: true,
    },
    {
      name: "Status",
      center: true,
      cell: (row) => (
        <Switch
          checked={row.status}
          onChange={() => handleToggleStatus(row)}
          disabled={new Date(row.expireDate) <= new Date() && !row.status}
        />
      ),
    },
    {
      name: "Action",
      center: true,
      cell: (row) => (
        <Button size="small" onClick={() => openEditModal(row)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <MDBox
      p={2}
      style={{
        marginLeft: miniSidenav ? "100px" : "270px",
        transition: "0.3s",
      }}
    >
      {/* Header */}
      <div style={{ padding: 15, background: "#f4f6f8", borderRadius: 10 }}>
        <h2>Seller Coupon Management</h2>
        <span>Create, edit & toggle coupons</span>
      </div>

      {/* Create */}
      <div
        style={{
          background: "white",
          padding: 20,
          borderRadius: 10,
          margin: "20px 0",
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 15,
        }}
      >
        <TextField
          label="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <TextField
          label="Offer (%)"
          type="number"
          value={form.offer}
          onChange={(e) => setForm({ ...form, offer: e.target.value })}
        />
        <TextField
          label="Limit"
          type="number"
          value={form.limit}
          onChange={(e) => setForm({ ...form, limit: e.target.value })}
        />
        <TextField
          label="Expiry"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={form.expireDate}
          onChange={(e) => setForm({ ...form, expireDate: e.target.value })}
        />
        <Button
          style={btnStyle}
          disabled={creating}
          onClick={handleCreateCoupon}
        >
          {creating ? "Creating..." : "Create"}
        </Button>
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 10, padding: 10 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataTable
            columns={columns}
            data={coupons}
            customStyles={customStyles}
            pagination
            striped
            highlightOnHover
          />
        )}
      </div>

      {/* Edit Modal */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Coupon</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, mt: 1 }}>
          <TextField
            label="Title"
            value={editCoupon?.title || ""}
            onChange={(e) =>
              setEditCoupon({ ...editCoupon, title: e.target.value })
            }
          />
          <TextField
            label="Offer (%)"
            type="number"
            value={editCoupon?.offer || ""}
            onChange={(e) =>
              setEditCoupon({ ...editCoupon, offer: e.target.value })
            }
          />
          <TextField
            label="Limit"
            type="number"
            value={editCoupon?.limit || ""}
            onChange={(e) =>
              setEditCoupon({ ...editCoupon, limit: e.target.value })
            }
          />
          <TextField
            label="Expiry"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={editCoupon?.expireDate || ""}
            onChange={(e) =>
              setEditCoupon({ ...editCoupon, expireDate: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </MDBox>
  );
}

export default CouponManagement;
