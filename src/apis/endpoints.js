import db from "./firebaseDb.js";
import { doc, getDoc } from "firebase/firestore";

// `false` = current REST API flow, `true` = Firebase/Firestore flow.
export const USE_FIREBASE = true;

// const DEFAULT_API_BASE_URL = "https://api.fivlia.in";

// const DEFAULT_API_BASE_URL = "https://api.fivlia.com";
const DEFAULT_API_BASE_URL = "https://api.fivlia.co.in";
// const DEFAULT_API_BASE_URL = "http://127.0.0.1:8080";
// const DEFAULT_API_BASE_URL = "http://localhost:8080";


let cachedUrl = null;

export async function getApiBaseUrl() {
  if (cachedUrl) return cachedUrl;
  if (!USE_FIREBASE) {
    cachedUrl = DEFAULT_API_BASE_URL;
    return cachedUrl;
  }

  try {
    const snap = await getDoc(doc(db, "config", "api"));
    cachedUrl = snap.exists()
      ? snap.data().base_url
      : DEFAULT_API_BASE_URL;
    return cachedUrl;
  } catch (err) {
    console.error("Firebase error:", err);
    cachedUrl = DEFAULT_API_BASE_URL;
    return cachedUrl;
  }
}

export const FIREBASE_DB = USE_FIREBASE ? db : null;

// Define all endpoints here
export const ENDPOINTS = {
  LOGIN: "/storeLogin",
  SEND_OTP: "/sendOtp",
  VERIFY_OTP: "/seller/verifyOtp",
  CATEGORIES: "/categories",
  GET_PRODUCTS: "/getCategoryProduct",
  UPDATE_PRODUCT: "/addCategoryInSeller",
  GET_SELLER_MAPPING: "/getSellerCategoryMapping",
  GET_CATEGORY: "/getSellerCategories",
  GET_SELLER_PRODUCTS: "/getSellerProducts",
  UPDATE_SELLER_PRODUCT_STATUS: "/updateSellerProducStatus",
  UPDATE_SELLER_PRODUCT_STOCK: "/updateSellerStock",
  GET_CATEGORY_LIST: "/getSellerCategoryList",
  GET_EXISTING_PRODUCT_LIST: "/getExistingProductList",
  DELETE_CATEGORY: "/removeCategory",
  DELETE_PRODUCT: "/removeProduct",
  GET_UNAPPROVED_PRODUCTS: "/getUnapprovedProducts",
  UPDATE_BRAND_DOCUMENT: "/saveBrandApprovelDocument",
  LOGOUT: "/logoutSeller",
  GET_STORE_TRANSACTION: "getStoreTransaction",
  SELLER_WITHDRAWAL_REQUEST: "seller/withdrawalRequest",
  CREATE_COUPON: "/seller/create-seller-coupon",
  GET_COUPONS: "/seller/get-coupons",
  EDIT_COUPON: "/seller/edit-seller-coupon",
  DELETE_COUPON: "/seller/delete-coupons",
};
