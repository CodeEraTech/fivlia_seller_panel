export const isFoodSellerValue = (sellFood, businessType) =>
  sellFood === "true" || sellFood === true || businessType === "FSSAI";

export const isFoodSellerFromStorage = () =>
  isFoodSellerValue(
    localStorage.getItem("typeId") === "69cf8a31ad92aee54ecb1e72",
  );
