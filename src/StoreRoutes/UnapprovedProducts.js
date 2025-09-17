import React, { useEffect, useState } from "react";
import {
  Button,
  TextField,
  CircularProgress,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import MDBox from "../components/MDBox";
import { useMaterialUIController } from "../context";
import { get, post, put } from "apis/apiClient";
import { ENDPOINTS } from "apis/endpoints";

const btnStyle = {
  backgroundColor: "#1976d2",
  color: "white",
  padding: "8px 16px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: 500,
};

const statusColors = {
  pending_admin_approval: "#FFD700", // yellow
  request_brand_approval: "#FF8C00", // orange
  approved: "#4CAF50", // green
  rejected: "#F44336", // red
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

function UnapprovedProducts() {
  const navigate = useNavigate();
  const [controller] = useMaterialUIController();
  const { miniSidenav } = controller;

  const [products, setProducts] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(100);
  const [searchText, setSearchText] = useState("");

  // Popup state
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [updateFile, setUpdateFile] = useState(null);
  const [description, setDescription] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("sellerId");
    if (!id) return navigate("/login");
    setStoreId(id);
  }, [navigate]);

  useEffect(() => {
    if (!storeId) return;
    fetchProducts();
  }, [storeId, currentPage, perPage, searchText]);

  const fetchProducts = () => {
    setLoading(true);
    const params = new URLSearchParams({
      sellerId: storeId,
      page: currentPage,
      limit: perPage,
      search: searchText,
    });

    get(`${ENDPOINTS.GET_UNAPPROVED_PRODUCTS}?${params.toString()}`)
      .then((res) => {
        setProducts(res.data.products || []);
        setTotalRows(res.data.total || 0);
      })
      .catch((err) => console.error("Fetch Products failed", err))
      .finally(() => setLoading(false));
  };

  const handleOpenDialog = (product) => {
    if (product.sellerProductStatus !== "request_brand_approval") return;

    setSelectedProduct(product);
    setUpdateFile(null);
    setDescription("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProduct(null);
    setUpdateFile(null);
    setDescription("");
  };

  const handleSaveUpdate = async () => {
    if (!selectedProduct) return;

    const formData = new FormData();
    formData.append("productId", selectedProduct._id);
    if (updateFile) formData.append("brandDocument", updateFile);
    if (description) formData.append("description", description);

    try {
      const res = await post(ENDPOINTS.UPDATE_BRAND_DOCUMENT, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.status === 200) {
        fetchProducts();
        handleCloseDialog();
        alert("Brand update submitted successfully");
      } else {
        alert(res.data?.message || "Failed to update brand approval");
      }
    } catch (err) {
      //console.error("Failed to update brand approval", err);
      alert("Something went wrong while submitting brand update.");
    }
  };

  const columns = [
    {
      name: "Sr No",
      selector: (_, i) => (currentPage - 1) * perPage + i + 1,
      width: "90px",
      center: true,
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
      center: true,
    },
    {
      name: "Product Name",
      selector: (row) => row.productName,
      sortable: true,
    },
    {
      name: "Category",
      selector: (row) => {
        if (Array.isArray(row.category)) return row.category.map((c) => c.name).join(", ");
        if (row.category && typeof row.category === "object") return row.category.name;
        return "-";
      },
    },
    {
      name: "Status",
      selector: (row) => row.sellerProductStatus,
      cell: (row) => (
        <span
          style={{
            backgroundColor: statusColors[row.sellerProductStatus] || "#ccc",
            color: "white",
            padding: "3px 8px",
            borderRadius: "6px",
            fontWeight: "bold",
          }}
        >
          {row.sellerProductStatus.replace(/_/g, " ")}
        </span>
      ),
      sortable: true,
    },
    {
      name: "Action",
      cell: (row) =>
        row.sellerProductStatus === "request_brand_approval" ? (
          <Button
            variant="contained"
            style={btnStyle}
            size="small"
            onClick={() => handleOpenDialog(row)}
          >
            Update
          </Button>
        ) : "--",
      width: "120px",
      center: true,
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
      {/* Header */}
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
          <span style={{ fontWeight: "bold", fontSize: 26 }}>Unapproved Products</span>
          <br />
          <span style={{ fontSize: 17 }}>Manage your unapproved products</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
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
        <div style={{ background: "white", borderRadius: "10px", padding: "10px" }}>
          <DataTable
            columns={columns}
            data={products}
            customStyles={customStyles}
            pagination
            paginationServer
            paginationTotalRows={totalRows}
            paginationPerPage={perPage}
            defaultPerPage={100}
            paginationRowsPerPageOptions={[100, 200, 300, 500, 1000]}
            onChangePage={(page) => setCurrentPage(page)}
            onChangeRowsPerPage={(newPerPage) => {
              setPerPage(newPerPage);
              setCurrentPage(1);
            }}
            highlightOnHover
            striped
            responsive
            noDataComponent={
              <div style={{ padding: "20px", textAlign: "center", fontSize: "16px" }}>
                No Products Found
              </div>
            }
          />
        </div>
      </div>

      {/* Brand Approval Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Brand Approval Update</DialogTitle>
        <DialogContent
          style={{ display: "flex", flexDirection: "column", gap: 15, minWidth: 400 }}
        >
          <input
            type="file"
            onChange={(e) => setUpdateFile(e.target.files[0])}
            accept="image/*"
          />
          <TextField
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={4}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSaveUpdate} style={btnStyle}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </MDBox>
  );
}

export default UnapprovedProducts;