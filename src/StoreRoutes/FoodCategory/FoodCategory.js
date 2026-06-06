import React, { useEffect, useState } from "react";

import { TextField, CircularProgress, Box } from "@mui/material";

import DataTable from "react-data-table-component";

import { useNavigate } from "react-router-dom";

import MDBox from "../../components/MDBox";

import { useMaterialUIController } from "../../context";

import { get, post } from "apis/apiClient";

import { ENDPOINTS } from "apis/endpoints";

const customStyles = {
  headCells: {
    style: {
      backgroundColor: "#3c95ef",
      color: "white",
      fontWeight: "700",
      fontSize: "14px",
    },
  },
};

function FoodCategory() {
  const navigate = useNavigate();

  const [controller] = useMaterialUIController();

  const { miniSidenav } = controller;

  const [foods, setFoods] = useState([]);

  const [sellerFoods, setSellerFoods] = useState([]);

  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");

  const sellerId = localStorage.getItem("sellerId");

  const getSellerFoodIds = (seller) =>
    seller?.foodTypes?.map((item) => (typeof item === "object" ? item._id : item)) || [];

  // ================= GET SELLER FOODS =================

  const fetchSellerFoods = async () => {
    try {
      setLoading(true);

      const [foodsResponse, sellerResponse] = await Promise.all([
        get(ENDPOINTS.GET_FOOD),
        get(`${ENDPOINTS.GET_SELLER}?id=${sellerId}`),
      ]);

      const seller =
        sellerResponse.data?.store ||
        sellerResponse.data?.seller ||
        sellerResponse.data;

      setFoods(foodsResponse.data || []);
      setSellerFoods(getSellerFoodIds(seller));
    } catch (error) {
      console.log(error);
      setFoods([]);
      setSellerFoods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sellerId) fetchSellerFoods();
  }, []);

  // ================= REMOVE =================

  const removeFood = async (foodId) => {
    try {
      await post(ENDPOINTS.REMOVE_FOOD_SELLER, {
        sellerId,
        foodId,
      });

      setSellerFoods((prev) => prev.filter((id) => id !== foodId));
    } catch (error) {
      console.log(error);
    }
  };

  // ================= FILTER ONLY SELECTED =================

  const filteredFoods = foods.filter(
    (item) =>
      sellerFoods.includes(item._id) &&
      item.name?.toLowerCase().includes(searchText.toLowerCase()),
  );

  // ================= TABLE =================

  const columns = [
    {
      name: "Sr. No",

      selector: (_, i) => i + 1,

      width: "100px",
    },

    {
      name: "Type Name",

      cell: (row) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <img
            src={`${process.env.REACT_APP_IMAGE_LINK}${row.image}`}
            alt=""
            style={{
              width: 45,
              height: 45,
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />

          <span>{row.name}</span>
        </div>
      ),
    },

    {
      name: "Products",

      selector: (row) => row.productsCount || 0,

      center: true,
    },

    {
      name: "Action",

      cell: (row) => (
        <button
          onClick={() => removeFood(row._id)}
          style={{
            background: "#ef4444",
            border: "none",
            color: "white",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Remove
        </button>
      ),
    },
  ];

  return (
    <MDBox
      p={2}
      style={{
        marginLeft: miniSidenav ? "100px" : "270px",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          padding: "20px",
          background: "#f4f6f8",
          borderRadius: "10px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
            }}
          >
            Categories Lists
          </h2>

          <p
            style={{
              margin: 0,
            }}
          >
            View and manage all Categories
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 15,
          }}
        >
          <TextField
            placeholder="Search categories..."
            size="small"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <button
            onClick={() => navigate("/add-food-category")}
            style={{
              background: "#00c853",
              border: "none",
              color: "white",
              padding: "12px 25px",
              borderRadius: "10px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            + MANAGE
            <br />
            CATEGORIES
          </button>
        </div>
      </div>

      {/* TABLE */}

      <div
        style={{
          background: "white",
          borderRadius: "10px",
          padding: "10px",
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" p={5}>
            <CircularProgress />
          </Box>
        ) : (
          <DataTable
            columns={columns}
            data={filteredFoods}
            pagination
            responsive
            striped
            customStyles={customStyles}
          />
        )}
      </div>
    </MDBox>
  );
}

export default FoodCategory;
