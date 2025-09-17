// export const API_BASE_URL = "https://api.fivlia.in";
export const API_BASE_URL = "http://127.0.0.1:8080";


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
  UPDATE_BRAND_DOCUMENT: "/saveBrandApprovelDocument"
}; 