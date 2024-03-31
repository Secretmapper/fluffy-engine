import { Static, TSchema, Type } from "@sinclair/typebox";

// Scan Receipt Type
export type ScanReceiptType = Static<typeof ScanReceipt>;

const ValueWithConfidence = (
  valueType: TSchema = Type.Union([Type.String(), Type.Number()]),
) =>
  Type.Object({
    confidence: Type.Number(),
    value: valueType,
  });
export const ScanReceipt = Type.Object({
  products: Type.Array(
    Type.Union([
      Type.Object({
        rpn: ValueWithConfidence(
          Type.Object({
            rpn: Type.String(),
            upc: Type.String(),
            brand: Type.String(),
            image_url: Type.String(),
          }),
        ),
      }),
      Type.Object({
        rsd: ValueWithConfidence(
          Type.Object({
            rsd: Type.String(),
            upc: Type.String(),
            brand: Type.String(),
            image_url: Type.String(),
          }),
        ),
      }),
    ]),
  ),
  store_city: ValueWithConfidence(),
  store_state: ValueWithConfidence(),
  store_street: ValueWithConfidence(),
  store_zip: ValueWithConfidence(),
  subtotal: ValueWithConfidence(),
  taxes: ValueWithConfidence(),
  total: ValueWithConfidence(),
  transaction: ValueWithConfidence(),
});
