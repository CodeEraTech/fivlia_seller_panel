import React, { useState, useEffect } from "react";
import { Button, CircularProgress, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import MDBox from "../components/MDBox";
import { useMaterialUIController } from "../context";

// ✅ Button style
const btnStyle = {
  backgroundColor: "#dc3545",
  color: "white",
  border: "none",
  padding: "8px 16px",
  borderRadius: "6px",
  cursor: "pointer",
};

// ✅ Custom table styles with more vertical padding
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

function StoreCategories() {
  const [controller] = useMaterialUIController();
  const { miniSidenav } = controller;
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setStoreId(localStorage.getItem("storeId"));
  }, []);

  const fetchCategories = async (page = 1, limit = perPage, searchText = search) => {
    if (!storeId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.fivlia.in/getStoreCategory?storeId=${storeId}&page=${page}&limit=${limit}&search=${searchText}`
      );

      if (response.ok) {
        const result = await response.json();
        setCategories(result.category || []);
        setTotalRows(result.count || 0);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(1);
  }, [storeId, search, perPage]);

  const handleCate = async (id) => {
    try {
      const confirmDelete = window.confirm("Are you sure you want to remove this category?");
      if (!confirmDelete) return;

      const result = await fetch(`https://api.fivlia.in/removeCategoryInStore/${storeId}`, {
        method: "DELETE",
        body: JSON.stringify({ Category: id }),
        headers: { "Content-Type": "application/json" },
      });

      if (result.ok) {
        alert("Removed Successfully");
        setCategories((prev) => prev.filter((cat) => cat._id !== id));
      } else {
        alert("Failed to remove category");
      }
    } catch (err) {
      console.error("Error removing category:", err);
      alert("Error removing category");
    }
  };

  const columns = [
    {
      name: "Sr. No",
      selector: (row, index) => (currentPage - 1) * perPage + index + 1,
      width: "90px",
      center: true,
    },
    {
      name: "Category Name",
      selector: (row) => row.name,
      sortable: true,
      cell: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src={`${process.env.REACT_APP_IMAGE_LINK}${row.image || "https://via.placeholder.com/50"}`}
            alt={row.name}
            style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }}
          />
          <span>{row.name}</span>
        </div>
      ),
    },
    {
      name: "Sub Categories",
      selector: (row) => (row.subcat ? row.subcat.length : 0),
      center: true,
    },
    {
      name: "Items",
      selector: (row) => {
        const subCatCount = row.subcat ? row.subcat.length : 0;
        const subSubCatCount = row.subcat
          ? row.subcat.reduce((total, subcat) => total + (subcat.subsubcat ? subcat.subsubcat.length : 0), 0)
          : 0;
        return subCatCount + subSubCatCount;
      },
      center: true,
    },
    {
      name: "Action",
      cell: (row) => (
        <button style={btnStyle} onClick={() => handleCate(row._id)}>
          Remove
        </button>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
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
          padding: "15px",
          background: "#f4f6f8",
          borderRadius: "10px",
        }}
      >
        <div>
          <span style={{ fontWeight: "bold", fontSize: 26 }}>Categories Lists</span>
          <br />
          <span style={{ fontSize: 17 }}>View and manage all Categories</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <input
            type="text"
            placeholder="Search categories..."
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

          <Button
            style={{
              backgroundColor: "#00c853",
              height: 45,
              width: 160,
              fontSize: 12,
              color: "white",
              letterSpacing: "1px",
              borderRadius: "8px",
            }}
            onClick={() => navigate("/addstorecat")}
          >
            + ADD CATEGORY
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <div style={{ position: "relative" }}>
        {/* Overlay Loader */}
        {loading && (
          <Box
            sx={{
              position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
              backgroundColor: "rgba(255,255,255,0.7)", zIndex: 2,
              display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 1,
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {/* Table */}
        <div style={{ background: "white", borderRadius: "10px", padding: "10px" }}>
          <DataTable
            columns={columns}
            data={categories}
            progressPending={false} // we handle loader ourselves
            noDataComponent={
              <div style={{ padding: "20px", textAlign: "center", fontSize: "16px" }}>
                No Data Found
              </div>
            }
            pagination
            paginationServer
            paginationTotalRows={totalRows}
            onChangePage={(page) => {
              setCurrentPage(page);
              fetchCategories(page);
            }}
            onChangeRowsPerPage={(newPerPage, page) => {
              setPerPage(newPerPage);
              setCurrentPage(page);
              fetchCategories(page, newPerPage);
            }}
            highlightOnHover
            striped
            responsive
            customStyles={customStyles}
          />
        </div>
      </div>
    </MDBox>
  );
}

export default StoreCategories;