import React, { useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import PreviewIcon from "@mui/icons-material/Preview";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DataTable from "react-data-table-component";
import { useNavigate } from "react-router-dom";
import MDBox from "../components/MDBox";
import { useMaterialUIController } from "../context";
import { del, get, post } from "apis/apiClient";
import { ENDPOINTS } from "apis/endpoints";
import Swal from "sweetalert2";

const INITIAL_FORM = {
  title: "",
  offerType: "free_product",
  limit: "",
  basePercent: "",
  selectedProducts: [],
  freeProduct: null,
  freeProductQuantity: "1",
  discountScope: "entire_cart",
  fromTo: "",
  validDays: "7",
  status: true,
};

const GUIDE_COPY = {
  en: {
    intro:
      "Offers are applied automatically at checkout after approval. Customers do not need to enter a coupon code.",
    points: [
      "Free Product Offer: set a minimum order amount and choose the product customers will receive free.",
      "Cart Discount Offer: set a discount percentage for the full cart or only for selected products.",
      "Selected Products: choose the exact catalog products that should receive the discount.",
      "Each new or edited offer is sent for approval before it becomes visible to customers.",
    ],
  },
  hi: {
    intro:
      "मंजूरी के बाद ऑफर checkout पर अपने आप लग जाएगा। ग्राहक को coupon code डालने की जरूरत नहीं है।",
    points: [
      "Free Product Offer: minimum order amount डालें और free मिलने वाला product चुनें।",
      "Entire cart discount: पूरे cart पर discount देने के लिए minimum amount जरूरी है।",
      "Selected products discount: सिर्फ चुने हुए products पर discount लगेगा, minimum amount नहीं पूछेगा।",
      "नया या edit किया हुआ offer पहले approval के लिए जाएगा।",
    ],
  },
};

const TABLE_STYLES = {
  headCells: {
    style: {
      fontSize: "14px",
      fontWeight: "bold",
      backgroundColor: "#3c95ef",
      color: "white",
      minHeight: "50px",
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

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN").format(Number(value || 0));

const getProductId = (product) =>
  typeof product === "string" || typeof product === "number"
    ? String(product)
    : product?._id?.toString?.() ||
      product?.productId?.toString?.() ||
      product?.id?.toString?.() ||
      "";

const getProductLabel = (product) =>
  product?.productName ||
  product?.name ||
  product?.title ||
  product?.productTitle ||
  "Product";

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const getApprovalColor = (status) => {
  if (status === "approved") return "success";
  if (status === "rejected") return "error";
  return "warning";
};

const normalizeTier = (tier) => {
  const minAmount = Number(tier?.minAmount);
  const percent = Number(tier?.percent);

  if (!Number.isFinite(minAmount) || minAmount <= 0) return null;
  if (!Number.isFinite(percent) || percent <= 0) return null;

  return { minAmount, percent };
};

const getValidTiers = (tiers = []) =>
  tiers
    .map(normalizeTier)
    .filter(Boolean)
    .sort((a, b) => a.minAmount - b.minAmount);

const getSelectedProducts = (entry) => {
  if (Array.isArray(entry?.selectedProducts)) return entry.selectedProducts;
  if (Array.isArray(entry?.productId)) return entry.productId;
  return [];
};

const getFreeProduct = (entry) => entry?.freeProduct || entry?.freeProductId || null;

const matchProductOption = (value, options = []) => {
  const id = getProductId(value);
  if (!id) return null;

  return (
    options.find((option) => getProductId(option) === id) ||
    (typeof value === "object" && value !== null
      ? { ...value, _id: id, productName: getProductLabel(value) }
      : { _id: id, productName: "Product" })
  );
};

const getOfferTiers = (entry) => {
  if (entry && Object.prototype.hasOwnProperty.call(entry, "basePercent")) {
    const baseTier = normalizeTier({
      minAmount: entry.limit,
      percent: entry.basePercent,
    });
    const extraTiers = getValidTiers(Array.isArray(entry.tiers) ? entry.tiers : []);
    return [baseTier, ...extraTiers]
      .filter(Boolean)
      .sort((a, b) => a.minAmount - b.minAmount);
  }

  const existingTiers = getValidTiers(Array.isArray(entry?.tiers) ? entry.tiers : []);
  if (existingTiers.length) return existingTiers;

  const fallbackTier = normalizeTier({
    minAmount: entry?.limit,
    percent: entry?.offer ?? entry?.discountPercent,
  });

  return fallbackTier ? [fallbackTier] : [];
};

const buildOfferPreviewText = (entry) => {
  if (!entry) return "Offer preview";

  const minimumAmount = Number(entry.limit || 0);
  const hasMinimum = Number.isFinite(minimumAmount) && minimumAmount > 0;
  const minimum = formatMoney(minimumAmount);
  const freeProduct = getFreeProduct(entry);
  const freeQuantity = Number(entry.freeProductQuantity || 1) || 1;
  const selectedProducts = getSelectedProducts(entry);
  const selectedNames = selectedProducts.map(getProductLabel).filter(Boolean);

  if (entry.offerType === "free_product") {
    return `Spend ₹${minimum} and get ${freeQuantity} ${getProductLabel(
      freeProduct,
    )} free`;
  }

  const scopeLabel =
    entry.discountScope === "selected_products"
      ? selectedNames.length
        ? `on ${selectedNames.slice(0, 2).join(", ")}${
            selectedNames.length > 2
              ? ` +${selectedNames.length - 2} more`
              : ""
          }`
        : "on selected products"
      : "on entire cart";
  const tiers = getOfferTiers(entry);
  const minimumText =
    entry.discountScope === "entire_cart" && hasMinimum
      ? ` above ₹${minimum}`
      : "";

  if (tiers.length > 1) {
    const topTier = tiers[tiers.length - 1];
    return `Get up to ${topTier.percent}% off ${scopeLabel}${minimumText}`;
  }

  const percent =
    tiers[0]?.percent ||
    Number(entry.basePercent || entry.offer || entry.discountPercent || 0);

  return `Get ${percent}% off ${scopeLabel}${minimumText}`;
};

const normalizeOfferToForm = (offer, productOptions = []) => {
  const tiers = getOfferTiers(offer);
  const baseTier = tiers[0] || null;
  const selectedProducts = getSelectedProducts(offer)
    .map((item) => matchProductOption(item, productOptions))
    .filter(Boolean);
  const freeProduct = getFreeProduct(offer)
    ? matchProductOption(getFreeProduct(offer), productOptions)
    : null;

  return {
    ...INITIAL_FORM,
    title: offer?.title || "",
    offerType:
      offer?.offerType || (getFreeProduct(offer) ? "free_product" : "cart_discount"),
    limit: offer?.limit != null ? String(offer.limit) : "",
    basePercent: baseTier ? String(baseTier.percent) : String(offer?.offer ?? ""),
    selectedProducts,
    freeProduct,
    freeProductQuantity:
      offer?.freeProductQuantity != null ? String(offer.freeProductQuantity) : "1",
    discountScope:
      offer?.discountScope ||
      (selectedProducts.length ? "selected_products" : "entire_cart"),
    fromTo: toDateInput(offer?.fromTo),
    validDays: offer?.validDays != null ? String(offer.validDays) : "7",
    status: offer?.status ?? true,
  };
};

function CouponManagement() {
  const navigate = useNavigate();
  const [controller] = useMaterialUIController();
  const { miniSidenav } = controller;
  const storeId = localStorage.getItem("sellerId");

  const [guideLanguage, setGuideLanguage] = useState("en");
  const [modalPanel, setModalPanel] = useState("preview");
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [previewOffer, setPreviewOffer] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const productOptions = products.map((product) => ({
    ...product,
    _id: getProductId(product),
    productName: getProductLabel(product),
  }));

  const shouldAskMinimumAmount =
    form.offerType === "free_product" ||
    (form.offerType === "cart_discount" &&
      form.discountScope === "entire_cart");

  const offerMetrics = {
    total: offers.length,
    active: offers.filter((offer) => offer.status).length,
    pending: offers.filter((offer) => offer.approvalStatus === "pending").length,
  };

  useEffect(() => {
    if (!storeId) {
      navigate("/seller-login", { replace: true });
    }
  }, [navigate, storeId]);

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
      console.error("Failed to fetch seller products", error);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchOffers = async () => {
    if (!storeId) return;

    setOffersLoading(true);
    try {
      const response = await get(`${ENDPOINTS.GET_COUPONS}/${storeId}`, {
        authRequired: true,
      });
      setOffers(response.data.coupons || response.data.offers || []);
    } catch (error) {
      console.error("Failed to fetch offers", error);
      setOffers([]);
      Swal.fire(
        "Load failed",
        error.response?.data?.message || "Could not load offers right now.",
        "error",
      );
    } finally {
      setOffersLoading(false);
    }
  };

  useEffect(() => {
    if (!storeId) return;
    fetchProducts();
    fetchOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const openAddModal = () => {
    setEditingOfferId(null);
    setForm(INITIAL_FORM);
    setModalPanel("preview");
    setOfferModalOpen(true);
  };

  const closeOfferModal = () => {
    if (saving) return;
    setOfferModalOpen(false);
    setEditingOfferId(null);
    setForm(INITIAL_FORM);
  };

  const handleEdit = (offer) => {
    setEditingOfferId(offer._id);
    setForm(normalizeOfferToForm(offer, productOptions));
    setModalPanel("preview");
    setOfferModalOpen(true);
  };

  const handleOfferTypeChange = (offerType) => {
    setForm((prev) => ({
      ...prev,
      offerType,
    }));
  };

  const handleDiscountScopeChange = (discountScope) => {
    setForm((prev) => ({
      ...prev,
      discountScope,
      selectedProducts:
        discountScope === "selected_products" ? prev.selectedProducts : [],
    }));
  };

  const validateForm = () => {
    if (!form.fromTo) {
      Swal.fire("Missing field", "Please choose a start date.", "warning");
      return false;
    }

    if (!form.validDays || Number(form.validDays) <= 0) {
      Swal.fire("Missing field", "Please enter valid days.", "warning");
      return false;
    }

    if (form.offerType === "free_product") {
      if (!form.limit || Number(form.limit) <= 0) {
        Swal.fire("Missing field", "Please enter a valid minimum order amount.", "warning");
        return false;
      }

      if (!form.freeProduct) {
        Swal.fire("Missing field", "Please choose the free product.", "warning");
        return false;
      }

      if (!form.freeProductQuantity || Number(form.freeProductQuantity) <= 0) {
        Swal.fire("Missing field", "Please enter a valid free quantity.", "warning");
        return false;
      }

      return true;
    }

    if (
      form.discountScope === "entire_cart" &&
      (!form.limit || Number(form.limit) <= 0)
    ) {
      Swal.fire("Missing field", "Please enter a valid minimum order amount.", "warning");
      return false;
    }

    if (!form.basePercent || Number(form.basePercent) <= 0) {
      Swal.fire("Missing field", "Please enter a valid discount percentage.", "warning");
      return false;
    }

    if (
      form.discountScope === "selected_products" &&
      !form.selectedProducts.length
    ) {
      Swal.fire(
        "Missing field",
        "Please select at least one product for selected product offers.",
        "warning",
      );
      return false;
    }

    return true;
  };

  const buildPayload = () => {
    const selectedIds = form.selectedProducts.map(getProductId).filter(Boolean);
    const offerValue = Number(form.basePercent) || 0;

    return {
      storeId,
      title: form.title.trim() || buildOfferPreviewText(form),
      offerType: form.offerType,
      discountScope:
        form.offerType === "free_product" ? "entire_cart" : form.discountScope,
      offer: form.offerType === "free_product" ? 0 : offerValue,
      limit:
        form.offerType === "free_product" ||
        form.discountScope === "entire_cart"
          ? Number(form.limit) || 0
          : 0,
      tiers: [],
      productId:
        form.offerType === "free_product" ||
        form.discountScope !== "selected_products"
          ? []
          : selectedIds,
      freeProductId:
        form.offerType === "free_product" ? getProductId(form.freeProduct) : null,
      freeProductQuantity:
        form.offerType === "free_product"
          ? Number(form.freeProductQuantity) || 1
          : 1,
      fromTo: form.fromTo,
      validDays: Number(form.validDays) || 0,
      status: Boolean(form.status),
    };
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const payload = buildPayload();
    const wasEditing = Boolean(editingOfferId);

    setSaving(true);
    try {
      const endpoint = editingOfferId
        ? `${ENDPOINTS.EDIT_OFFER}/${editingOfferId}`
        : ENDPOINTS.CREATE_OFFER;

      await post(endpoint, payload, { authRequired: true });
      await fetchOffers();
      closeOfferModal();
      Swal.fire(
        "Success",
        wasEditing ? "Offer updated successfully." : "Offer created successfully.",
        "success",
      );
    } catch (error) {
      console.error("Failed to save offer", error);
      Swal.fire("Error", error.response?.data?.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (offerId) => {
    const confirm = await Swal.fire({
      title: "Delete offer?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#d32f2f",
    });

    if (!confirm.isConfirmed) return;

    try {
      await del(`${ENDPOINTS.DELETE_OFFER}/${offerId}`, { authRequired: true });
      await fetchOffers();
      Swal.fire("Deleted", "Offer removed.", "success");
    } catch (error) {
      console.error("Failed to delete offer", error);
      Swal.fire("Error", "Delete failed", "error");
    }
  };

  const handleToggleStatus = async (offer) => {
    const expireDate = offer?.expireDate ? new Date(offer.expireDate) : null;
    if (expireDate && expireDate <= new Date() && !offer.status) {
      Swal.fire("Expired", "You cannot re-enable an expired offer.", "warning");
      return;
    }

    try {
      await post(
        `${ENDPOINTS.EDIT_OFFER}/${offer._id}`,
        { status: !offer.status },
        { authRequired: true },
      );
      await fetchOffers();
    } catch (error) {
      console.error("Failed to toggle status", error);
      Swal.fire("Error", "Status update failed", "error");
    }
  };

  const renderOfferTypeCard = (value, title, description, icon) => {
    const active = form.offerType === value;

    return (
      <Card
        onClick={() => handleOfferTypeChange(value)}
        sx={{
          cursor: "pointer",
          borderRadius: 2,
          border: "1px solid",
          borderColor: active ? "#3c95ef" : "divider",
          boxShadow: active ? "0 4px 14px rgba(60, 149, 239, 0.18)" : "none",
        }}
      >
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 1.5,
                display: "grid",
                placeItems: "center",
                bgcolor: active ? "#3c95ef" : "grey.100",
                color: active ? "white" : "text.secondary",
              }}
            >
              {icon}
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={800}>
                {title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {description}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  const renderPreviewPanel = (entry = form) => {
    const previewText = buildOfferPreviewText(entry);
    const tiers = getOfferTiers(entry);
    const freeProduct = getFreeProduct(entry);
    const selectedProducts = getSelectedProducts(entry);
    const showMinimumChip =
      entry.offerType === "free_product" ||
      (entry.offerType === "cart_discount" &&
        entry.discountScope === "entire_cart" &&
        Number(entry.limit || 0) > 0);

    return (
      <Stack spacing={1.5}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "#f8fbff",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Customer preview
          </Typography>
          <Typography variant="subtitle1" fontWeight={800} mt={0.5}>
            {entry.title || previewText}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.75}>
            {previewText}
          </Typography>
        </Paper>

        <Grid container spacing={1}>
          {showMinimumChip && (
            <Grid item xs={6}>
              <Chip
                label={`Min ₹${formatMoney(entry.limit)}`}
                variant="outlined"
                sx={{ width: "100%", justifyContent: "center" }}
              />
            </Grid>
          )}
          <Grid item xs={showMinimumChip ? 6 : 12}>
            <Chip
              label={
                entry.offerType === "free_product"
                  ? `${entry.freeProductQuantity || 1} free`
                  : `${tiers[0]?.percent || entry.basePercent || entry.offer || 0}% off`
              }
              variant="outlined"
              sx={{ width: "100%", justifyContent: "center" }}
            />
          </Grid>
        </Grid>

        {entry.offerType === "free_product" ? (
          <Alert severity="success">
            Free item: {entry.freeProductQuantity || 1} x {getProductLabel(freeProduct)}
          </Alert>
        ) : (
          <Alert severity="info">
            Applies to{" "}
            {entry.discountScope === "selected_products"
              ? `${selectedProducts.length || 0} selected product(s)`
              : "the entire cart"}
          </Alert>
        )}
      </Stack>
    );
  };

  const renderHowItWorksPanel = () => {
    const guide = GUIDE_COPY[guideLanguage];

    return (
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            style={guideLanguage === "hi" ? {color: "black"} : {color: "white"}}
            variant={guideLanguage === "en" ? "contained" : "outlined"}
            onClick={() => setGuideLanguage("en")}
          >
            English
          </Button>
          <Button
            size="small"
            style={guideLanguage === "hi" ? {color: "white"} : {color: "black"}}
            variant={guideLanguage === "hi" ? "contained" : "outlined"}
            onClick={() => setGuideLanguage("hi")}
          >
            Hindi
          </Button>
        </Stack>

        <Alert severity="info">{guide.intro}</Alert>

        {guide.points.map((point) => (
          <Typography key={point} variant="body2" color="text.secondary">
            {point}
          </Typography>
        ))}
      </Stack>
    );
  };

  const offerColumns = [
    {
      name: "Offer",
      grow: 2.5,
      cell: (row) => {
        const isFreeProduct = row.offerType === "free_product";
        const benefit = buildOfferPreviewText(row);

        return (
          <Box py={1}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="subtitle2" fontWeight={800}>
                {row.title || benefit}
              </Typography>
              <Chip
                size="small"
                label={isFreeProduct ? "Free Product" : "Cart Discount"}
                color={isFreeProduct ? "info" : "primary"}
                variant="outlined"
              />
            </Stack>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {benefit}
            </Typography>
          </Box>
        );
      },
    },
    {
      name: "Minimum",
      width: "130px",
      selector: (row) =>
        row.discountScope === "selected_products" || Number(row.limit || 0) <= 0
          ? "No minimum"
          : `₹${formatMoney(row.limit)}`,
    },
    {
      name: "Status",
      width: "160px",
      cell: (row) => (
        <Stack spacing={0.75}>
          <Chip
            size="small"
            label={row.approvalStatus || "pending"}
            color={getApprovalColor(row.approvalStatus)}
          />
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={Boolean(row.status)}
                onChange={() => handleToggleStatus(row)}
              />
            }
            label={row.status ? "Active" : "Inactive"}
          />
        </Stack>
      ),
    },
    {
      name: "Actions",
      width: "170px",
      right: true,
      cell: (row) => (
        <Stack direction="row" spacing={0.75} justifyContent="flex-end">
          <Tooltip title="Preview">
            <IconButton
              size="small"
              color="info"
              onClick={() => setPreviewOffer(row)}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleEdit(row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(row._id)}
            >
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
          pt={ { xs: 2, xl: 3 } }
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
              Offers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage automatic free product and cart discount offers.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", sm: "flex-end" }}>
            <Button
              variant="outlined"
              style={{color: "black"}}
              startIcon={<HelpOutlineIcon />}
              onClick={() => setHelpOpen(true)}
            >
              How it works
            </Button>
            <Button variant="contained" style={{color: "white"}} startIcon={<AddIcon />} onClick={openAddModal}>
              Add offer
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
              <Typography variant="caption" color="text.secondary">
                Total offers
              </Typography>
              <Typography variant="h5" fontWeight={800}>
                {offerMetrics.total}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
              <Typography variant="caption" color="text.secondary">
                Active
              </Typography>
              <Typography variant="h5" fontWeight={800}>
                {offerMetrics.active}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
              <Typography variant="caption" color="text.secondary">
                Pending approval
              </Typography>
              <Typography variant="h5" fontWeight={800}>
                {offerMetrics.pending}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

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
            <Typography variant="h6" fontWeight={800}>
              Offer list
            </Typography>
            <Button size="small" variant="contained" style={{color: "white"}} startIcon={<AddIcon />} onClick={openAddModal}>
              Add offer
            </Button>
          </Box>

          <Box sx={{ p: 1.5 }}>
            {offersLoading ? (
              <Alert severity="info">Loading offers...</Alert>
            ) : (
              <DataTable
                columns={offerColumns}
                data={offers}
                keyField="_id"
                customStyles={TABLE_STYLES}
                noHeader
                responsive
                highlightOnHover
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[10, 25, 50]}
                noDataComponent={<Alert severity="info">No offers yet.</Alert>}
              />
            )}
          </Box>
        </Paper>
      </Stack>

      <Dialog
        open={offerModalOpen}
        onClose={closeOfferModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h5" fontWeight={800}>
                {editingOfferId ? "Edit offer" : "Add offer"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Simple setup for automatic checkout offers.
              </Typography>
            </Box>
            <IconButton onClick={closeOfferModal} disabled={saving}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={8}>
              <Stack spacing={2.25}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    {renderOfferTypeCard(
                      "free_product",
                      "Free Product Offer",
                      "Set a spend amount and choose a free product.",
                      <AutoAwesomeIcon />,
                    )}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    {renderOfferTypeCard(
                      "cart_discount",
                      "Cart Discount Offer",
                      "Discount the full cart or selected products.",
                      <LocalOfferIcon />,
                    )}
                  </Grid>
                </Grid>

                <TextField
                  label="Offer name"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  helperText="This name is visible to customers."
                  fullWidth
                />

                <Grid container spacing={2}>
                  {shouldAskMinimumAmount && (
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Minimum order amount"
                        type="number"
                        value={form.limit}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, limit: e.target.value }))
                        }
                        fullWidth
                      />
                    </Grid>
                  )}
                  <Grid item xs={12} md={shouldAskMinimumAmount ? 4 : 6}>
                    <TextField
                      label="Starts on"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={form.fromTo}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, fromTo: e.target.value }))
                      }
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={shouldAskMinimumAmount ? 4 : 6}>
                    <TextField
                      label="Valid days"
                      type="number"
                      value={form.validDays}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, validDays: e.target.value }))
                      }
                      fullWidth
                    />
                  </Grid>
                </Grid>

                {form.offerType === "free_product" ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <Autocomplete
                        options={productOptions}
                        loading={productsLoading}
                        value={form.freeProduct}
                        onChange={(_, value) =>
                          setForm((prev) => ({ ...prev, freeProduct: value }))
                        }
                        isOptionEqualToValue={(option, value) =>
                          getProductId(option) === getProductId(value)
                        }
                        getOptionLabel={getProductLabel}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Free product"
                            helperText="Product added free when condition is met."
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Free quantity"
                        type="number"
                        value={form.freeProductQuantity}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            freeProductQuantity: e.target.value,
                          }))
                        }
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                ) : (
                  <Stack spacing={2}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          label="Discount %"
                          type="number"
                          value={form.basePercent}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              basePercent: e.target.value,
                            }))
                          }
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} md={5}>
                        <TextField
                          select
                          label="Apply to"
                          value={form.discountScope}
                          onChange={(e) =>
                            handleDiscountScopeChange(e.target.value)
                          }
                          fullWidth
                        >
                          <MenuItem value="entire_cart">Entire cart</MenuItem>
                          <MenuItem value="selected_products">
                            Selected products
                          </MenuItem>
                        </TextField>
                      </Grid>
                    </Grid>

                    {form.discountScope === "selected_products" && (
                      <Autocomplete
                        multiple
                        options={productOptions}
                        loading={productsLoading}
                        value={form.selectedProducts}
                        onChange={(_, value) =>
                          setForm((prev) => ({
                            ...prev,
                            selectedProducts: value,
                          }))
                        }
                        isOptionEqualToValue={(option, value) =>
                          getProductId(option) === getProductId(value)
                        }
                        getOptionLabel={getProductLabel}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Selected products"
                            helperText="Only these products receive discount."
                          />
                        )}
                      />
                    )}
                  </Stack>
                )}

                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(form.status)}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          status: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Active"
                />
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
              >
                <Stack direction="row" spacing={1} mb={2}>
                  <Button
                    size="small"
                    style={{color: "white"}}
                    variant={modalPanel === "preview" ? "contained" : "outlined"}
                    startIcon={<PreviewIcon />}
                    onClick={() => setModalPanel("preview")}
                  >
                    Preview
                  </Button>
                  <Button
                    size="small"
                    variant={modalPanel === "help" ? "contained" : "outlined"}
                    startIcon={<HelpOutlineIcon />}
                    style={{color: "black"}}
                    onClick={() => setModalPanel("help")}
                  >
                    How it works
                  </Button>
                </Stack>
                {modalPanel === "preview" ? renderPreviewPanel() : renderHowItWorksPanel()}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeOfferModal} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" style={{color: "white"}} onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : editingOfferId ? "Update offer" : "Create offer"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(previewOffer)}
        onClose={() => setPreviewOffer(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" fontWeight={800}>
              Offer preview
            </Typography>
            <IconButton onClick={() => setPreviewOffer(null)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {previewOffer && renderPreviewPanel(previewOffer)}
        </DialogContent>
      </Dialog>

      <Dialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" fontWeight={800}>
              How it works
            </Typography>
            <IconButton onClick={() => setHelpOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>{renderHowItWorksPanel()}</DialogContent>
      </Dialog>
    </MDBox>
  );
}

export default CouponManagement;
