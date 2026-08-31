import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ImageIcon from "@mui/icons-material/Image";
import DataTable from "react-data-table-component";
import MDBox from "../components/MDBox";
import { useMaterialUIController } from "../context";
import { del, get, post, put } from "apis/apiClient";
import { ENDPOINTS } from "apis/endpoints";
import Swal from "sweetalert2";

const EMPTY_FORM = {
  title: "",
  products: [],
};

const TABLE_STYLES = {
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

const getProductId = (product) =>
  product?._id || product?.productId || product?.sellerProductId || "";

const getProductLabel = (product) =>
  product?.productName || product?.name || "Unnamed product";

const imageUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${process.env.REACT_APP_IMAGE_LINK || ""}${path}`;
};

function MenuCards() {
  const [controller] = useMaterialUIController();
  const { miniSidenav } = controller;
  const storeId = localStorage.getItem("sellerId");

  const [menuCards, setMenuCards] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMenuCard, setEditingMenuCard] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        ...product,
        _id: getProductId(product),
        productName: getProductLabel(product),
      })),
    [products],
  );

  const fetchProducts = async () => {
    if (!storeId) return;

    setProductsLoading(true);
    try {
      const params = new URLSearchParams({
        sellerId: storeId,
        page: 1,
        limit: 500,
        search: "",
      });
      const response = await get(
        `${ENDPOINTS.GET_SELLER_PRODUCTS}?${params.toString()}`,
        { authRequired: true },
      );
      setProducts(response.data.products || []);
    } catch (error) {
      console.error("Failed to fetch products", error);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchMenuCards = async () => {
    if (!storeId) return;

    setLoading(true);
    try {
      const response = await get(ENDPOINTS.GET_MENU_CARD, {
        params: { sellerId: storeId },
        authRequired: true,
      });
      setMenuCards(response.data.menuCards || []);
    } catch (error) {
      console.error("Failed to fetch menu cards", error);
      setMenuCards([]);
      Swal.fire(
        "Load failed",
        error.response?.data?.message || "Could not load menu cards right now.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchMenuCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const openAddModal = () => {
    setEditingMenuCard(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview("");
    setModalOpen(true);
  };

  const openEditModal = (menuCard) => {
    const selectedIds = new Set(
      (menuCard?.products || []).map((product) => getProductId(product)),
    );

    setEditingMenuCard(menuCard);
    setForm({
      title: menuCard?.title || "",
      products: productOptions.filter((product) =>
        selectedIds.has(getProductId(product)),
      ),
    });
    setImageFile(null);
    setImagePreview(imageUrl(menuCard?.image));
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingMenuCard(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview("");
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    setImageFile(file);
    setImagePreview(
      file ? URL.createObjectURL(file) : imageUrl(editingMenuCard?.image),
    );
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      Swal.fire("Missing field", "Please add a menu card title.", "warning");
      return false;
    }

    if (!editingMenuCard?.image && !imageFile) {
      Swal.fire("Missing field", "Please select a menu card image.", "warning");
      return false;
    }

    if (!form.products.length) {
      Swal.fire("Missing field", "Please select at least one product.", "warning");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const payload = new FormData();
    payload.append("sellerId", storeId);
    payload.append("title", form.title.trim());
    payload.append(
      "products",
      JSON.stringify(form.products.map(getProductId).filter(Boolean)),
    );
    if (imageFile) payload.append("image", imageFile);

    setSaving(true);
    try {
      if (editingMenuCard?._id) {
        await put(`${ENDPOINTS.EDIT_MENU_CARD}/${editingMenuCard._id}`, payload, {
          authRequired: true,
        });
      } else {
        await post(ENDPOINTS.UPSERT_MENU_CARD, payload, { authRequired: true });
      }

      await fetchMenuCards();
      closeModal();
      Swal.fire(
        "Success",
        editingMenuCard
          ? "Menu card updated successfully."
          : "Menu card created successfully.",
        "success",
      );
    } catch (error) {
      console.error("Failed to save menu card", error);
      Swal.fire("Error", error.response?.data?.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (menuCard) => {
    const confirm = await Swal.fire({
      title: "Delete menu card?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#d32f2f",
    });

    if (!confirm.isConfirmed) return;

    try {
      await del(`${ENDPOINTS.DELETE_MENU_CARD}/${menuCard._id}`, {
        authRequired: true,
      });
      await fetchMenuCards();
      Swal.fire("Deleted", "Menu card removed.", "success");
    } catch (error) {
      console.error("Failed to delete menu card", error);
      Swal.fire("Error", error.response?.data?.message || "Delete failed", "error");
    }
  };

  const columns = [
    {
      name: "Image",
      width: "90px",
      center: true,
      cell: (row) => (
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 1,
            bgcolor: "#eef4fb",
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          {row.image ? (
            <Box
              component="img"
              src={imageUrl(row.image)}
              alt={row.title}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <ImageIcon color="disabled" fontSize="small" />
          )}
        </Box>
      ),
    },
    {
      name: "Title",
      selector: (row) => row.title,
      sortable: true,
      wrap: true,
    },
    {
      name: "Products",
      grow: 2,
      cell: (row) => {
        const names = (row.products || []).map(getProductLabel);
        const visibleNames = names.slice(0, 3);
        const extraCount = names.length - visibleNames.length;

        return (
          <Stack direction="row" gap={0.75} flexWrap="wrap" py={0.5}>
            {visibleNames.map((name, index) => (
              <Chip key={`${row._id}-${name}-${index}`} label={name} size="small" />
            ))}
            {extraCount > 0 && (
              <Chip label={`+${extraCount} more`} size="small" variant="outlined" />
            )}
          </Stack>
        );
      },
    },
    {
      name: "Actions",
      width: "130px",
      center: true,
      cell: (row) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Edit menu card">
            <IconButton size="small" color="primary" onClick={() => openEditModal(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete menu card">
            <IconButton size="small" color="error" onClick={() => handleDelete(row)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
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
      <Stack spacing={2.5}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
        >
          <Box>
            <Typography variant="h4" fontWeight={800}>
              Menu Cards
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage seller menu cards and their selected products.
            </Typography>
          </Box>

          <Button
            variant="contained"
            style={{ color: "white" }}
            startIcon={<AddIcon />}
            onClick={openAddModal}
          >
            Add menu card
          </Button>
        </Stack>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              bgcolor: "#f8f9fa",
              borderBottom: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={800}>
                Menu card list
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Ideal image size: 512 x 512 px.
              </Typography>
            </Box>
            <Button
              size="small"
              variant="contained"
              style={{ color: "white" }}
              startIcon={<AddIcon />}
              onClick={openAddModal}
            >
              Add
            </Button>
          </Box>

          <Box sx={{ p: 1.5 }}>
            {loading ? (
              <Alert severity="info">Loading menu cards...</Alert>
            ) : (
              <DataTable
                columns={columns}
                data={menuCards}
                keyField="_id"
                customStyles={TABLE_STYLES}
                noHeader
                responsive
                highlightOnHover
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[10, 25, 50]}
                noDataComponent={<Alert severity="info">No menu cards yet.</Alert>}
              />
            )}
          </Box>
        </Paper>
      </Stack>

      <Dialog
        open={modalOpen}
        onClose={closeModal}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h5" fontWeight={800}>
                {editingMenuCard ? "Edit menu card" : "Add menu card"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select an image and the products for this menu card.
              </Typography>
            </Box>
            <IconButton onClick={closeModal} disabled={saving}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2.25}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
              fullWidth
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<ImageIcon />}
                  fullWidth
                  style={{ color: "gray" }}
                  sx={{ height: 48 }}
                >
                  Select image
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </Button>
                <Typography variant="caption" color="text.secondary" display="block" mt={0.75}>
                  Ideal image size: 512 x 512 px.
                </Typography>
                {imageFile && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {imageFile.name}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} md={7}>
                <Box
                  sx={{
                    width: 96,
                    height: 96,
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "#f8f9fa",
                    overflow: "hidden",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {imagePreview ? (
                    <Box
                      component="img"
                      src={imagePreview}
                      alt="Menu card preview"
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <ImageIcon color="disabled" sx={{ fontSize: 36 }} />
                  )}
                </Box>
              </Grid>
            </Grid>

            <Autocomplete
              multiple
              options={productOptions}
              loading={productsLoading}
              value={form.products}
              onChange={(_, value) =>
                setForm((prev) => ({ ...prev, products: value }))
              }
              isOptionEqualToValue={(option, value) =>
                getProductId(option) === getProductId(value)
              }
              getOptionLabel={getProductLabel}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Products"
                  helperText="Product names are shown here; product IDs are saved."
                />
              )}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeModal} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            style={{ color: "white" }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save menu card"}
          </Button>
        </DialogActions>
      </Dialog>
    </MDBox>
  );
}

export default MenuCards;
