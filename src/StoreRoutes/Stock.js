import React, { useEffect, useState } from "react";
import MDBox from "../components/MDBox";
import { Button, Chip, Typography, Popover, TextField } from "@mui/material";
import { useMaterialUIController } from "../context";

const headerCell = {
  padding: "14px 12px",
  border: "1px solid #ddd",
  fontSize: "1rem",
  fontWeight: "bold",
  backgroundColor: "#007bff",
  color: "white",
  textAlign: "left",
  whiteSpace: "nowrap",
};

const bodyCell = {
  padding: "12px",
  border: "1px solid #eee",
  fontSize: "0.9rem",
  backgroundColor: "#fff",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const styles = `
  .responsive-table-container { overflow-x: auto; width: 100%; }
  .responsive-table { width: 100%; border-collapse: collapse; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
  .responsive-table th, .responsive-table td { min-width: 80px; }
  .filter-container { display: flex; justify-content: space-between; margin-bottom: 10px; flex-wrap: wrap; gap: 15px; }
  .filter-item { display: flex; align-items: center; gap: 10px; }
  .filter-item select, .filter-item input { font-size: 0.9rem; padding: 8px; border-radius: 6px; border: 1px solid #ccc; }
  .stock-box { background-color: #f5f5f5; border: 1px solid #007bff; border-radius: 6px; padding: 10px 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); cursor: pointer; transition: background-color 0.2s; }
  .stock-box:hover { background-color: #e0e0e0; }
  .stock-box-label { font-size: 0.9rem; font-weight: bold; color: #333; }
  .stock-box-value { font-size: 1rem; color: #d32f2f; }
  .popover-container { background-color: #fff;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);padding: 15px; max-width: 500px; max-height: 400px; overflow-y: auto; }
  .popover-product { margin-bottom: 15px; }
  .popover-product-name { font-size: 0.9rem; font-weight: bold; margin-bottom: 5px; }
  .popover-variant { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; flex-wrap: wrap; }
  .popover-variant-label { font-size: 0.8rem; color: #555; flex: 1; }
  .popover-variant-input { min-width: 80px; padding: 5px; font-size: 0.8rem; border-radius: 4px; border: 1px solid #ccc; }
  .popover-save-button { margin-top: 10px; background-color: #007bff; color: white; padding: 6px 12px; font-size: 0.8rem; border-radius: 4px; }
  .edit-stock-button { background-color: #388e3c; color: white; font-size: 0.8rem; padding: 4px 8px; border-radius: 4px; }
`;

function StockManagement() {
  const [controller] = useMaterialUIController();
  const { miniSidenav } = controller;

  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState(30);
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [loading, setLoading] = useState(false);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  const [popoverAnchorEl, setPopoverAnchorEl] = useState(null);
  const [popoverType, setPopoverType] = useState("");
  const [popoverProductId, setPopoverProductId] = useState(null);

  const [stockUpdates, setStockUpdates] = useState({});
  const [priceUpdates, setPriceUpdates] = useState({});
  const [mrpUpdates, setMrpUpdates] = useState({});

  const [perPage, setPerPage] = useState(10);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("sellerId");
    setStoreId(id);
  }, []);

  useEffect(() => {
    const getStoreDetails = async () => {
      if (!storeId) return;
      setLoading(true);

      const params = new URLSearchParams({
        sellerId: storeId,
        page: currentPage,
        limit: perPage,
        search: searchText,
        category: categoryFilter,
      });

      try {
        const productResponse = await fetch(
          `https://api.fivlia.in/getSellerProducts?${params.toString()}`
        );

        if (!productResponse.ok) {
          setError(`Failed: ${productResponse.status}`);
          setLoading(false);
          return;
        }

        const productResult = await productResponse.json();
        const products = productResult.products || [];

        const transformedProducts = products.map((p) => ({
          ...p,
          _id: p.sellerProductId,
          totalStock: (p.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0),
        }));

        setData(transformedProducts);
        setOutOfStockCount(transformedProducts.filter((p) => p.totalStock === 0).length);
        setLowStockCount(
          transformedProducts.filter((p) => p.totalStock > 0 && p.totalStock <= 10).length
        );
      } catch (err) {
        setError("Fetch error: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    getStoreDetails();
  }, [storeId, currentPage, perPage, searchText, categoryFilter]);

  const filteredProducts = data.filter((item) =>
    item.productName.toLowerCase().includes(search.toLowerCase())
  );

  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / entries);
  const startIndex = (currentPage - 1) * entries;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + entries);

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

  const handleStockChange = (productId, variantId, newValue) => {
    setStockUpdates((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [variantId]: Number(newValue),
      },
    }));
  };

  const handlePriceChange = (productId, variantId, newValue) => {
    setPriceUpdates((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [variantId]: Number(newValue),
      },
    }));
  };

  const handleMrpChange = (productId, variantId, newValue) => {
    setMrpUpdates((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [variantId]: Number(newValue),
      },
    }));
  };

  const handleSaveStock = async () => {
    let updatedProducts = [...data];

    for (const productId of Object.keys(stockUpdates)) {
      const product = data.find((p) => p._id === productId);
      if (!product) continue;

      const stockPayload = product.variants
        .map((variant) => {
          const updatedQty = stockUpdates[productId]?.[variant._id];
          const updatedPrice = priceUpdates[productId]?.[variant._id];
          const updatedMrp = mrpUpdates[productId]?.[variant._id];

          if (updatedQty === undefined) return null;

          return {
            variantId: variant._id,
            quantity: updatedQty,
            price: updatedPrice ?? variant.sell_price,
            mrp: updatedMrp ?? variant.mrp,
          };
        })
        .filter(Boolean);

      if (stockPayload.length === 0) continue;

      try {
        await fetch(`https://api.fivlia.in/updateStock/${productId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId, stock: stockPayload }),
        });

        updatedProducts = updatedProducts.map((p) =>
          p._id === productId
            ? {
                ...p,
                variants: p.variants.map((variant) => ({
                  ...variant,
                  stock:
                    stockUpdates[productId]?.[variant._id] ?? variant.stock,
                  sell_price:
                    priceUpdates[productId]?.[variant._id] ?? variant.sell_price,
                  mrp: mrpUpdates[productId]?.[variant._id] ?? variant.mrp,
                })),
                totalStock: p.variants.reduce(
                  (sum, v) =>
                    sum +
                    (stockUpdates[productId]?.[v._id] ?? v.stock ?? 0),
                  0
                ),
              }
            : p
        );
      } catch (err) {
        console.error("Update failed:", err);
      }
    }

    setData(updatedProducts);
    setOutOfStockCount(updatedProducts.filter((p) => p.totalStock === 0).length);
    setLowStockCount(updatedProducts.filter((p) => p.totalStock > 0 && p.totalStock <= 10).length);

    handlePopoverClose();
  };

  const popoverProducts =
    popoverType === "outOfStock"
      ? filteredProducts.filter((p) => p.totalStock === 0)
      : popoverType === "lowStock"
      ? filteredProducts.filter((p) => p.totalStock > 0 && p.totalStock <= 10)
      : popoverType === "editStock"
      ? filteredProducts.filter((p) => p._id === popoverProductId)
      : [];

  return (
    <>
      <style>{styles}</style>
      <MDBox
        p={2}
        style={{
          marginLeft: miniSidenav ? "80px" : "250px",
          transition: "margin-left 0.3s ease",
        }}
      >
        <div style={{ borderRadius: 15, padding: 20 }}>
          <div style={{ marginBottom: 20 }}>
            <h2>Stock & Pricing Management</h2>
            <p>Monitor and manage product stock levels, prices, and MRP</p>
          </div>

          {/* Filters */}
          <div className="filter-container">
            <div className="filter-item">
              <span>Show:</span>
              <select
                value={entries}
                onChange={(e) => {
                  setEntries(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={30}>30</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="filter-item">
              <div className="stock-box" onClick={(e) => handlePopoverOpen(e, "outOfStock")}>
                <span className="stock-box-label">Out of Stock:</span>{" "}
                <span className="stock-box-value">{outOfStockCount}</span>
              </div>
            </div>
            <div className="filter-item">
              <div className="stock-box" onClick={(e) => handlePopoverOpen(e, "lowStock")}>
                <span className="stock-box-label">Low Stock:</span>{" "}
                <span className="stock-box-value">{lowStockCount}</span>
              </div>
            </div>
            <div className="filter-item">
              <label>Search:</label>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Table */}
          <div className="responsive-table-container">
            {loading ? (
              <p>Loading...</p>
            ) : (
              <table className="responsive-table">
                <thead>
                  <tr>
                    <th style={headerCell}>Sr.</th>
                    <th style={headerCell}>Product</th>
                    <th style={headerCell}>Variants</th>
                    <th style={headerCell}>Stock</th>
                    <th style={headerCell}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((item, index) => (
                    <tr key={item._id}>
                      <td style={bodyCell}>{startIndex + index + 1}</td>
                      <td style={bodyCell}>
                        <img
                          src={`${process.env.REACT_APP_IMAGE_LINK}${item.productThumbnailUrl}`}
                          alt={item.productName}
                          style={{ width: 50, height: 60, objectFit: "cover" }}
                        />{" "}
                        {item.productName}
                      </td>
                      <td style={bodyCell}>
                        {(item.variants || []).map((v) => (
                          <Chip
                            key={v._id}
                            label={`${v.attributeName}: ${v.variantValue} (Stock: ${v.stock}, Price: ₹${v.sell_price}, MRP: ₹${v.mrp})`}
                            size="small"
                            style={{
                              backgroundColor:
                                v.stock === 0 ? "#ffebee" : v.stock <= 10 ? "#fff3e0" : "#e8f5e9",
                              color:
                                v.stock === 0 ? "#d32f2f" : v.stock <= 10 ? "#f57c00" : "#388e3c",
                            }}
                          />
                        ))}
                      </td>
                      <td style={bodyCell}>{item.totalStock}</td>
                      <td style={bodyCell}>
                        <Button
                          className="edit-stock-button"
                          onClick={(e) => handlePopoverOpen(e, "editStock", item._id)}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Popover */}
          <Popover
            open={Boolean(popoverAnchorEl)}
            anchorEl={popoverAnchorEl}
            onClose={handlePopoverClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          >
            <div className="popover-container">
              {popoverProducts.map((p) => (
                <div key={p._id}>
                  <h4>{p.productName}</h4>
                  {p.variants.map((v) => (
                    <div key={v._id} className="popover-variant">
                      <span>{v.attributeName}: {v.variantValue}</span>
                      <TextField
                        size="small"
                        label="Stock"
                        type="number"
                        value={stockUpdates[p._id]?.[v._id] ?? v.stock}
                        onChange={(e) => handleStockChange(p._id, v._id, e.target.value)}
                      />
                      <TextField
                        size="small"
                        label="Price"
                        type="number"
                        value={priceUpdates[p._id]?.[v._id] ?? v.sell_price}
                        onChange={(e) => handlePriceChange(p._id, v._id, e.target.value)}
                      />
                      <TextField
                        size="small"
                        label="MRP"
                        type="number"
                        value={mrpUpdates[p._id]?.[v._id] ?? v.mrp}
                        onChange={(e) => handleMrpChange(p._id, v._id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              ))}
              <Button onClick={handleSaveStock}>Save</Button>
            </div>
          </Popover>
        </div>
      </MDBox>
    </>
  );
}

export default StockManagement;
