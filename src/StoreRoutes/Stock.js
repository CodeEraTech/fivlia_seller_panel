import React, { useEffect, useState } from "react";
import {
  Button,
  CircularProgress,
  Box,
  Chip,
  Popover,
  TextField,
} from "@mui/material";
import DataTable from "react-data-table-component";
import MDBox from "../components/MDBox";
import { useMaterialUIController } from "../context";

// ✅ Button style
const btnStyle = {
  backgroundColor: "#1976d2",
  color: "white",
  border: "none",
  padding: "6px 12px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "13px",
};

// ✅ Table custom styles
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
  const [controller] = useMaterialUIController();
  const { miniSidenav } = controller;

  const [products, setProducts] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(100);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  // popover state
  const [popoverAnchorEl, setPopoverAnchorEl] = useState(null);
  const [popoverType, setPopoverType] = useState("");
  const [popoverProductId, setPopoverProductId] = useState(null);

  const [stockUpdates, setStockUpdates] = useState({});
  const [priceUpdates, setPriceUpdates] = useState({});
  const [mrpUpdates, setMrpUpdates] = useState({});

  useEffect(() => {
    setStoreId(localStorage.getItem("sellerId"));
  }, []);

  const fetchProducts = async (
    page = 1,
    limit = perPage,
    searchText = search
  ) => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.fivlia.in/getSellerProducts?sellerId=${storeId}&page=${page}&limit=${limit}&search=${searchText}`
      );
      if (!res.ok) throw new Error("Fetch failed");
      const result = await res.json();

      const products = (result.products || []).map((p) => ({
        ...p,
        _id: p.sellerProductId,
        totalStock: (p.variants || []).reduce(
          (sum, v) => sum + (v.stock || 0),
          0
        ),
        commission: p.commission || 0,
      }));

      setProducts(products);
      setTotalRows(result.total || 0);

      setOutOfStockCount(products.filter((p) => p.totalStock === 0).length);
      setLowStockCount(
        products.filter((p) => p.totalStock > 0 && p.totalStock <= 10).length
      );
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [storeId, search, perPage]);

  // 👉 Popover handlers
  const handlePopoverOpen = (event, type, productId = null) => {
    setPopoverAnchorEl(event.currentTarget);
    setPopoverType(type);
    setPopoverProductId(productId);
  };
  const handlePopoverClose = () => {
    setPopoverAnchorEl(null);
    setPopoverType("");
    setPopoverProductId(null);
    setStockUpdates({});
    setPriceUpdates({});
    setMrpUpdates({});
  };

  const handleStockChange = (productId, variantId, value) => {
    setStockUpdates((prev) => ({
      ...prev,
      [productId]: { ...(prev[productId] || {}), [variantId]: Number(value) },
    }));
  };
  const handlePriceChange = (productId, variantId, value) => {
    setPriceUpdates((prev) => ({
      ...prev,
      [productId]: { ...(prev[productId] || {}), [variantId]: Number(value) },
    }));
  };
  const handleMrpChange = (productId, variantId, value) => {
    setMrpUpdates((prev) => ({
      ...prev,
      [productId]: { ...(prev[productId] || {}), [variantId]: Number(value) },
    }));
  };

  const handleSaveStock = async () => {
    let updated = [...products];

    const allProductIds = new Set([
      ...Object.keys(stockUpdates),
      ...Object.keys(priceUpdates),
      ...Object.keys(mrpUpdates),
    ]);

    for (const productId of allProductIds) {
      const product = products.find((p) => p._id === productId);
      if (!product) continue;

      const stockPayload = product.variants
        .map((variant) => ({
          variantId: variant._id,
          quantity: stockUpdates[productId]?.[variant._id] ?? variant.stock,
          price: priceUpdates[productId]?.[variant._id] ?? variant.sell_price,
          mrp: mrpUpdates[productId]?.[variant._id] ?? variant.mrp,
        }))
        .filter(Boolean);

      try {
        await fetch(`https://api.fivlia.in/updateStock/${productId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId, stock: stockPayload }),
        });

        updated = updated.map((p) =>
          p._id === productId
            ? {
                ...p,
                variants: p.variants.map((v) => ({
                  ...v,
                  stock: stockUpdates[productId]?.[v._id] ?? v.stock,
                  sell_price: priceUpdates[productId]?.[v._id] ?? v.sell_price,
                  mrp: mrpUpdates[productId]?.[v._id] ?? v.mrp,
                })),
                totalStock: p.variants.reduce(
                  (sum, v) =>
                    sum + (stockUpdates[productId]?.[v._id] ?? v.stock ?? 0),
                  0
                ),
              }
            : p
        );
      } catch (err) {
        console.error("Update failed:", err);
      }
    }
    setProducts(updated);
    setOutOfStockCount(updated.filter((p) => p.totalStock === 0).length);
    setLowStockCount(
      updated.filter((p) => p.totalStock > 0 && p.totalStock <= 10).length
    );
    handlePopoverClose();
  };

  const calculateNetAmount = (price, commission) => {
    if (!price || isNaN(price)) return 0;
    return price - price * (commission / 100);
  };

  const popoverProducts =
    popoverType === "outOfStock"
      ? products.filter((p) => p.totalStock === 0)
      : popoverType === "lowStock"
      ? products.filter((p) => p.totalStock > 0 && p.totalStock <= 10)
      : popoverType === "editStock"
      ? products.filter((p) => p._id === popoverProductId)
      : [];

  const columns = [
    {
      name: "Sr. No",
      selector: (row, index) => (currentPage - 1) * perPage + index + 1,
      width: "90px",
      center: true,
    },
    {
      name: "Product",
      cell: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src={`${process.env.REACT_APP_IMAGE_LINK}${
              row.productThumbnailUrl || "https://via.placeholder.com/50"
            }`}
            alt={row.productName}
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "6px",
              objectFit: "cover",
            }}
          />
          <span>{row.productName}</span>
        </div>
      ),
      grow: 2,
    },
    {
      name: "Variants",
      cell: (row) => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {row.variants?.map((v) => (
            <Chip
              key={v._id}
              label={`${v.attributeName}: ${v.variantValue} | Stock: ${v.stock} | ₹${v.sell_price}`}
              size="small"
              style={{
                backgroundColor:
                  v.stock === 0
                    ? "#ffebee"
                    : v.stock <= 10
                    ? "#fff3e0"
                    : "#e8f5e9",
                color:
                  v.stock === 0
                    ? "#d32f2f"
                    : v.stock <= 10
                    ? "#f57c00"
                    : "#388e3c",
              }}
            />
          ))}
        </div>
      ),
      grow: 3,
    },
    {
      name: "Total Stock",
      selector: (row) => row.totalStock,
      sortable: true,
      width: "140px",
      center: true,
    },
    {
      name: "Action",
      cell: (row) => (
        <button
          style={btnStyle}
          onClick={(e) => handlePopoverOpen(e, "editStock", row._id)}
        >
          Edit
        </button>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      center: true,
      width: "120px",
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
          padding: "15px",
          background: "#f4f6f8",
          borderRadius: "10px",
        }}
      >
        <div>
          <span style={{ fontWeight: "bold", fontSize: 26 }}>
            Stock Management
          </span>
          <br />
          <span style={{ fontSize: 17 }}>View and manage stock & prices</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          {/* Total Products */}
          <div
            style={{
              background: "#e8f5e9",
              padding: "10px 20px",
              borderRadius: "8px",
              border: "1px solid #388e3c",
              textAlign: "center",
              cursor: "pointer",
            }}
           // onClick={(e) => handlePopoverOpen(e, "outOfStock")}
          >
            <strong>Total Products</strong>
            <br />
            <span style={{ color: "#388e3c", fontWeight: "bold" }}>
              {totalRows}
            </span>
          </div>
          {/* Out of stock */}
          <div
            style={{
              background: "#ffebee",
              padding: "10px 20px",
              borderRadius: "8px",
              border: "1px solid #d32f2f",
              textAlign: "center",
              cursor: "pointer",
            }}
            //onClick={(e) => handlePopoverOpen(e, "outOfStock")}
          >
            <strong>Out of Stock</strong>
            <br />
            <span style={{ color: "#d32f2f", fontWeight: "bold" }}>
              {outOfStockCount}
            </span>
          </div>

          {/* Low stock */}
          <div
            style={{
              background: "#fff3e0",
              padding: "10px 20px",
              borderRadius: "8px",
              border: "1px solid #f57c00",
              textAlign: "center",
              cursor: "pointer",
            }}
            onClick={(e) => handlePopoverOpen(e, "lowStock")}
          >
            <strong>Low Stock</strong>
            <br />
            <span style={{ color: "#f57c00", fontWeight: "bold" }}>
              {lowStockCount}
            </span>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "8px",
              width: "220px",
              border: "1px solid #ccc",
              fontSize: 14,
            }}
          />
        </div>
      </div>

      {/* Table Container */}
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
          style={{ background: "white", borderRadius: "10px", padding: "10px" }}
        >
          <DataTable
            columns={columns}
            data={products}
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
            pagination
            paginationServer
            paginationTotalRows={totalRows}
            paginationPerPage={perPage}
            paginationRowsPerPageOptions={[100, 200, 300, 500, 1000]}
            onChangePage={(page) => {
              setCurrentPage(page);
              fetchProducts(page);
            }}
            onChangeRowsPerPage={(newPerPage, page) => {
              setPerPage(newPerPage);
              setCurrentPage(page);
              fetchProducts(page, newPerPage);
            }}
            highlightOnHover
            striped
            responsive
            customStyles={customStyles}
          />
        </div>
      </div>

      {/* Popover for editing */}
      <Popover
        open={Boolean(popoverAnchorEl)}
        anchorEl={popoverAnchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <div
          style={{
            padding: "15px",
            backgroundColor: "white",
            maxWidth: 500,
            maxHeight: 400,
            overflowY: "auto",
          }}
        >
          {popoverProducts.map((p) => (
            <div key={p._id}>
              <h4>{p.productName}</h4>
              {p.variants.map((v) => (
                <div key={v._id} style={{ marginBottom: "13px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span>
                      {v.attributeName}: {v.variantValue}
                    </span>
                    <TextField
                      size="small"
                      label="Stock"
                      type="number"
                      value={stockUpdates[p._id]?.[v._id] ?? v.stock}
                      onChange={(e) =>
                        handleStockChange(p._id, v._id, e.target.value)
                      }
                    />
                    <TextField
                      size="small"
                      label="MRP"
                      type="number"
                      value={mrpUpdates[p._id]?.[v._id] ?? v.mrp}
                      onChange={(e) =>
                        handleMrpChange(p._id, v._id, e.target.value)
                      }
                    />
                    <TextField
                      size="small"
                      label="Selling Price"
                      type="number"
                      value={priceUpdates[p._id]?.[v._id] ?? v.sell_price}
                      onChange={(e) =>
                        handlePriceChange(p._id, v._id, e.target.value)
                      }
                    />
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#2e7d32",
                      marginTop: "4px",
                      marginLeft: "80px",
                    }}
                  >
                    You will get ₹
                    {calculateNetAmount(
                      priceUpdates[p._id]?.[v._id] ?? v.sell_price,
                      p.commission
                    ).toFixed(2)}{" "}
                    after {p.commission}% commission
                  </div>
                </div>
              ))}
            </div>
          ))}
          <Button onClick={handleSaveStock}>Save</Button>
        </div>
      </Popover>
    </MDBox>
  );
}

export default StockManagement;
