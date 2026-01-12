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
  MenuItem,
} from "@mui/material";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import MDBox from "../components/MDBox";
import { useMaterialUIController } from "../context";
import { get, post } from "apis/apiClient";
import { ENDPOINTS } from "apis/endpoints";

/* ================= BUTTON STYLE ================= */
const btnStyle = {
  height: "44px",
  minWidth: "150px",
  backgroundColor: "#1976d2",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 600,
  borderRadius: "6px",
  marginLeft: "16px",
  textTransform: "none",
  boxShadow: "none",
  "&:hover": {
    backgroundColor: "#125ea2",
    boxShadow: "none",
  },
  "&:disabled": {
    backgroundColor: "#b0c4de",
    color: "#ffffff",
  },
};

/* ================= TABLE STYLES ================= */
const customStyles = {
  headCells: {
    style: {
      fontSize: "13px",
      fontWeight: 600,
      backgroundColor: "#f5f7fa",
      color: "#344767",
      paddingTop: "10px",
      paddingBottom: "10px",
    },
  },
  cells: {
    style: {
      fontSize: "13px",
      paddingTop: "10px",
      paddingBottom: "10px",
      alignItems: "center",
    },
  },
  rows: {
    style: {
      minHeight: "48px",
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

  /* ================= FORM ================= */
  const [form, setForm] = useState({
    title: "",
    offer: "",
    limit: "",
    fromDate: "",
    validDays: "",
  });

  /* ================= IMAGES ================= */
  const [images, setImages] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [sliderImage, setSliderImage] = useState(null);
  const [sliderImagePreview, setSliderImagePreview] = useState(null);

  /* ================= EDIT MODAL ================= */
  const [editOpen, setEditOpen] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState(null);
  const [editCoupon, setEditCoupon] = useState(null);

  /* ================= FETCH ================= */
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

  /* ================= IMAGE VALIDATION ================= */
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      if (img.width !== 1280 || img.height !== 540) {
        Swal.fire("Invalid Image", "Image must be 1280 × 540", "error");
        return;
      }

      setImages(file);
      setImagePreview(img.src);
    };
  };

  /* ================= SLIDER IMAGE (512x512) ================= */
  const handleSliderImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      if (img.width !== 512 || img.height !== 512) {
        Swal.fire("Invalid Image", "Slider image must be 512 × 512", "error");
        return;
      }

      setSliderImage(file);
      setSliderImagePreview(img.src);
    };
  };


  /* ================= CREATE ================= */
  const handleCreateCoupon = async () => {
    if (
      !form.title ||
      !form.offer ||
      !form.limit ||
      !form.fromDate ||
      !form.validDays
    ) {
      Swal.fire("Missing Fields", "Fill all fields", "warning");
      return;
    }

    const start = new Date(form.fromDate);
    const expireDate = new Date(start);
    expireDate.setDate(start.getDate() + Number(form.validDays));

    if (expireDate <= new Date()) {
      Swal.fire("Invalid Date", "Expiry must be future", "warning");
      return;
    }

    try {
      setCreating(true);
      const data = new FormData();

      data.append("storeId", storeId);
      data.append("title", form.title);
      data.append("offer", Number(form.offer));
      data.append("limit", Number(form.limit));
      data.append("fromTo", form.fromDate);
      data.append("validDays", form.validDays);
      data.append("expireDate", expireDate.toISOString());

      if (images) {
        data.append("image", images);
      }

      if (sliderImage) {
        data.append("file", sliderImage); // slider (512x512)
      }

      await post(ENDPOINTS.CREATE_COUPON, data);

      Swal.fire("Success", "Coupon created", "success");
      setForm({ title: "", offer: "", limit: "", fromDate: "", validDays: "" });
      setImages(null);
      setImagePreview(null);
      setSliderImage(null);
      setSliderImagePreview(null);
      fetchCoupons();
    } catch {
      Swal.fire("Error", "Server error", "error");
    } finally {
      setCreating(false);
    }
  };

  /* ================= TOGGLE ================= */
  const handleToggleStatus = async (coupon) => {
    if (new Date(coupon.expireDate) <= new Date() && !coupon.status) {
      Swal.fire("Expired", "Cannot activate expired coupon", "warning");
      return;
    }

    await post(`${ENDPOINTS.EDIT_COUPON}/${coupon._id}`, {
      status: !coupon.status,
    });
    fetchCoupons();
  };

  /* ================= EDIT ================= */
  const openEditModal = (coupon) => {
    setEditingCouponId(coupon._id);
    setEditCoupon({
      title: coupon.title,
      offer: coupon.offer,
      limit: coupon.limit,
      fromTo: coupon.fromTo?.split("T")[0],
      validDays: coupon.validDays,
      expireDate: coupon.expireDate?.split("T")[0],
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    await post(`${ENDPOINTS.EDIT_COUPON}/${editingCouponId}`, editCoupon);
    setEditOpen(false);
    fetchCoupons();
  };

  /* ================= TABLE COLUMNS ================= */
  const columns = [
    { name: "Sr", selector: (_, i) => i + 1, width: "60px", center: true },
    { name: "Title", selector: (r) => r.title, grow: 2, wrap: true },
    {
      name: "Offer",
      selector: (r) => `${r.offer}%`,
      width: "90px",
      center: true,
    },
    { name: "Limit", selector: (r) => r.limit, width: "90px", center: true },
    {
      name: "From",
      selector: (r) =>
        r.fromTo ? new Date(r.fromTo).toLocaleDateString() : "-",
      width: "120px",
      center: true,
    },
    {
      name: "Days",
      selector: (r) => r.validDays || "-",
      width: "80px",
      center: true,
    },
    {
      name: "Image",
      width: "110px",
      center: true,
      cell: (r) =>
        r.image ? (
          <img
            src={`${process.env.REACT_APP_IMAGE_LINK}${r.image}`}
            alt=""
            style={{
              width: 72,
              height: 36,
              objectFit: "cover",
              borderRadius: 4,
              border: "1px solid #ddd",
            }}
          />
        ) : (
          "-"
        ),
    },
        {
      name: "Slider Image",
      width: "110px",
      center: true,
      cell: (r) =>
        r.image ? (
          <img
            src={`${process.env.REACT_APP_IMAGE_LINK}${r.sliderImage}`}
            alt=""
            style={{
              width: 72,
              height: 36,
              objectFit: "cover",
              borderRadius: 4,
              border: "1px solid #ddd",
            }}
          />
        ) : (
          "-"
        ),
    },
    {
      name: "Approval",
      width: "110px",
      center: true,
      cell: (row) => {
        let color = "#999";

        if (row.approvalStatus === "approved") color = "#2e7d32";
        if (row.approvalStatus === "rejected") color = "#d32f2f";
        if (row.approvalStatus === "pending") color = "#ed6c02";

        return (
          <span style={{ fontWeight: 600, color }}>{row.approvalStatus}</span>
        );
      },
    },

    {
      name: "Expiry",
      selector: (r) => new Date(r.expireDate).toLocaleDateString(),
      width: "120px",
      center: true,
    },
    {
      name: "Status",
      width: "90px",
      center: true,
      cell: (row) => (
        <Switch checked={row.status} onChange={() => handleToggleStatus(row)} />
      ),
    },
    {
      name: "Action",
      width: "90px",
      center: true,
      cell: (row) => (
        <Button
          size="small"
          disabled={row.approvalStatus === "approved"}
          onClick={() => openEditModal(row)}
        >
          Edit
        </Button>
      ),
    },
  ];

  /* ================= RENDER ================= */
  return (
    <MDBox
      p={2}
      sx={{
        marginLeft: miniSidenav ? "80px" : "260px",
        marginRight: "20px",
      }}
    >
      <h2>Seller Coupon Management</h2>

      {/* CREATE FORM */}
      <Box
        sx={{
          background: "#fff",
          p: 2,
          borderRadius: 2,
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1.5fr 1fr 1.5fr",
          gap: 2,
          alignItems: "center",
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
          type="date"
          label="From Date"
          InputLabelProps={{ shrink: true }}
          value={form.fromDate}
          onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
        />
        <TextField
          select
          label="Valid Days"
          value={form.validDays}
          InputProps={{
            sx: {
              height: 44,
              alignItems: "center",
            },
          }}
          onChange={(e) => setForm({ ...form, validDays: e.target.value })}
        >
          <MenuItem value={1}>1 Day</MenuItem>
          <MenuItem value={3}>3 Days</MenuItem>
          <MenuItem value={7}>7 Days</MenuItem>
        </TextField>
        <Button
          component="label"
          variant="outlined"
          sx={{
            height: "44px",
            borderColor: "#1976d2",
            color: "#1976d2",
            fontWeight: 600,
            textTransform: "none",
            "&:hover": {
              borderColor: "#125ea2",
              backgroundColor: "rgba(25,118,210,0.04)",
            },
          }}
        >
          Upload Images
          <input
            hidden
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
        </Button>

        <Button
          component="label"
          variant="outlined"
          sx={{
            height: "44px",
            borderColor: "#1976d2",
            color: "#1976d2",
            fontWeight: 600,
            textTransform: "none",
            "&:hover": {
              borderColor: "#125ea2",
              backgroundColor: "rgba(25,118,210,0.04)",
            },
          }}
        >
          Upload Slider Image (512×512)
          <input
            hidden
            type="file"
            accept="image/*"
            onChange={handleSliderImageChange}
          />
        </Button>

      </Box>

      <Button
        sx={{ ...btnStyle, mt: 2 }}
        disabled={creating}
        onClick={handleCreateCoupon}
      >
        {creating ? "Creating..." : "Create"}
      </Button>

      {imagePreview && (
        <Box
          sx={{
            mt: 2,
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          {imagePreview && (
            <Box
              sx={{
                width: 128,
                height: 72,
                border: "1px solid #ddd",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              <img
                src={imagePreview}
                alt="preview"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </Box>
          )}
        </Box>
      )}
      {sliderImagePreview && (
        <Box
          sx={{
            width: 72,
            height: 72,
            border: "1px solid #ddd",
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          <img
            src={sliderImagePreview}
            alt="slider-preview"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </Box>
      )}

      {/* TABLE */}
      <Box sx={{ background: "#fff", mt: 3, p: 2, borderRadius: 2 }}>
        <DataTable
          columns={columns}
          data={coupons}
          customStyles={customStyles}
          pagination
          striped
          dense
        />
      </Box>

      {/* EDIT MODAL */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Coupon</DialogTitle>

        <DialogContent
          sx={{
            display: "grid",
            gap: 2,
            mt: 1,
          }}
        >
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

          {/* FROM DATE */}
          <TextField
            type="date"
            label="From Date"
            InputLabelProps={{ shrink: true }}
            value={editCoupon?.fromTo || ""}
            onChange={(e) =>
              setEditCoupon({ ...editCoupon, fromTo: e.target.value })
            }
          />

          {/* VALID DAYS */}
          <TextField
            select
            label="Valid Days"
            value={editCoupon?.validDays || ""}
            InputProps={{
              sx: { height: 44 },
            }}
            onChange={(e) =>
              setEditCoupon({ ...editCoupon, validDays: e.target.value })
            }
          >
            <MenuItem value={1}>1 Day</MenuItem>
            <MenuItem value={3}>3 Days</MenuItem>
            <MenuItem value={7}>7 Days</MenuItem>
          </TextField>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            sx={{ textTransform: "none" }}
            style={{ color: "white" }}
            onClick={handleEditSave}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </MDBox>
  );
}

export default CouponManagement;
