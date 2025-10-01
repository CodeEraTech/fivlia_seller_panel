import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Fade,
  Switch,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import RoomIcon from "@mui/icons-material/Room";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { useMaterialUIController } from "context";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet";
import MDBox from "components/MDBox";

// Configure Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

export default function SellerProfile() {
  const [controller] = useMaterialUIController();
  const { miniSidenav } = controller;
  const navigate = useNavigate();

  // States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const id = localStorage.getItem("sellerId");

  const [form, setForm] = useState({
    ownerName: "",
    storeName: "",
    email: "",
    PhoneNumber: "",
    gstNumber: "",
    fsiNumber: "",
    image: "",
    aadharCard: "",
    sellerSignature: "",
    invoicePrefix: "",
    advertisementImages: [],
    openTime: "",
    closeTime: "",
  });

  const [bankDetails, setBankDetails] = useState({});
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    ifsc: "",
    branch: "",
  });

  const [address, setAddress] = useState({
    city: "",
    cityId: "",
    zone: "",
    zoneTitle: "",
    lat: "",
    lng: "",
    status: "approved",
  });
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const mapRef = useRef(null);
  const [cityOptions, setCityOptions] = useState([]);
  const [zoneOptions, setZoneOptions] = useState([]);
  const [zoneRadius, setZoneRadius] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: "", severity: "info" });
  const [zoneCenter, setZoneCenter] = useState(null);
  const [markerPosition, setMarkerPosition] = useState({ lat: 29.1492, lng: 75.7217 });
  const [message, setMessage] = useState("");

  // Effects
  useEffect(() => {
    fetchCities();
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!profile || cityOptions.length === 0) return;

    const selectedCity = cityOptions.find((c) => c.city === address.city);
    if (!selectedCity) return;

    setZoneOptions(selectedCity.zones || []);

    if (address.zone && selectedCity.zones?.length) {
      const selectedZone = selectedCity.zones.find((z) => z._id === address.zone);
      if (selectedZone) {
        const newCenter = { lat: selectedZone.latitude, lng: selectedZone.longitude };
        setZoneRadius(selectedZone.range);
        setZoneCenter(newCenter);
        setMarkerPosition(newCenter);
      }
    }
  }, [profile, cityOptions, address.city, address.zone]);

  // Fetch functions
  async function fetchProfile() {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/getSeller?id=${id}&limit=1`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load");

      const data = json.store || json;
      setProfile(data);
      setForm({
        ownerName: data.ownerName || "",
        storeName: data.storeName || "",
        email: data.email || "",
        PhoneNumber: data.PhoneNumber || "",
        gstNumber: data.gstNumber || "",
        fsiNumber: data.fsiNumber || "",
        image: data.image || "",
        aadharCard: Array.isArray(data.aadharCard) ? data.aadharCard[0] : (data.aadharCard || ""),
        sellerSignature: data.sellerSignature || "",
        invoicePrefix: data.invoicePrefix || "",
        advertisementImages: Array.isArray(data.advertisementImages) ? data.advertisementImages : [],
        openTime: data.openTime || "",
        closeTime: data.closeTime || "",
      });
      setBankDetails(data.bankDetails || {});
      setAddress({
        cityId: data.city?._id || "",
        city: data.city?.name || data.city || "",
        zone: data.zone?.[0]?._id || data.zone?._id || "",
        zoneTitle: data.zone?.[0]?.title || data.zone?.title || "",
        lat: data.Latitude || data.lat || "",
        lng: data.Longitude || data.lng || "",
        status: data.approveStatus || "approved",
      });
      setMarkerPosition({
        lat: parseFloat(data.Latitude) || 29.1492,
        lng: parseFloat(data.Longitude) || 75.7217,
      });
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCities() {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/getAllZone`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load cities");
      setCityOptions(Array.isArray(json) ? json : json.data || []);
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Failed to load cities");
    }
  }

  const handleAdImages = (files) => {
    const fileArray = Array.from(files);
    const loadImage = (file) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ file, width: img.width, height: img.height });
        img.onerror = () => resolve({ file, width: null, height: null });
        img.src = URL.createObjectURL(file);
      });

    Promise.all(fileArray.map(loadImage)).then((results) => {
      const validFiles = [];
      const invalidFiles = [];

      results.forEach(({ file, width, height }) => {
        if (width === 1500 && height === 620) {
          validFiles.push(file);
        } else {
          invalidFiles.push(`${file.name} (${width || "?"}×${height || "?"})`);
        }
      });

      if (invalidFiles.length > 0) {
        setAlert({
          open: true,
          message: `These images must be 1500×620: ${invalidFiles.join(", ")}`,
          severity: "error",
        });
      }

      setForm((prev) => {
        const current = prev.advertisementImages || [];
        const combined = [...current, ...validFiles];
        if (combined.length > 4) {
          setAlert({
            open: true,
            message: "You can upload a maximum of 4 advertisement images.",
            severity: "warning",
          });
          return prev;
        }
        return { ...prev, advertisementImages: combined };
      });
    });
  };

  // Profile handlers
  function handleFormChange(key, value) {
    if (key === "advertisementImages") {
      const newFiles = Array.from(value);
      setForm((p) => {
        const currentFiles = p.advertisementImages || [];
        const totalFiles = [...currentFiles, ...newFiles];
        if (totalFiles.length > 4) {
          setMessage("You can upload a maximum of 4 advertisement images.");
          return p;
        }
        return { ...p, [key]: totalFiles };
      });
    } else {
      setForm((p) => ({ ...p, [key]: value }));
    }
  }

  async function handleProfileSave() {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("ownerName", form.ownerName);
      formData.append("storeName", form.storeName);
      formData.append("email", form.email);
      formData.append("PhoneNumber", form.PhoneNumber);
      formData.append("gstNumber", form.gstNumber);
      formData.append("invoicePrefix", form.invoicePrefix);
      formData.append("openTime", form.openTime);
      formData.append("closeTime", form.closeTime);
      if (form.image instanceof File) {
        formData.append("image", form.image);
      }
      if (form.aadharCard instanceof File) {
        formData.append("aadharCard", form.aadharCard);
      }
      if (form.sellerSignature instanceof File) {
        formData.append("file", form.sellerSignature);
      }
      form.advertisementImages.forEach((file) => {
        if (file instanceof File) {
          formData.append("MultipleImage", file);
        }
      });

      const res = await fetch(`http://127.0.0.1:8080/editSellerProfile/${id}`, {
        method: "PUT",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Save failed");

      setMessage("Profile saved successfully");
      fetchProfile();
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // Bank handlers
  function openBankDialog() {
    setBankForm({
      bankName: bankDetails.bankName || "",
      accountHolder: bankDetails.accountHolder || "",
      accountNumber: bankDetails.accountNumber || "",
      ifsc: bankDetails.ifsc || "",
      branch: bankDetails.branch || "",
    });
    setBankDialogOpen(true);
  }

  async function saveBankAccount() {
    if (!bankForm.bankName || !bankForm.accountHolder || !bankForm.accountNumber) {
      setMessage("Bank name, account holder, and account number are required.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/editSellerProfile/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankDetails: bankForm }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Bank save failed");

      setBankDialogOpen(false);
      setMessage("Bank details saved successfully");
      fetchProfile();
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Bank save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBank() {
    const result = await Swal.fire({
      title: "Delete Bank Account",
      text: "Are you sure you want to delete this bank account?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    try {
      setSaving(true);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/editSellerProfile/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankDetails: {} }),
      });
      if (!res.ok) throw new Error("Delete failed");
      setMessage("Bank account deleted successfully");
      fetchProfile();
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  // Address handlers
  function openAddressDialog() {
    setAddressDialogOpen(true);
    setTimeout(() => {
      tryInitMap();
    }, 300);
  }

  function handleAddressChange(field, value) {
    if (field === "city") {
      setAddress((p) => ({ ...p, city: value, cityId: cityOptions.find((c) => c.city === value)?._id || "", zone: "", zoneTitle: "" }));
      const selectedCity = cityOptions.find((c) => c.city === value);
      setZoneOptions(selectedCity?.zones || []);
      setZoneRadius(null);
      setZoneCenter(null);
    } else if (field === "zone") {
      const selectedCity = cityOptions.find((c) => c.city === address.city);
      const selectedZone = selectedCity?.zones.find((z) => z._id === value);
      setAddress((p) => ({ ...p, zone: value, zoneTitle: selectedZone?.zoneTitle || "" }));
      if (selectedZone) {
        const newCenter = { lat: selectedZone.latitude, lng: selectedZone.longitude };
        setMarkerPosition(newCenter);
        setAddress((p) => ({
          ...p,
          lat: selectedZone.latitude,
          lng: selectedZone.longitude,
        }));
        setZoneRadius(selectedZone.range);
        setZoneCenter(newCenter);
      }
    }
  }

  function tryInitMap() {
    if (mapRef.current) return;
    const wrapper = document.getElementById("seller-map");
    if (!wrapper) return;

    mapRef.current = true;
  }

  function MapUpdater() {
    const map = useMapEvents({
      click: (e) => {
        if (!zoneCenter || !zoneRadius) {
          setMarkerPosition(e.latlng);
          setAddress((p) => ({
            ...p,
            lat: e.latlng.lat,
            lng: e.latlng.lng,
          }));
          return;
        }

        const clickedLat = e.latlng.lat;
        const clickedLon = e.latlng.lng;
        const distance = L.latLng(zoneCenter.lat, zoneCenter.lng).distanceTo(
          L.latLng(clickedLat, clickedLon)
        );

        if (distance > zoneRadius) {
          Swal.fire("Error", "You clicked outside the allowed zone!", "error");
          return;
        }

        setMarkerPosition(e.latlng);
        setAddress((p) => ({
          ...p,
          lat: clickedLat,
          lng: clickedLon,
        }));
      },
    });

    useEffect(() => {
      map.setView(markerPosition, map.getZoom());
    }, [markerPosition, map]);

    return null;
  }

  async function submitAddressUpdateRequest() {
    if (!address.city || !address.zone) {
      setMessage("City and zone are required.");
      return;
    }

    const selectedZoneId = address.zone;
    const selectedCity = cityOptions.find((c) => c.city === address.city);
    const selectedZone = selectedCity?.zones.find((z) => z._id === selectedZoneId);

    if (!selectedZone) {
      setMessage("Selected zone not found. Please re-select the zone.");
      return;
    }

    const zoneLat = Number(selectedZone.latitude);
    const zoneLng = Number(selectedZone.longitude);
    const submitLat = Number(address.lat);
    const submitLng = Number(address.lng);

    if (!isFinite(zoneLat) || !isFinite(zoneLng)) {
      setMessage("Zone coordinates are invalid.");
      return;
    }
    if (!isFinite(submitLat) || !isFinite(submitLng)) {
      setMessage("Please set a valid location on the map.");
      return;
    }

    const distanceMeters = L.latLng(zoneLat, zoneLng).distanceTo(
      L.latLng(submitLat, submitLng)
    );

    const MAX_DISTANCE_METERS = Number(selectedZone.range);
    if (distanceMeters >= MAX_DISTANCE_METERS) {
      return Swal.fire({
        title: "Invalid Location",
        html: "The selected location is outside the allowed zone. Please update it.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Update Location",
        cancelButtonText: "Cancel",
        reverseButtons: true,
      }).then((result) => {
        if (result.isConfirmed) {
          setMarkerPosition({ lat: zoneLat, lng: zoneLat });
          setAddress((p) => ({
            ...p,
            lat: zoneLat,
            lng: zoneLng,
          }));
          Swal.fire("Updated", "Marker moved to zone center.", "success");
        }
      });
    }

    try {
      setSaving(true);
      const payload = {
        city: address.cityId,
        zone: address.zone,
        Latitude: address.lat,
        Longitude: address.lng,
      };
      const res = await fetch(`${process.env.REACT_APP_API_URL}/editSellerProfile/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Request failed");

      setAddress((p) => ({ ...p, status: "pending" }));
      setMessage("Address update submitted — pending admin approval.");
      setAddressDialogOpen(false);
      fetchProfile();
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Failed to submit address update");
    } finally {
      setSaving(false);
    }
  }

  // Render
  if (loading) {
    return (
      <MDBox
        sx={{
          p: { xs: 2, sm: 3 },
          mx: "auto",
          maxWidth: "1200px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress size={60} />
      </MDBox>
    );
  }

  return (
    <MDBox
      ml={miniSidenav ? "80px" : "260px"} p={2} sx={{ marginTop: "20px" }}
    >
      <Typography
        variant="h4"
        sx={{ mb: 3, fontWeight: "bold", textAlign: { xs: "center", sm: "left" } }}
      >
        Seller Profile
      </Typography>

      {message && (
        <Fade in={!!message}>
          <Paper
            sx={{
              p: 2,
              mb: 3,
              bgcolor: "warning.light",
              borderRadius: 2,
              boxShadow: 2,
            }}
          >
            <Typography variant="body1" color="text.secondary">
              {message}
            </Typography>
          </Paper>
        </Fade>
      )}

      <Grid container spacing={2} direction="column">
        <Grid item xs={12}>
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 2,
              boxShadow: 3,
              mb: 2,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "medium" }}>
              Personal Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Owner Name"
                  value={form.ownerName}
                  fullWidth
                  margin="dense"
                  onChange={(e) => handleFormChange("ownerName", e.target.value)}
                  variant="outlined"
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Invoice Code"
                  value={form.invoicePrefix}
                  fullWidth
                  margin="dense"
                  onChange={(e) => handleFormChange("invoicePrefix", e.target.value)}
                  helperText="Unique prefix for invoices (e.g., INV2025). Must be unique."
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Store Name"
                  value={form.storeName}
                  fullWidth
                  margin="dense"
                  onChange={(e) => handleFormChange("storeName", e.target.value)}
                  variant="outlined"
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Owner Email"
                  value={form.email}
                  fullWidth
                  margin="dense"
                  type="email"
                  onChange={(e) => handleFormChange("email", e.target.value)}
                  variant="outlined"
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Mobile Number"
                  value={form.PhoneNumber}
                  fullWidth
                  margin="dense"
                  type="tel"
                  onChange={(e) => handleFormChange("PhoneNumber", e.target.value)}
                  variant="outlined"
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="GST Number"
                  value={form.gstNumber}
                  fullWidth
                  margin="dense"
                  onChange={(e) => handleFormChange("gstNumber", e.target.value)}
                  variant="outlined"
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="FSSAI Number"
                  value={form.fsiNumber}
                  fullWidth
                  margin="dense"
                  onChange={(e) => handleFormChange("fsiNumber", e.target.value)}
                  variant="outlined"
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Open Time"
                  type="time"
                  value={form.openTime}
                  fullWidth
                  margin="dense"
                  InputLabelProps={{ shrink: true }}
                  onChange={(e) => handleFormChange("openTime", e.target.value)}
                  variant="outlined"
                  helperText="Set store opening time"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Close Time"
                  type="time"
                  value={form.closeTime}
                  fullWidth
                  margin="dense"
                  InputLabelProps={{ shrink: true }}
                  onChange={(e) => handleFormChange("closeTime", e.target.value)}
                  variant="outlined"
                  helperText="Set store closing time"
                />
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={2}>
                  <TextField
                    label="Image"
                    type="file"
                    fullWidth
                    margin="dense"
                    InputLabelProps={{ shrink: true }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFormChange("image", file);
                      }
                    }}
                    helperText="Upload image shown on product/store pages"
                    variant="outlined"
                  />
                  {form.image && typeof form.image === "string" && (
                    <Box
                      sx={{
                        width: 104,
                        height: 84,
                        borderRadius: 2,
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #ddd",
                        backgroundColor: "#fafafa",
                      }}
                    >
                      <img
                        src={`${process.env.REACT_APP_IMAGE_LINK}${form.image}`}
                        alt="Profile"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={2}>
                  <TextField
                    label="Aadhar Card"
                    type="file"
                    fullWidth
                    margin="dense"
                    InputLabelProps={{ shrink: true }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFormChange("aadharCard", file);
                      }
                    }}
                    helperText="Upload Aadhar card"
                    variant="outlined"
                    disabled
                  />
                  {form.aadharCard &&
                    typeof form.aadharCard === "string" &&
                    (form.aadharCard.toLowerCase().endsWith(".jpg") ||
                     form.aadharCard.toLowerCase().endsWith(".jpeg") ||
                     form.aadharCard.toLowerCase().endsWith(".png")) && (
                    <Box
                      sx={{
                        width: 104,
                        height: 84,
                        borderRadius: 2,
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #ddd",
                        backgroundColor: "#fafafa",
                      }}
                    >
                      <img
                        src={`${process.env.REACT_APP_IMAGE_LINK}${form.aadharCard}`}
                        alt="Aadhar Card"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={2}>
                  <TextField
                    label="Signature"
                    type="file"
                    fullWidth
                    margin="dense"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ accept: "image/*" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFormChange("sellerSignature", file);
                      }
                    }}
                    helperText="Upload signature image"
                    variant="outlined"
                  />
                  {form.sellerSignature && (
                    <Box
                      sx={{
                        width: 104,
                        height: 84,
                        borderRadius: 2,
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #ddd",
                        backgroundColor: "#fff",
                      }}
                    >
                      <img
                        src={
        typeof form.sellerSignature === "string"
          ? `${process.env.REACT_APP_IMAGE_LINK}${form.sellerSignature}` // fetched from server
          : URL.createObjectURL(form.sellerSignature) // newly selected file
      }
                        alt="Signature"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          backgroundColor: "#fff",
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" flexDirection="column" gap={2}>
                  <TextField
                    label="Advertisement Images"
                    type="file"
                    fullWidth
                    margin="dense"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ multiple: true, accept: "image/*,.gif" }}
                    onChange={(e) => handleAdImages(e.target.files)}
                    helperText="Upload multiple images or GIFs for advertisements (1500×620px, max 4)"
                    variant="outlined"
                  />
                  {form.advertisementImages.length > 0 && (
                    <Box display="flex" flexWrap="wrap" gap={2}>
                      {form.advertisementImages.map((img, index) => (
                        <Box
                          key={typeof img === "string" ? img : `file-${index}`}
                          sx={{
                            width: 300,
                            height: 124,
                            borderRadius: 2,
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid #ddd",
                            backgroundColor: "#fafafa",
                            position: "relative",
                          }}
                        >
                          <img
                            src={
                              typeof img === "string"
                                ? `${process.env.REACT_APP_IMAGE_LINK}${img}`
                                : URL.createObjectURL(img)
                            }
                            alt={`Advertisement ${index + 1}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                          <IconButton
                            size="small"
                            sx={{
                              position: "absolute",
                              top: 2,
                              right: 2,
                              bgcolor: "rgba(255, 255, 255, 0.7)",
                            }}
                            onClick={() => {
                              setForm((p) => ({
                                ...p,
                                advertisementImages: p.advertisementImages.filter(
                                  (_, i) => i !== index
                                ),
                              }));
                            }}
                          >
                            <DeleteIcon color="error" fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </Grid>
              {profile?.pendingAdvertisementImages?.image?.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: "medium" }}>
                    Pending Advertisement Images
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={2}>
                    {profile.pendingAdvertisementImages.image.map((img, index) => (
                      <Box
                        key={`pending-${img}-${index}`}
                        sx={{
                          width: 300,
                          height: 124,
                          borderRadius: 2,
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid #ddd",
                          backgroundColor: "#fafafa",
                          position: "relative",
                        }}
                      >
                        <img
                          src={`${process.env.REACT_APP_IMAGE_LINK}${img}`}
                          alt={`Pending Advertisement ${index + 1}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            position: "absolute",
                            bottom: 2,
                            left: 2,
                            bgcolor: "rgba(0, 0, 0, 0.6)",
                            color: "white",
                            px: 1,
                            borderRadius: 1,
                          }}
                        >
                          Pending Approval
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                    Status: {profile.pendingAdvertisementImages.status || "N/A"}
                  </Typography>
                </Grid>
              )}
              <Snackbar
                open={alert.open}
                autoHideDuration={4000}
                onClose={() => setAlert((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
              >
                <Alert
                  onClose={() => setAlert((prev) => ({ ...prev, open: false }))}
                  severity={alert.severity}
                  sx={{ width: "100%" }}
                >
                  {alert.message}
                </Alert>
              </Snackbar>
            </Grid>
            <Box display="flex" gap={2} mt={3} justifyContent={{ xs: "center", sm: "flex-end" }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<SaveIcon />}
                onClick={handleProfileSave}
                disabled={saving}
                sx={{ px: 3 }}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="outlined"
                sx={{ color: "grey.600", borderColor: "grey.600" }}
                onClick={() => navigate(-1)}
              >
                Back
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 2,
              boxShadow: 3,
              mb: 2,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "medium" }}>
              Address & Hours
            </Typography>
            <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
              <RoomIcon color="action" />
              <Box>
                <Typography variant="body1">
                  {address.city && address.zoneTitle ? `${address.zoneTitle}, ${address.city}` : "No address set"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Lat: {address.lat || "N/A"}, Lng: {address.lng || "N/A"}
                </Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
              <AccessTimeIcon color="action" />
              <Box>
                <Typography variant="body1">
                  Hours: {form.openTime && form.closeTime ? `${form.openTime} - ${form.closeTime}` : "Not set"}
                </Typography>
              </Box>
            </Box>
            <Box display="flex" flexDirection="column" gap={1}>
              <Button
                variant="outlined"
                sx={{ color: "grey.600", borderColor: "grey.600", alignSelf: { xs: "center", sm: "flex-start" } }}
                onClick={openAddressDialog}
                startIcon={<EditIcon />}
              >
                Update Address / Set Location
              </Button>
            </Box>
          </Paper>
        </Grid>

        {profile?.pendingAddressUpdate && (
          <Grid item xs={12}>
            <Paper
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                boxShadow: 3,
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: "medium" }}>
                Pending Address Request
              </Typography>
              <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                <RoomIcon color="action" />
                <Box>
                  <Typography variant="body1">
                    {profile.pendingAddressUpdate.city?.name && profile.pendingAddressUpdate.zone?.[0]?.title
                      ? `${profile.pendingAddressUpdate.zone[0].title}, ${profile.pendingAddressUpdate.city.name}`
                      : "No pending address set"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Lat: {profile.pendingAddressUpdate.Latitude || "N/A"}, Lng: {profile.pendingAddressUpdate.Longitude || "N/A"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Status: {profile.pendingAddressUpdate.status || "N/A"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Requested At: {profile.pendingAddressUpdate.requestedAt
                      ? new Date(profile.pendingAddressUpdate.requestedAt).toLocaleString()
                      : "N/A"}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        )}

        <Grid item xs={12}>
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 2,
              boxShadow: 3,
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "medium" }}>
                Bank Account
              </Typography>
              <Button
                variant="contained"
                sx={{ color: "white !important" }}
                startIcon={<AddIcon />}
                onClick={openBankDialog}
              >
                {Object.keys(bankDetails).length > 0 ? "Edit Bank" : "Add Bank"}
              </Button>
            </Box>
            {Object.keys(bankDetails).length > 0 ? (
              <List>
                <ListItem sx={{ borderBottom: "1px solid #eee" }}>
                  <ListItemText
                    primary={`${bankDetails.bankName} — ${bankDetails.accountHolder}`}
                    secondary={`A/C: ${bankDetails.accountNumber} • IFSC: ${bankDetails.ifsc || "-"} • Branch: ${bankDetails.branch || "-"}`}
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Primary account">
                      <AccountBalanceIcon color="primary" sx={{ mr: 1}} />
                    </Tooltip>
                    <IconButton edge="end" onClick={openBankDialog}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={deleteBank}>
                      <DeleteIcon color="error" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No bank account added
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={bankDialogOpen}
        onClose={() => setBankDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={window.innerWidth < 600}
      >
        <DialogTitle>{Object.keys(bankDetails).length > 0 ? "Edit Bank Account" : "Add Bank Account"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Bank Name"
            fullWidth
            margin="dense"
            value={bankForm.bankName}
            onChange={(e) => setBankForm((p) => ({ ...p, bankName: e.target.value }))}
            variant="outlined"
            disabled
          />
          <TextField
            label="Account Holder"
            fullWidth
            margin="dense"
            value={bankForm.accountHolder}
            onChange={(e) => setBankForm((p) => ({ ...p, accountHolder: e.target.value }))}
            variant="outlined"
            disabled
          />
          <TextField
            label="Account Number"
            fullWidth
            margin="dense"
            value={bankForm.accountNumber}
            onChange={(e) => setBankForm((p) => ({ ...p, accountNumber: e.target.value }))}
            variant="outlined"
            disabled
          />
          <TextField
            label="IFSC"
            fullWidth
            margin="dense"
            value={bankForm.ifsc}
            onChange={(e) => setBankForm((p) => ({ ...p, ifsc: e.target.value }))}
            variant="outlined"
            disabled
          />
          <TextField
            label="Branch"
            fullWidth
            margin="dense"
            value={bankForm.branch}
            onChange={(e) => setBankForm((p) => ({ ...p, branch: e.target.value }))}
            variant="outlined"
            disabled
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBankDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={saveBankAccount}
            variant="contained"
            sx={{ color: "white !important" }}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={addressDialogOpen}
        onClose={() => setAddressDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={window.innerWidth < 600}
      >
        <DialogTitle>Update Address & Location (Pending Admin Approval)</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel>Selling City</InputLabel>
                <Select
                  value={address.city}
                  onChange={(e) => handleAddressChange("city", e.target.value)}
                  label="Selling City"
                  sx={{ minHeight: 48 }}
                >
                  <MenuItem value="">Select City</MenuItem>
                  {cityOptions.map((c) => (
                    <MenuItem key={c._id} value={c.city}>
                      {c.city}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>Selling Zone</InputLabel>
                <Select
                  value={address.zone}
                  onChange={(e) => handleAddressChange("zone", e.target.value)}
                  label="Selling Zone"
                  sx={{ minHeight: 48 }}
                >
                  <MenuItem value="">Select Zone</MenuItem>
                  {zoneOptions.map((z) => (
                    <MenuItem key={z._id} value={z._id}>
                      {z.zoneTitle}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box mt={2}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Latitude / Longitude
                </Typography>
                <Box display="flex" gap={2}>
                  <TextField
                    label="Latitude"
                    value={address.lat}
                    fullWidth
                    onChange={(e) => {
                      setAddress((p) => ({ ...p, lat: e.target.value }));
                      setMarkerPosition((p) => ({ ...p, lat: parseFloat(e.target.value) || 0 }));
                    }}
                    variant="outlined"
                  />
                  <TextField
                    label="Longitude"
                    value={address.lng}
                    fullWidth
                    onChange={(e) => {
                      setAddress((p) => ({ ...p, lng: e.target.value }));
                      setMarkerPosition((p) => ({ ...p, lng: parseFloat(e.target.value) || 0 }));
                    }}
                    variant="outlined"
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  Tip: Click on the map to set coordinates or enter them manually.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Pick Location on Map
              </Typography>
              <Box
                id="seller-map"
                sx={{
                  height: { xs: 250, sm: 350, md: 400 },
                  width: "100%",
                  borderRadius: 2,
                  border: "1px solid #ddd",
                  overflow: "hidden",
                }}
              >
                <MapContainer
                  center={markerPosition}
                  zoom={12}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
                  />
                  {zoneRadius && zoneCenter && (
                    <Circle
                      center={zoneCenter}
                      radius={zoneRadius}
                      color="lightgreen"
                      fillColor="lightgreen"
                      fillOpacity={0.4}
                    />
                  )}
                  <Marker position={markerPosition} />
                  <MapUpdater />
                </MapContainer>
              </Box>
              <Box mt={2} display="flex" gap={2} justifyContent={{ xs: "center", sm: "flex-start" }}>
                <Button
                  variant="outlined"
                  sx={{ color: "grey.600", borderColor: "grey.600" }}
                  onClick={() => {
                    setAddress((p) => ({
                      ...p,
                      lat: markerPosition.lat,
                      lng: markerPosition.lng,
                    }));
                  }}
                >
                  Use Marker Coordinates
                </Button>
                <Button
                  variant="contained"
                  sx={{ color: "white !important" }}
                  onClick={() => {
                    if (zoneCenter) {
                      setMarkerPosition(zoneCenter);
                      setAddress((p) => ({
                        ...p,
                        lat: zoneCenter.lat,
                        lng: zoneCenter.lng,
                      }));
                    }
                  }}
                >
                  Center Map
                </Button>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddressDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={submitAddressUpdateRequest}
            variant="contained"
            sx={{ color: "white !important" }}
            startIcon={<SaveIcon />}
            disabled={saving}
          >
            {saving ? "Submitting..." : "Submit for Approval"}
          </Button>
        </DialogActions>
      </Dialog>
    </MDBox>
  );
}