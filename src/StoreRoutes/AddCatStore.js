import React, { useEffect, useState } from "react";
import MDBox from "../components/MDBox";
import { useMaterialUIController } from "../context";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Checkbox,
  Grid,
  Card,
  CardMedia,
  CardContent,
  FormControlLabel,
} from "@mui/material";
import { ENDPOINTS } from "../apis/endpoints";
import { get, put } from "../apis/apiClient";

const AddStoreCat = () => {
  const navigate = useNavigate();
  const [controller] = useMaterialUIController();
  const { miniSidenav } = controller;

  const [storeId, setStoreId] = useState("");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [selectedSubSubCategories, setSelectedSubSubCategories] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);

  const [step, setStep] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("sellerId");
    if (id) setStoreId(id);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await get(ENDPOINTS.CATEGORIES);
        if (res.status === 200) setCategories(res.data.categories || []);
      } catch (err) {
        console.error("Error fetching categories", err);
      }
    };
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    const selectedCatIds = selectedCategories.map((c) => c.id);
    const selectedSubIds = selectedSubCategories.map((s) => s.id);
    const selectedSubSubIds = selectedSubSubCategories.map((ss) => ss.id);

    const query = new URLSearchParams();
    if (selectedCatIds.length) query.append("categories", selectedCatIds.join(","));
    if (selectedSubIds.length) query.append("subCategories", selectedSubIds.join(","));
    if (selectedSubSubIds.length) query.append("subSubCategories", selectedSubSubIds.join(","));

    try {
      setLoadingProducts(true);
      const res = await get(`${ENDPOINTS.GET_PRODUCTS}?${query.toString()}`);
      if (res.status === 200) setProducts(res.data.products || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      const hasSubSub = selectedSubCategories.some((sc) => sc.subSubCategories?.length > 0);
      if (!hasSubSub) {
        await fetchProducts();
        setStep(3);
        return;
      }
    }
    if (step === 2) await fetchProducts();
    setStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (step === 3 && !selectedSubCategories.some((sc) => sc.subSubCategories?.length > 0)) {
      setStep(1);
    } else setStep((prev) => Math.max(prev - 1, 0));
  };

  const toggleSelection = (item, selectedList, setSelectedList) => {
    const itemId = item.id || item._id;
    const exists = selectedList.some((i) => (i.id || i._id) === itemId);
    if (exists) {
      setSelectedList(selectedList.filter((i) => (i.id || i._id) !== itemId));
    } else {
      setSelectedList([...selectedList, item]);
    }
  };

  const handleSubmit = async () => {
    const payload = {
      sellerCategories: selectedCategories.map((cat) => ({
        categoryId: cat.id,
        subCategories: selectedSubCategories
          .filter((sc) => sc.parentCategoryId === cat.id)
          .map((sc) => ({
            subCategoryId: sc.id,
            subSubCategories: selectedSubSubCategories
              .filter((ss) => ss.parentSubCategoryId === sc.id)
              .map((ss) => ({ subSubCategoryId: ss.id })),
          })),
      })),
      sellerProducts: selectedProducts.map((p) => p._id),
    };
    try {
      const res = await put(`${ENDPOINTS.UPDATE_PRODUCT}/${storeId}`, payload, {
        authRequired: true,
      });
      if (res.status === 200) {
        alert("Saved successfully");
        navigate(-1);
      } else alert("Save failed");
    } catch (err) {
      console.error(err);
      alert("Save failed");
    }
  };

  // ===== Renderers =====

  const renderItems = (
    items,
    selectedList,
    setSelectedList,
    type = "main", // "main" | "sub" | "subsub" | "product"
    getImageKey = "image",
    small = false
  ) => (
    <Grid container spacing={2}>
      {items.map((item) => {
        const itemId = item.id || item._id;
        const isSelected = selectedList.some((i) => (i.id || i._id) === itemId);

        // Extra info (show productCount everywhere)
        let extraInfo = null;

        if (type === "main") {
          const subCount = Array.isArray(item.subCategories) ? item.subCategories.length : 0;
          const subSubCount = Array.isArray(item.subCategories)
            ? item.subCategories.reduce(
                (acc, sc) =>
                  acc + (Array.isArray(sc.subSubCategories) ? sc.subSubCategories.length : 0),
                0
              )
            : 0;
          const prodCount = item.productCount || 0;

          extraInfo = (
            <>
              <div style={{ fontSize: 13, color: "gray", marginTop: 4 }}>
                {subCount} Sub Categories
              </div>
              <div style={{ fontSize: 13, color: "gray" }}>
                {subSubCount} Sub Sub Categories
              </div>
              <div style={{ fontSize: 13, color: "gray" }}>
                {prodCount} Products
              </div>
            </>
          );
        } else if (type === "sub") {
          const subSubCount = Array.isArray(item.subSubCategories)
            ? item.subSubCategories.length
            : 0;
          extraInfo = (
            <>
              <div style={{ fontSize: 13, color: "gray", marginTop: 4 }}>
                {subSubCount} Sub Sub Categories
              </div>
              <div style={{ fontSize: 13, color: "gray" }}>
                {item.productCount || 0} Products
              </div>
              <div style={{ fontSize: 13, color: "green" }}>
                Commission: {item.commison || 0}%
              </div>
            </>
          );
        } else if (type === "subsub") {
          extraInfo = (
            <>
              <div style={{ fontSize: 13, color: "gray", marginTop: 4 }}>
                {item.productCount || 0} Products
              </div>
              <div style={{ fontSize: 13, color: "green" }}>
                Commission: {item.commison || 0}%
              </div>
            </>
          );
        }

        return (
          <Grid item xs={12} sm={6} md={4} lg={small ? 2 : 3} key={itemId}>
            <Card
              sx={{
                border: isSelected ? "2px solid #1A73E8" : "1px solid #ccc",
                cursor: "pointer",
                height: small ? 200 : 280,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
              onClick={() => toggleSelection(item, selectedList, setSelectedList)}
            >
              <CardMedia
                component="img"
                height={small ? 100 : 140}
                image={
                  item[getImageKey]
                    ? item[getImageKey].startsWith?.("http")
                      ? item[getImageKey]
                      : `${process.env.REACT_APP_IMAGE_LINK}${item[getImageKey]}`
                    : "/placeholder.png"
                }
                alt={item.name || item.productName}
              />
              <CardContent
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                }}
              >
                <FormControlLabel
                  control={<Checkbox checked={isSelected} />}
                  label={item.name || item.productName}
                />
                {extraInfo}
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );

  const renderProductsStep = () => (
    <>
      <Button
        variant="contained"
        onClick={() =>
          selectedProducts.length === products.length
            ? setSelectedProducts([])
            : setSelectedProducts(products)
        }
        style={{ marginBottom: 10, backgroundColor: "#00c853", color: "white" }}
      >
        {selectedProducts.length === products.length ? "Deselect All" : "Select All"}
      </Button>
      {renderItems(
        products,
        selectedProducts,
        setSelectedProducts,
        "product",
        "productThumbnailUrl",
        true
      )}
    </>
  );

  const getHeader = () => {
    switch (step) {
      case 0:
        return "Select Categories";
      case 1:
        return "Select Sub Categories";
      case 2:
        return "Select Sub Sub Categories";
      case 3:
        return "Select Products";
      default:
        return "";
    }
  };

  return (
    <MDBox ml={miniSidenav ? "80px" : "250px"} p={2} sx={{ marginTop: "20px" }}>
      <div
        style={{
          width: "90%",
          margin: "0 auto",
          borderRadius: "10px",
          padding: "20px",
          border: "1px solid gray",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "30px",
            fontWeight: "bold",
            color: "green",
          }}
        >
          {getHeader()}
        </h2>

        {step === 0 &&
          renderItems(
            categories,
            selectedCategories,
            setSelectedCategories,
            "main",
            "image"
          )}

        {step === 1 &&
          renderItems(
            selectedCategories.flatMap((cat) =>
              (cat.subCategories || []).map((sc) => ({
                ...sc,
                parentCategoryId: cat.id,
              }))
            ),
            selectedSubCategories,
            setSelectedSubCategories,
            "sub",
            "image"
          )}

        {step === 2 &&
          renderItems(
            selectedSubCategories.flatMap((sub) =>
              (sub.subSubCategories || []).map((ss) => ({
                ...ss,
                parentSubCategoryId: sub.id,
              }))
            ),
            selectedSubSubCategories,
            setSelectedSubSubCategories,
            "subsub",
            "image"
          )}

        {step === 3 && renderProductsStep()}

        <div style={{ marginTop: "30px", display: "flex", justifyContent: "space-between" }}>
          <Button
            disabled={step === 0}
            onClick={handlePrev}
            variant="contained"
            style={{ backgroundColor: "#7b809a", color: "white" }}
          >
            Previous
          </Button>

          {step < 3 ? (
            <Button
              onClick={handleNext}
              variant="contained"
              style={{ backgroundColor: "#1A73E8", color: "white" }}
              disabled={
                (step === 0 && selectedCategories.length === 0) ||
                (step === 1 && selectedSubCategories.length === 0) ||
                (step === 2 &&
                  selectedSubCategories.some((sub) => sub.subSubCategories?.length > 0) &&
                  selectedSubSubCategories.length === 0)
              }
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="success"
              disabled={selectedProducts.length === 0 || loadingProducts}
            >
              {loadingProducts ? "Saving..." : "Save"}
            </Button>
          )}
        </div>
      </div>
    </MDBox>
  );
};

export default AddStoreCat;
