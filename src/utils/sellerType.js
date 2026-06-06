export const isFoodSellerValue = (sellFood, businessType) =>
  sellFood === "true" || sellFood === true || businessType === "FSSAI";

export const isFoodSellerFromStorage = () =>
  isFoodSellerValue(
    localStorage.getItem("sellFood"),
    localStorage.getItem("businessType")
  );
