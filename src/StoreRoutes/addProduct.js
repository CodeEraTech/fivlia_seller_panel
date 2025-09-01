import React, { useState } from "react";
import { Button, TextField, MenuItem, Typography } from "@mui/material";
import MDBox from "../components/MDBox";
import { useNavigate } from "react-router-dom";

function AddSellerProduct() {
  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    approvalStatus: "pending",
    category: "",
    status: "active",
    image: null,
  });

  const sellerId = localStorage.getItem("sellerId");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleImageChange = (e) => {
    setForm({ ...form, image: e.target.files[0] });
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    Object.keys(form).forEach((key) => {
      formData.append(key, form[key]);
    });

    try {
      const res = await fetch(`https://api.fivlia.in/addSellerProduct/${sellerId}`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert("Product request sent to admin!");
        navigate("/seller-products");
      } else {
        alert("Failed to add product. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    }
  };

  return (
    <MDBox p={3} style={{ marginLeft: "250px", maxWidth: "600px" }}>
      <Typography variant="h5" style={{ marginBottom: "20px" }}>
        Add Seller Product
      </Typography>

      <TextField
        label="Product Name"
        name="name"
        fullWidth
        margin="normal"
        value={form.name}
        onChange={handleChange}
      />

      <TextField
        label="Price"
        name="price"
        type="number"
        fullWidth
        margin="normal"
        value={form.price}
        onChange={handleChange}
      />

      <TextField
        label="Stock"
        name="stock"
        type="number"
        fullWidth
        margin="normal"
        value={form.stock}
        onChange={handleChange}
      />

      <TextField
        select
        label="Status"
        name="status"
        fullWidth
        margin="normal"
        value={form.status}
        onChange={handleChange}
      >
        <MenuItem value="active">Active</MenuItem>
        <MenuItem value="inactive">Inactive</MenuItem>
      </TextField>

      <TextField
        label="Category"
        name="category"
        fullWidth
        margin="normal"
        value={form.category}
        onChange={handleChange}
      />

      <div style={{ marginTop: "20px" }}>
        <input type="file" onChange={handleImageChange} />
      </div>

      <Button
        variant="contained"
        color="primary"
        style={{ marginTop: "20px" }}
        onClick={handleSubmit}
      >
        Submit Product
      </Button>
    </MDBox>
  );
}

export default AddSellerProduct;
