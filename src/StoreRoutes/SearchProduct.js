import React, { useState, useEffect } from "react";
import {
  TextField,
  CircularProgress,
  Button,
  Box,
} from "@mui/material";
import Swal from "sweetalert2";
import { get, put } from "apis/apiClient";
import { ENDPOINTS } from "apis/endpoints";
import { useMaterialUIController } from "../context";
import MDBox from "../components/MDBox";
import { useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";

// ✅ Table styles
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

const SearchProduct = () => {
  const navigate = useNavigate();
  const [controller] = useMaterialUIController();
  const { miniSidenav } = controller;

  const [searchTerm, setSearchTerm] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [storeId, setStoreId] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("sellerId");
    if (!id) return navigate("/login");
    setStoreId(id);
  }, [navigate]);

  // Debounce search
  useEffect(() => {
    if (searchTerm.length >= 3) {
      const delay = setTimeout(() => {
        searchProducts(searchTerm);
      }, 500);
      return () => clearTimeout(delay);
    } else {
      setProductResults([]);
      setHasSearched(false);
    }
  }, [searchTerm]);

  const searchProducts = async (query) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await get(`${ENDPOINTS.GET_EXISTING_PRODUCT_LIST}?q=${query}`);
      setProductResults(res.data?.products || []);
    } catch (error) {
      console.error("Search failed", error);
      setProductResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (product) => {
    const isAlreadyAdded = selectedProducts.some(
      (p) => p.productId === product.productId
    );

    if (isAlreadyAdded) {
      Swal.fire({
        title: "Already Added",
        text: `${product.productName} is already in your list.`,
        icon: "info",
        confirmButtonColor: "#00c853",
      });
      return;
    }

    const tempUpdatedProducts = [
      ...selectedProducts,
      {
        productId: product.productId,
        categoryId: product.categoryId,
        subCategoryId: product.subCategoryId,
        subSubCategoryId: product.subSubCategoryId,
      },
    ];

    const sellerProducts = tempUpdatedProducts.map((p) => p.productId);

    const categoryMap = {};
    tempUpdatedProducts.forEach((p) => {
      if (!categoryMap[p.categoryId]) {
        categoryMap[p.categoryId] = {};
      }
      if (!categoryMap[p.categoryId][p.subCategoryId]) {
        categoryMap[p.categoryId][p.subCategoryId] = new Set();
      }
      if (p.subSubCategoryId) {
        categoryMap[p.categoryId][p.subCategoryId].add(p.subSubCategoryId);
      }
    });

    const sellerCategories = Object.entries(categoryMap).map(
      ([categoryId, subCats]) => ({
        categoryId,
        subCategories: Object.entries(subCats).map(
          ([subCategoryId, subSubCatSet]) => ({
            subCategoryId,
            subSubCategories: Array.from(subSubCatSet).map((subSubCategoryId) => ({
              subSubCategoryId,
            })),
          })
        ),
      })
    );

    const payload = { sellerProducts, sellerCategories };

    try {
      const response = await put(`${ENDPOINTS.UPDATE_PRODUCT}/${storeId}`, payload, {
        authRequired: true,
      });
      if (response.status === 200) {
        setSelectedProducts(tempUpdatedProducts);
        Swal.fire({
          title: "Added!",
          text: `${product.productName} has been added successfully.`,
          icon: "success",
          confirmButtonColor: "#00c853",
        });
      } else {
        throw new Error(response.data.message || "Unknown error");
      }
    } catch (err) {
      console.error("Add product failed:", err);
      Swal.fire({
        title: "Error",
        text: err.message || "Failed to add product.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    }
  };

  const handleAddNewProduct = () => {
    navigate("/add-seller-product");
  };

  // ✅ Table columns
  const columns = [
    {
      name: "Image",
      cell: (row) => (
        <img
          src={`${process.env.REACT_APP_IMAGE_LINK}${row.image}`}
          alt={row.productName}
          style={{ width: 50, height: 50, borderRadius: 6, objectFit: "cover" }}
        />
      ),
      width: "80px",
      center: true,
    },
    { name: "Product Name", selector: (row) => row.productName, sortable: true },
    { name: "SKU", selector: (row) => row.sku },
    { name: "Brand", selector: (row) => row.brand || "N/A" },
    { name: "Category", selector: (row) => row.category || "N/A" },
    { name: "Sub Category", selector: (row) => row.subCategory || "N/A" },
    { name: "Commission (%)", selector: (row) => row.commission || "0" },
    {
      name: "Action",
      cell: (row) => (
        <Button
          variant="contained"
          size="small"
          style={{ backgroundColor: "#00c853", color: "#fff" }}
          onClick={() => handleAddProduct(row)}
        >
          + Add
        </Button>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
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
      }}
    >
      {/* Search Bar */}
      <Box
        mb={3}
        sx={{
          background: "#f4f6f8",
          padding: "15px",
          borderRadius: "10px",
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search a product to add..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Box>

      {/* Loader */}
      {loading && (
        <Box display="flex" justifyContent="center" mt={5}>
          <CircularProgress />
        </Box>
      )}

      {/* Results Table */}
      {!loading && productResults.length > 0 && (
          <div
          style={{
            background: "white",
            borderRadius: "10px",
            padding: "10px",
          }}
        >
        <DataTable
          columns={columns}
          data={productResults}
          customStyles={customStyles}
          highlightOnHover
          striped
          responsive
          pagination
          noDataComponent={
            <div style={{ padding: "20px", textAlign: "center", fontSize: "16px" }}>
              No Products Found
            </div>
          }
        />
        </div>
      )}

      {/* No Results */}
      {!loading && hasSearched && productResults.length === 0 && (
        <Box textAlign="center" mt={5}>
          <p style={{ fontSize: "18px", fontWeight: 500 }}>No matching products found.</p>
          <Button
            sx={{ mt: 2, backgroundColor: "#00c853", color: "#fff" }}
            onClick={handleAddNewProduct}
          >
            + Add New Product
          </Button>
        </Box>
      )}
    </MDBox>
  );
};

export default SearchProduct;