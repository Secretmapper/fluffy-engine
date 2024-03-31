import { Static, Type } from "@sinclair/typebox";

export const ProductKeyUnion = Type.Union([
  Type.Object({ rpn: Type.String() }),
  Type.Object({ rsd: Type.String() }),
]);

export const Product = Type.Intersect([
  ProductKeyUnion,
  Type.Object({
    upc: Type.String(),
    brand: Type.String(),
    image_url: Type.String(),
  }),
]);

export const ProductList = Type.Array(Product);

export type ProductType = Static<typeof Product>;
