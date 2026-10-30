// ==============================================================================
// PRODUCT MODEL HELPER
// File: blockchain/chaincode/pharma-contract/lib/productModel.js
// ==============================================================================

class Product {
    constructor(gtin, brandName, genericName, dosageForm, strength, manufacturerMspId, createdAt) {
        this.docType = 'PRODUCT';
        this.gtin = gtin;
        this.brandName = brandName;
        this.genericName = genericName;
        this.dosageForm = dosageForm;
        this.strength = strength;
        this.manufacturerMspId = manufacturerMspId;
        this.createdAt = createdAt;
    }

    static makeKey(gtin) {
        return `PRODUCT_${gtin}`;
    }
}

module.exports = Product;
