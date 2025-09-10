import React, { useEffect, useState } from "react";
import {
  Button, Switch, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, CircularProgress, Box, MenuItem, FormControl, Select, InputLabel
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import MDBox from "../components/MDBox";
import { useMaterialUIController } from "../context";
import { get, put } from "apis/apiClient";
import { ENDPOINTS } from "apis/endpoints";

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
      paddingTop: "16px",
      paddingBottom: "16px",
    },
  },
};

function StockManagement() {
  const navigate = useNavigate();
  const [controller] = useMaterialUIController();
  const { miniSidenav } = controller;

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [editCommission, setEditCommission] = useState(0);

  const [openEdit, setOpenEdit] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [editValues, setEditValues] = useState({ stock: "", sell_price: "", mrp: "" });

  useEffect(() => {
    const id = localStorage.getItem("sellerId");
    if (!id) return navigate("/login");
    setStoreId(id);
  }, [navigate]);

  useEffect(() => {
    if (!storeId) return;
    get(`${ENDPOINTS.GET_CATEGORY_LIST}/${storeId}`)
      .then((res) => setCategories(res.data.categories || []))
      .catch((err) => console.error("Failed to fetch categories", err));
  }, [storeId]);

  useEffect(() => {
    if (!storeId) return;
    setLoading(true);

    const params = new URLSearchParams({
      sellerId: storeId,
      page: currentPage,
      limit: perPage,
      search: searchText,
      category: categoryFilter,
    });

    get(`${ENDPOINTS.GET_SELLER_PRODUCTS}?${params.toString()}`)
      .then((res) => {
        setProducts(res.data.products || []);
        setTotalRows(res.data.totalCount || 0);
      })
      .catch((err) => console.error("Fetch Products failed", err))
      .finally(() => setLoading(false));
  }, [storeId, currentPage, perPage, searchText, categoryFilter]);

  const handleEditClick = (row) => {
    setEditProduct(row);
    setEditCommission(row.commission || 0);
    setEditValues({
      stock: row.stock || "",
      sell_price: row.sell_price || "",
      mrp: row.mrp || "",
      productId: row.productId,
    });
    setOpenEdit(true);
  };

  const handleEditChange = (field, value) => {
    setEditValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculateEarning = () => {
    const price = parseFloat(editValues.sell_price || 0);
    const commissionAmount = (price * editCommission) / 100;
    return (price - commissionAmount).toFixed(2);
  };

  const handleEditSave = async () => {
    try {
      const res = await put(`${ENDPOINTS.UPDATE_SELLER_PRODUCT_STOCK}/${storeId}`, editValues);
      setProducts((prev) =>
        prev.map((p) =>
          p.productId === editProduct.productId ? { ...p, ...editValues } : p
        )
      );
      if (res.status === 200) {
        alert("Product updated successfully");
      } else {
        alert(res.data?.message || "Failed to update product");
      }
      setOpenEdit(false);
    } catch (err) {
      console.error("Failed to update product", err);
    }
  };

  const columns = [
    {
      name: "Sr No",
      selector: (_, i) => (currentPage - 1) * perPage + i + 1,
      width: "90px",
      center: "true",
    },
    {
      name: "Image",
      cell: (row) => (
        <img
          src={`${process.env.REACT_APP_IMAGE_LINK}${row.productThumbnailUrl}`}
          alt={row.productName}
          style={{ width: 50, height: 50, borderRadius: 6, objectFit: "cover" }}
        />
      ),
      width: "90px",
      center: "true",
    },
    { name: "Product Name", selector: (row) => row.productName, sortable: true },
    { name: "MRP", selector: (row) => row.mrp ?? "N/A" },
    { name: "Selling Price", selector: (row) => row.sell_price ?? "N/A" },
    { name: "Commission", selector: (row) => `${row.commission}%` ?? "N/A" },
    { name: "Stock", selector: (row) => row.stock ?? "N/A" },
    {
      name: "Actions",
      cell: (row) => (
        <IconButton color="primary" onClick={() => handleEditClick(row)}>
          <EditIcon />
        </IconButton>
      ),
      width: "100px",
      center: "true",
    },
  ];

  return (
    <MDBox
      p={2}
      style={{
        marginLeft: miniSidenav ? "100px" : "270px",
        transition: "margin-left 0.3s ease",
        position: "relative",
      }}
    >
      {/* Header & Filters */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          padding: "10px",
          background: "#f4f6f8",
          borderRadius: "10px",
        }}
      >
        <div>
          <span style={{ fontWeight: "bold", fontSize: 26 }}>Stock List</span>
          <br />
          <span style={{ fontSize: 17 }}>Manage your Stock</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <FormControl variant="outlined" size="small">
            <InputLabel>Category</InputLabel>
            <Select
              label="Category"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: 180, height: 38 }}
            >
              <MenuItem value="">All</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat._id} value={cat._id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ position: "relative" }}>
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
        <div
          style={{
            background: "white",
            borderRadius: "10px",
            padding: "10px",
          }}
        >
          <DataTable
            columns={columns}
            data={products}
            customStyles={customStyles}
            pagination
            paginationServer
            paginationTotalRows={totalRows}
            paginationPerPage={perPage}
            onChangePage={(page) => setCurrentPage(page)}
            onChangeRowsPerPage={(newPerPage) => {
              setPerPage(newPerPage);
              setCurrentPage(1);
            }}
            highlightOnHover
            striped
            responsive
            noDataComponent={
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  fontSize: "16px",
                }}
              >
                No Products Found
              </div>
            }
          />
        </div>
      </div>

      {/* Edit Dialog with X Close Icon */}
      <Dialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Edit Product
          <IconButton onClick={() => setOpenEdit(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Stock"
            type="number"
            fullWidth
            margin="dense"
            value={editValues.stock}
            onChange={(e) => handleEditChange("stock", e.target.value)}
          />
          <TextField
            label="MRP"
            type="number"
            fullWidth
            margin="dense"
            value={editValues.mrp}
            onChange={(e) => handleEditChange("mrp", e.target.value)}
          />
          <TextField
            label="Selling Price"
            type="number"
            fullWidth
            margin="dense"
            value={editValues.sell_price}
            onChange={(e) => handleEditChange("sell_price", e.target.value)}
            helperText={
              editValues.sell_price
                ? `You will get ₹${calculateEarning()} after ${editCommission}% commission`
                : ""
            }
            sx={{
              "& .MuiFormHelperText-root": {
                fontWeight: "bold",
                color: "#2e7d32",
                fontSize: "14px",
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button variant="contained" color="primary" style={{ color: "white" }} onClick={handleEditSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </MDBox>
  );
}

export default StockManagement;