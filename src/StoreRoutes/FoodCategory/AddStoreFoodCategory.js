import React, {
  useEffect,
  useState,
} from "react";

import {
  TextField,
  Checkbox,
} from "@mui/material";

import DataTable from "react-data-table-component";

import { useNavigate } from "react-router-dom";

import MDBox from "../../components/MDBox";

import { useMaterialUIController } from "../../context";

import { get, post } from "apis/apiClient";

import { ENDPOINTS } from "apis/endpoints";

const customStyles = {
  headCells: {
    style: {
      backgroundColor: "#1976d2",
      color: "white",
      fontWeight: "700",
      fontSize: "14px",
    },
  },

  rows: {
    style: {
      minHeight: "70px",
    },
  },
};

function AddFoodCategory() {
  const navigate = useNavigate();

  const [controller] =
    useMaterialUIController();

  const { miniSidenav } = controller;

  const [foods, setFoods] =
    useState([]);

  const [selectedFoods, setSelectedFoods] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const sellerId =
    localStorage.getItem("sellerId");

  // ================= GET FOODS =================

  const fetchFoods = async () => {
    try {
      const response = await get(
        ENDPOINTS.GET_FOOD
      );

      setFoods(response.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  // ================= GET SELLER FOODS =================

  const fetchSellerFoods =
    async () => {
      try {
        const response = await get(
          `${ENDPOINTS.GET_SELLER_PROFILE}/${sellerId}`
        );

        const seller =
          response.data?.seller ||
          response.data;

        const foodIds =
          seller?.foodTypes?.map(
            (item) =>
              typeof item ===
              "object"
                ? item._id
                : item
          ) || [];

        setSelectedFoods(foodIds);
      } catch (error) {
        console.log(error);
      }
    };

  useEffect(() => {
    fetchFoods();

    fetchSellerFoods();
  }, []);

  // ================= CHECKBOX =================

  const handleCheckbox = (
    foodId
  ) => {
    if (
      selectedFoods.includes(foodId)
    ) {
      setSelectedFoods((prev) =>
        prev.filter(
          (id) => id !== foodId
        )
      );
    } else {
      setSelectedFoods((prev) => [
        ...prev,
        foodId,
      ]);
    }
  };

  // ================= SAVE =================

  const handleSave = async () => {
    try {
      await post(
        ENDPOINTS.ADD_FOOD_SELLER,
        {
          sellerId,
          foodId: selectedFoods,
        }
      );

      navigate("/food-category");
    } catch (error) {
      console.log(error);
    }
  };

  // ================= FILTER =================

  const filteredFoods = foods.filter(
    (item) =>
      item.name
        ?.toLowerCase()
        .includes(search.toLowerCase())
  );

  // ================= TABLE =================

  const columns = [
    {
      name: "Sr No",

      selector: (_, i) => i + 1,

      width: "100px",
    },

    {
      name: "Image",

      cell: (row) => (
        <img
          src={`${process.env.REACT_APP_IMAGE_LINK}${row.image}`}
          alt=""
          style={{
            width: 50,
            height: 50,
            borderRadius: "8px",
            objectFit: "cover",
          }}
        />
      ),

      width: "120px",
    },

    {
      name: "Type Name",

      selector: (row) => row.name,

      sortable: true,
    },

    {
      name: "Products",

      selector: (row) =>
        row.productsCount || 0,

      center: true,
    },

    {
      name: "",

      cell: (row) => (
        <Checkbox
          checked={selectedFoods.includes(
            row._id
          )}
          onChange={() =>
            handleCheckbox(
              row._id
            )
          }
        />
      ),

      center: true,
    },
  ];

  return (
    <MDBox
      p={2}
      style={{
        marginLeft: miniSidenav
          ? "100px"
          : "270px",
      }}
    >
      <div
        style={{
          background: "white",

          padding: 20,

          borderRadius: 10,

          marginBottom: 20,

          display: "flex",

          justifyContent:
            "space-between",

          alignItems: "center",
        }}
      >
        <div>
          <h2
            style={{
              color: "green",
              margin: 0,
              fontSize: "38px",
            }}
          >
            Main Categories
          </h2>
        </div>

        <TextField
          placeholder="Search..."
          size="small"
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
        />
      </div>

      <div
        style={{
          background: "white",

          borderRadius: 10,

          padding: 10,
        }}
      >
        <DataTable
          columns={columns}
          data={filteredFoods}
          pagination
          striped
          responsive
          customStyles={
            customStyles
          }
        />

        <div
          style={{
            display: "flex",
            justifyContent:
              "flex-end",

            marginTop: 20,
          }}
        >
          <button
            onClick={handleSave}
            style={{
              background:
                "#00c853",

              border: "none",

              color: "white",

              padding:
                "12px 30px",

              borderRadius:
                "8px",

              cursor: "pointer",

              fontWeight: "700",

              fontSize: "15px",
            }}
          >
            NEXT
          </button>
        </div>
      </div>
    </MDBox>
  );
}

export default AddFoodCategory;