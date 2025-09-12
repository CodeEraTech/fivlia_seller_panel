import React, { useEffect, useState } from "react";
import MDBox from "../components/MDBox";
import { useMaterialUIController } from "../context";
import { useNavigate } from "react-router-dom";
import { Button, Checkbox, Modal, CircularProgress, Box} from "@mui/material";
import DataTable from "react-data-table-component";
import { ENDPOINTS } from "../apis/endpoints";
import { get, put } from "../apis/apiClient";

const AddStoreCat = () => {
  const navigate = useNavigate();
  const [controller] = useMaterialUIController();
  const { miniSidenav } = controller;

  const [storeId, setStoreId] = useState("");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [selectedSubSubCategories, setSelectedSubSubCategories] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [step, setStep] = useState(0);

  const [openModal, setOpenModal] = useState(false);
  const [modalImage, setModalImage] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("sellerId");
    if (id) setStoreId(id);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await get(ENDPOINTS.CATEGORIES);
        if (res.status === 200) setCategories(res.data.categories || []);
      } catch (err) {
        console.error("Error fetching categories", err);
      } finally {
        setLoading(false); // ✅ Hide Loader
      }
    };
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    const query = new URLSearchParams();
    if (selectedCategories.length) query.append("categories", selectedCategories.map(c => c.id).join("%"));
    if (selectedSubCategories.length) query.append("subCategories", selectedSubCategories.map(s => s.id).join("%"));
    if (selectedSubSubCategories.length) query.append("subSubCategories", selectedSubSubCategories.map(ss => ss.id).join("%"));
    setLoading(true); 
    try {
      const res = await get(`${ENDPOINTS.GET_PRODUCTS}?${query.toString()}`);
      if (res.status === 200) setProducts(res.data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (item, selectedList, setSelectedList) => {
    const id = item.id || item._id;
    const exists = selectedList.some(i => (i.id || i._id) === id);
    if (exists) setSelectedList(selectedList.filter(i => (i.id || i._id) !== id));
    else setSelectedList([...selectedList, item]);
  };

  const handleNext = async () => {
    if (step === 1) {
      const hasSubSub = selectedSubCategories.some(sc => sc.subSubCategories?.length > 0);
      if (!hasSubSub) {
        await fetchProducts();
        setStep(3);
        return;
      }
    }
    if (step === 2) await fetchProducts();
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    if (step === 3 && !selectedSubCategories.some(sc => sc.subSubCategories?.length > 0)) {
      setStep(1);
    } else setStep(prev => Math.max(prev - 1, 0));
  };

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
    setSubmitting(true); 
    try {
      const res = await put(`${ENDPOINTS.UPDATE_PRODUCT}/${storeId}`, payload, { authRequired: true });
      if (res.status === 200) {
        alert("Saved successfully");
        navigate(-1);
      } else alert("Save failed");
    } catch (err) {
      console.error(err);
      alert("Save failed");
    } finally {
      setSubmitting(false); // ✅ Hide Loader
    }
  };

  const renderImage = (item, key = "image") => {
    const src = item[key]
      ? item[key].startsWith("http")
        ? item[key]
        : `${process.env.REACT_APP_IMAGE_LINK}${item[key]}`
      : "/placeholder.png";

    return (
      <div style={{ width: 50, height: 50, overflow: "hidden", borderRadius: 4, cursor: "pointer" }}
        onClick={() => { setModalImage(src); setOpenModal(true); }}
      >
        <img
          src={src}
          alt={item.name || item.productName}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    );
  };

  const customStyles = {
    headCells: {
      style: {
        backgroundColor: "#1A73E8",
        color: "white",
        fontWeight: "bold",
        fontSize: "16px", 
      },
    },
    rows: {
      style: {
        minHeight: "60px", // reduce row height
        fontSize: "15px", 
      },
    },
  };

  const getStepData = () => {
    switch (step) {
      case 0: {
        const columns = [
          { name: "Sr No.", cell: (row, index) => index + 1, width: "13%" },
          { name: "Image", cell: row => renderImage(row, "image"), width: "10%" },
          { name: "Name", selector: row => row.name },
          { name: "Sub Categories", selector: row => (row.subCategories || []).length, width: "20%" },
          { name: "Products", selector: row => row.productCount || 0, width: "100px" },
         {
  name: (
    <Checkbox
      indeterminate={
        selectedCategories.length > 0 &&
        selectedCategories.length < categories.length
      }
      checked={
        categories.length > 0 &&
        selectedCategories.length === categories.length
      }
      onChange={(e) => {
        if (e.target.checked) {
          setSelectedCategories(categories); // select all
        } else {
          setSelectedCategories([]); // unselect all
        }
      }}
    />
  ),
  cell: row => (
    <Checkbox
      checked={selectedCategories.some(c => c.id === row.id)}
      onChange={() => toggleSelection(row, selectedCategories, setSelectedCategories)}
    />
  ),
  width: "100px"
}

        ];
        return <DataTable columns={columns} data={categories} customStyles={customStyles} pagination highlightOnHover pointerOnHover paginationRowsPerPageOptions={[30, 50, 100]} paginationPerPage={30}/>;
      }
      case 1: {
        const subCats = selectedCategories.flatMap(cat =>
          (cat.subCategories || []).map(sc => ({ ...sc, parentCategoryId: cat.id }))
        );
        const columns = [
          { name: "Sr No.", cell: (row, index) => index + 1, width: "13%" },
          { name: "Image", cell: row => renderImage(row, "image"), width: "10%" },
          { name: "Name", selector: row => row.name },
          { name: "Commission", selector: row => row.commission ?? row.commison ?? 0,cell: row => `${row.commission ?? row.commison ?? 0}%`, width: "14%" },
          { name: "Sub Sub Categories", selector: row => (row.subSubCategories || []).length, width: "22%" },
          { name: "Products", selector: row => row.productCount || 0, width: "100px" },
        {
  name: (
    <Checkbox
      indeterminate={
        selectedSubCategories.length > 0 &&
        selectedSubCategories.length < subCats.length
      }
      checked={
        subCats.length > 0 &&
        selectedSubCategories.length === subCats.length
      }
      onChange={(e) => {
        if (e.target.checked) {
          setSelectedSubCategories(subCats);
        } else {
          setSelectedSubCategories([]);
        }
      }}
    />
  ),
  cell: row => (
    <Checkbox
      checked={selectedSubCategories.some(sc => sc.id === row.id)}
      onChange={() => toggleSelection(row, selectedSubCategories, setSelectedSubCategories)}
    />
  ),
  width: "100px"
}

        ];
        return <DataTable columns={columns} data={subCats} customStyles={customStyles} pagination highlightOnHover pointerOnHover paginationRowsPerPageOptions={[30, 50, 100]} paginationPerPage={30}/>;
      }
      case 2: {
        const subSubCats = selectedSubCategories.flatMap(sub =>
          (sub.subSubCategories || []).map(ss => ({ ...ss, parentSubCategoryId: sub.id }))
        );
        const columns = [
          { name: "Sr No.", cell: (row, index) => index + 1, width: "13%" },
          { name: "Image", cell: row => renderImage(row, "image"), width: "10%" },
          { name: "Name", selector: row => row.name },
          { name: "Commission", selector: row => row.commission ?? row.commison ?? 0,cell: row => `${row.commission ?? row.commison ?? 0}%`, width: "22%" },
          { name: "Products", selector: row => row.productCount || 0, width: "19%" },
         {
  name: (
    <Checkbox
      indeterminate={
        selectedSubSubCategories.length > 0 &&
        selectedSubSubCategories.length < subSubCats.length
      }
      checked={
        subSubCats.length > 0 &&
        selectedSubSubCategories.length === subSubCats.length
      }
      onChange={(e) => {
        if (e.target.checked) {
          setSelectedSubSubCategories(subSubCats);
        } else {
          setSelectedSubSubCategories([]);
        }
      }}
    />
  ),
            cell: row => (
              <Checkbox
                checked={selectedSubSubCategories.some(ss => ss.id === row.id)}
                onChange={() => toggleSelection(row, selectedSubSubCategories, setSelectedSubSubCategories)}
              />
            ),
            width: "100px"
          }
        ];
        return <DataTable columns={columns} data={subSubCats} customStyles={customStyles} pagination highlightOnHover pointerOnHover paginationRowsPerPageOptions={[30, 50, 100]} paginationPerPage={30}/>;
      }
      case 3: {
        const columns = [
          { name: "Sr No.", cell: (row, index) => index + 1, width: "10%" },
          { name: "Image", cell: row => renderImage(row, "productThumbnailUrl"), width: "10%" },
          { name: "Name", selector: row => row.productName },
                   {
  name: (
    <Checkbox
      indeterminate={
        selectedProducts.length > 0 &&
        selectedProducts.length < products.length
      }
      checked={
        products.length > 0 &&
        selectedProducts.length === products.length
      }
      onChange={(e) => {
        if (e.target.checked) {
          setSelectedProducts(products);
        } else {
          setSelectedProducts([]);
        }
      }}
    />
  ),
            cell: row => (
              <Checkbox
                checked={selectedProducts.some(p => p._id === row._id)}
                onChange={() => {
                  if (selectedProducts.some(p => p._id === row._id))
                    setSelectedProducts(selectedProducts.filter(p => p._id !== row._id));
                  else setSelectedProducts([...selectedProducts, row]);
                }}
              />
            ),
            width: "100px"
          }
        ];
        return <DataTable columns={columns} data={products} customStyles={customStyles} pagination highlightOnHover pointerOnHover paginationRowsPerPageOptions={[30, 50, 100]} paginationPerPage={30}/>;
      }
      default:
        return null;
    }
  };

  const getHeader = () => ["Main Categories", "Sub Categories", "Sub Sub Categories", "Products"][step];

  return (
    <MDBox ml={miniSidenav ? "80px" : "250px"} p={2} sx={{ marginTop: "20px" }}>

      {/* ✅ Full-Screen Loading Overlay */}
 {loading && (
        <Box
          sx={{
            position: "absolute",
            top: -10,
            left: 130,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(255,255,255,0.7)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "10px",
          }}
        >
          <CircularProgress />
        </Box>
      )}

      <div style={{ width: "95%", margin: "0 auto", padding: "20px", border: "1px solid gray", borderRadius: "10px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px", color: "green" }}>{getHeader()}</h2>
        {getStepData()}
        <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between" }}>
          <Button disabled={step === 0} onClick={handlePrev} variant="contained"   style={{ backgroundColor: "#989898ff", color: "white" }}>Previous</Button>
          {step < 3 ? (
            <Button
              onClick={handleNext}
              variant="contained"
              style={{ backgroundColor: "#1A73E8", color: "white" }}
              disabled={
                (step === 0 && selectedCategories.length === 0) ||
                (step === 1 && selectedSubCategories.length === 0) ||
                (step === 2 && selectedSubSubCategories.length === 0)
              }
            >
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} variant="contained" color="success" disabled={selectedProducts.length === 0}> {submitting ? <CircularProgress size={22} color="inherit" /> : "Submit"}</Button>
          )}
        </div>
      </div>

      {/* Modal for image preview */}
      <Modal open={openModal} onClose={() => setOpenModal(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop:"-2%"}}>
        <div style={{ maxWidth: "80%", maxHeight: "80%",overflow: "auto", }}>
          <img src={modalImage} alt="Preview" style={{
        maxWidth: "100%",
        maxHeight: "100%",
        height: "auto",
        width: "auto",
        objectFit: "contain",
        borderRadius: 8,
        display: "block",
        margin: "0 auto"
      }}
    />
        </div>
      </Modal>
    </MDBox>
  );
};

export default AddStoreCat;
