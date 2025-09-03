import React, { useEffect, useState } from "react";
import {
  Button, Switch, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, CircularProgress, Box, MenuItem, FormControl, Select, InputLabel
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import MDBox from "../components/MDBox";
import { useMaterialUIController } from "../context";
import { get } from "apis/apiClient";  // Assuming a common GET helper
import { ENDPOINTS } from "apis/endpoints";

// Button style and table styles same as used earlier
const btnStyle = {
  backgroundColor: "#00c853",
  color: "white",
  padding: "8px 16px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: 500,
};

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

function SellerProduct() {
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

  // Edit modal state
  const [openEdit, setOpenEdit] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [editValues, setEditValues] = useState({ stock: "", sell_price: "", mrp: "" });

  useEffect(() => {
    const id = localStorage.getItem("sellerId");
    if (!id) return navigate("/login");
    setStoreId(id);
  }, [navigate]);

  // Fetch categories for filter dropdown
  useEffect(() => {
    if (!storeId) return;
    get(`${ENDPOINTS.GET_CATEGORY_LIST}/${storeId}`)
      .then((res) => setCategories(res.data.categories || []))
      .catch((err) => console.error("Failed to fetch categories", err));
  }, [storeId]);

  // Fetch products per filters and pagination
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
        setTotalRows(res.data.products || []);
      })
      .catch((err) => console.error("Fetch Products failed", err))
      .finally(() => setLoading(false));
  }, [storeId, currentPage, perPage, searchText, categoryFilter]);

  const handleStatusToggle = async (row) => {
    await fetch(`https://api.fivlia.in/updateProductStatus/${row._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: !row.status }),
    });
    setProducts((prev) =>
      prev.map((p) => (p._id === row._id ? { ...p, status: !p.status } : p))
    );
  };

  const handleEditClick = (row) => {
    setEditProduct(row);
    setEditValues({
      stock: row.stock || "",
      sell_price: row.variants?.[0]?.sell_price || "",
      mrp: row.variants?.[0]?.mrp || "",
    });
    setOpenEdit(true);
  };

  const handleEditSave = async () => {
    await fetch(`https://api.fivlia.in/updateProduct/${editProduct._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editValues),
    });
    setProducts((prev) =>
      prev.map((p) => (p._id === editProduct._id ? { ...p, ...editValues } : p))
    );
    setOpenEdit(false);
  };

  const columns = [
    { name: "Sr No", selector: (_, i) => (currentPage - 1) * perPage + i + 1, width: "90px", center: true },
    { name: "Image", cell: (row) => <img src={`${process.env.REACT_APP_IMAGE_LINK}${row.productThumbnailUrl}`} alt={row.productName} style={{ width: 50, height: 50, borderRadius: 6, objectFit: "cover" }} />, width: "90px", center: true },
    { name: "Product Name", selector: (row) => row.productName, sortable: true },
    { name: "Price", selector: (row) => row.sell_price ?? "N/A" },
    { name: "Status", cell: (row) => <Switch checked={row.status || false} onChange={() => handleStatusToggle(row)} />, width: "120px", center: true },
    { name: "Actions", cell: (row) => <IconButton color="primary" onClick={() => handleEditClick(row)}><EditIcon /></IconButton>, width: "100px", center: true },
  ];

  return (
    <MDBox p={2} style={{ marginLeft: miniSidenav ? "100px" : "270px", transition: "margin-left 0.3s ease", position: "relative" }}>
      {/* Header & Filter controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, padding: "10px", background: "#f4f6f8", borderRadius: "10px" }}>
        <div>
          <span style={{ fontWeight: "bold", fontSize: 26 }}>Products List</span><br />
          <span style={{ fontSize: 17 }}>Filter and manage your products</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <FormControl variant="outlined" size="small">
            <InputLabel>Category</InputLabel>
            <Select label="Category" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }} style={{ width: 180 }}>
              <MenuItem value="">All</MenuItem>
              {categories.map((cat) => <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Search" variant="outlined" size="small" value={searchText} onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }} />
          <Button variant="contained" style={{ ...btnStyle, fontSize: 14, height: 40 }} onClick={() => navigate("/add-seller-product")}>
            + Add Product
          </Button>
        </div>
      </div>

      {/* Table */}
      <div style={{ position: "relative" }}>
        {loading && (
          <Box sx={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(255,255,255,0.7)", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 1 }}>
            <CircularProgress />
          </Box>
        )}
        <div style={{ background: "white", borderRadius: "10px", padding: "10px" }}>
          <DataTable
            columns={columns}
            data={products}
            customStyles={customStyles}
            pagination
            paginationServer
            paginationTotalRows={totalRows}
            paginationPerPage={perPage}
            onChangePage={(page) => setCurrentPage(page)}
            onChangeRowsPerPage={(newPerPage) => { setPerPage(newPerPage); setCurrentPage(1); }}
            highlightOnHover
            striped
            responsive
            noDataComponent={<div style={{ padding: "20px", textAlign: "center", fontSize: "16px" }}>No Products Found</div>}
          />
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Product</DialogTitle>
        <DialogContent>
          <TextField label="Stock" type="number" fullWidth margin="dense" value={editValues.stock} onChange={(e) => setEditValues({ ...editValues, stock: e.target.value })} />
          <TextField label="Selling Price" type="number" fullWidth margin="dense" value={editValues.sell_price} onChange={(e) => setEditValues({ ...editValues, sell_price: e.target.value })} />
          <TextField label="MRP" type="number" fullWidth margin="dense" value={editValues.mrp} onChange={(e) => setEditValues({ ...editValues, mrp: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button variant="contained" style={{color:"white"}} color="primary" onClick={handleEditSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </MDBox>
  );
}

export default SellerProduct;
