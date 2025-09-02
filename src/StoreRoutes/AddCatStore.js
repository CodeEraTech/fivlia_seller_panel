import React, { useEffect, useState, useCallback, useRef } from "react";
import MDBox from "../components/MDBox";
import { useMaterialUIController } from "../context";
import { useNavigate } from "react-router-dom";
import { Button, TextField, Autocomplete } from "@mui/material";
import { ENDPOINTS } from "../apis/endpoints";
import { get, put } from "../apis/apiClient";
import debounce from "lodash/debounce";

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

  const [loadingProducts, setLoadingProducts] = useState(false);

  // Keep track of initially selected product IDs on mapping load
  const prevSelectedProductIds = useRef([]);

  // 1. Get sellerId
  useEffect(() => {
    const id = localStorage.getItem("sellerId");
    if (id) setStoreId(id);
  }, []);

  // 2. Fetch categories
  useEffect(() => {
    const getCategories = async () => {
      try {
        const res = await get(ENDPOINTS.CATEGORIES);
        if (res.status === 200) {
          setCategories(res.data.categories || []);
        }
      } catch (err) {
        console.error("Error fetching categories", err);
      }
    };
    getCategories();
  }, []);

  // 3. Fetch existing mapping & preselect
  useEffect(() => {
    if (!storeId || categories.length === 0) return;

    const fetchExistingMapping = async () => {
      try {
        const res = await get(`${ENDPOINTS.GET_SELLER_MAPPING}/${storeId}`);
        if (res.status === 200 && res.data) {
          const { sellerCategories = [], sellerProducts = [] } = res.data;

          const selectedCats = categories.filter(cat =>
            sellerCategories.some(sel => sel.categoryId === cat.id)
          );

          const selectedSubs = [];
          const selectedSubSubs = [];

          sellerCategories.forEach(selCat => {
            const cat = categories.find(c => c.id === selCat.categoryId);
            if (!cat?.subCategories) return;

            selCat.subCategories.forEach(selSub => {
              const sub = cat.subCategories.find(s => s.id === selSub.subCategoryId);
              if (sub) {
                selectedSubs.push({ ...sub, parentCategoryId: cat.id });

                selSub.subSubCategories.forEach(ss => {
                  const subSub = sub.subSubCategories?.find(sss => sss.id === ss.subSubCategoryId);
                  if (subSub) selectedSubSubs.push({ ...subSub, parentSubCategoryId: sub.id });
                });
              }
            });
          });

          setSelectedCategories(selectedCats);
          setSelectedSubCategories(selectedSubs);
          setSelectedSubSubCategories(selectedSubSubs);

          prevSelectedProductIds.current = sellerProducts; // Save initially selected products for restore after product fetch
        }
      } catch (err) {
        console.error("Failed to fetch existing mapping", err);
      }
    };

    fetchExistingMapping();
  }, [storeId, categories]);

  // 4. Build selections for API
  const buildSelectionsForApi = () => {
    const cats = new Set();
    const subs = new Set();
    const subSubs = new Set();

    selectedSubSubCategories.forEach(subSub => {
      subSubs.add(subSub.id);
      const sub = selectedSubCategories.find(s => s.subSubCategories?.some(ss => ss.id === subSub.id));
      if (sub) subs.add(sub.id);
      const cat = selectedCategories.find(c => c.subCategories?.some(sc => sc.id === sub?.id));
      if (cat) cats.add(cat.id);
    });

    selectedSubCategories.forEach(sub => {
      subs.add(sub.id);
      const cat = selectedCategories.find(c => c.subCategories?.some(sc => sc.id === sub.id));
      if (cat) cats.add(cat.id);
    });

    selectedCategories.forEach(cat => cats.add(cat.id));

    return {
      categories: [...cats],
      subCategories: [...subs],
      subSubCategories: [...subSubs],
    };
  };

  // 5. Debounced product fetch
  const fetchProducts = useCallback(
    debounce(async () => {
      const { categories, subCategories, subSubCategories } = buildSelectionsForApi();
      if (!categories.length && !subCategories.length && !subSubCategories.length) {
        setProducts([]);
        return;
      }
      const query = new URLSearchParams();
      if (categories.length) query.append("categories", categories.join(","));
      if (subCategories.length) query.append("subCategories", subCategories.join(","));
      if (subSubCategories.length) query.append("subSubCategories", subSubCategories.join(","));

      try {
        setLoadingProducts(true);
        const res = await get(`${ENDPOINTS.GET_PRODUCTS}?${query.toString()}`);
        if (res.status === 200) {
          const fetched = res.data.products || [];
          setProducts(fetched);

          // Restore selected products only on initial load (when prevSelectedProductIds has values)
          if (prevSelectedProductIds.current.length > 0) {
            const restored = fetched.filter(p => prevSelectedProductIds.current.includes(p._id));
            setSelectedProducts(restored);
            prevSelectedProductIds.current = []; // Clear after restore
          }
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoadingProducts(false);
      }
    }, 500),
    [selectedCategories, selectedSubCategories, selectedSubSubCategories]
  );

  useEffect(() => {
    fetchProducts();
  }, [selectedCategories, selectedSubCategories, selectedSubSubCategories, fetchProducts]);

  // 6. Filter stale selectedProducts when categories/subcategories change
  useEffect(() => {
    const validSelectedProducts = selectedProducts.filter(product => {
      const isValidCategory = product.category.some(cat =>
        selectedCategories.some(selCat => selCat._id === cat._id)
      );

      const isValidSubCategory =
        product.subCategory.length === 0 ||
        product.subCategory.some(sub =>
          selectedSubCategories.some(selSub => selSub._id === sub._id)
        );

      const isValidSubSubCategory =
        product.subSubCategory.length === 0 ||
        product.subSubCategory.some(ss =>
          selectedSubSubCategories.some(selSS => selSS._id === ss._id)
        );

      return isValidCategory && isValidSubCategory && isValidSubSubCategory;
    });

    if (validSelectedProducts.length !== selectedProducts.length) {
      setSelectedProducts(validSelectedProducts);
    }
  }, [selectedCategories, selectedSubCategories, selectedSubSubCategories]);

  // 7. Submit handler
  const handleSubmit = async () => {
    const payload = {
      sellerCategories: selectedCategories.map(cat => ({
        categoryId: cat.id,
        subCategories: selectedSubCategories
          .filter(sc => sc.parentCategoryId === cat.id)
          .map(sc => ({
            subCategoryId: sc.id,
            subSubCategories: selectedSubSubCategories
              .filter(ss => ss.parentSubCategoryId === sc.id)
              .map(ss => ({ subSubCategoryId: ss.id })),
          })),
      })),
      sellerProducts: selectedProducts.map(p => p._id),
    };

    try {
      const res = await put(`${ENDPOINTS.UPDATE_PRODUCT}/${storeId}`, payload, { authRequired: true });
      if (res.status === 200) {
        alert("Saved successfully");
        navigate(-1);
      } else alert("Save failed");
    } catch (err) {
      console.error("Error saving:", err);
      alert("Save failed");
    }
  };

  return (
    <MDBox ml={miniSidenav ? "80px" : "250px"} p={2} sx={{ marginTop: "20px" }}>
      <div
        style={{
          width: "85%",
          margin: "0 auto",
          borderRadius: "10px",
          padding: "20px",
          border: "1px solid gray",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "30px", fontWeight: "bold", color: "green" }}>
          {selectedCategories.length ? "UPDATE" : "ADD"} CATEGORY TO STORE
        </h2>

        {/* Category */}
        <Autocomplete
          multiple
          options={categories}
          getOptionLabel={(opt) => `${opt.name}${opt.commison ? ` (${opt.commison}%)` : ""}`}
          value={selectedCategories}
          onChange={(e, v) => {
            setSelectedCategories(v);

            // Filter selected subCategories to only those in newly selected categories
            setSelectedSubCategories((prev) =>
              prev.filter((sub) => v.some((cat) => cat.subCategories?.some((sc) => sc.id === sub.id)))
            );

            // Filter selected subSubCategories to only those in newly selected subCategories
            setSelectedSubSubCategories((prev) =>
              prev.filter((ss) =>
                selectedSubCategories.some((sub) => sub.subSubCategories?.some((su) => su.id === ss.id))
              )
            );
          }}
          renderInput={(params) => <TextField {...params} variant="outlined" label="Select Categories" />}
          sx={{ mb: 2 }}
        />

        {/* SubCategory */}
        {selectedCategories.length > 0 && (
          <Autocomplete
            multiple
            options={selectedCategories.flatMap((cat) =>
              (cat.subCategories || []).map((sc) => ({ ...sc, parentCategoryId: cat.id }))
            )}
            getOptionLabel={(opt) => `${opt.name}${opt.commison ? ` (${opt.commison}%)` : ""}`}
            value={selectedSubCategories}
            onChange={(e, v) => {
              setSelectedSubCategories(v);

              // Filter selected subSubCategories to only those in newly selected subCategories
              setSelectedSubSubCategories((prev) =>
                prev.filter((ss) => v.some((sub) => sub.subSubCategories?.some((su) => su.id === ss.id)))
              );
            }}
            renderInput={(params) => <TextField {...params} variant="outlined" label="Select SubCategories" />}
            sx={{ mb: 2 }}
          />
        )}

        {/* Sub-SubCategory */}
        {selectedSubCategories.length > 0 && (
          <Autocomplete
            multiple
            options={selectedSubCategories.flatMap((sub) =>
              (sub.subSubCategories || []).map((ss) => ({ ...ss, parentSubCategoryId: sub.id }))
            )}
            getOptionLabel={(opt) => `${opt.name}${opt.commison ? ` (${opt.commison}%)` : ""}`}
            value={selectedSubSubCategories}
            onChange={(_, v) => setSelectedSubSubCategories(v)}
            renderInput={(params) => <TextField {...params} variant="outlined" label="Select Sub‑SubCategories" />}
            sx={{ mb: 2 }}
          />
        )}

        {/* Products */}
        {products.length > 0 && (
          <Autocomplete
            multiple
            options={products}
            getOptionLabel={(opt) => opt.productName}
            value={selectedProducts}
            onChange={(_, v) => setSelectedProducts(v)}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            renderInput={(params) => <TextField {...params} label="Select Products" variant="outlined" />}
          />
        )}

        {/* Actions */}
        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <Button
            onClick={handleSubmit}
            style={{ backgroundColor: "#00c853", color: "white", marginRight: "20px" }}
            disabled={loadingProducts}
          >
            {loadingProducts ? "Saving..." : "SAVE"}
          </Button>
          <Button onClick={() => navigate(-1)} style={{ backgroundColor: "#00c853", color: "white" }}>
            BACK
          </Button>
        </div>
      </div>
    </MDBox>
  );
};

export default AddStoreCat;