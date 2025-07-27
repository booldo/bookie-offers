import { type SchemaTypeDefinition } from 'sanity'
import offer from './offer'
import article from "./article";
import banner from "./banner";
import faq from "./faq";
import seoSettings from "./seoSettings";

export const schemaTypes = [
  offer,
  article,
  banner,
  faq,
  seoSettings,
];

export const schema: { types: SchemaTypeDefinition[] } = {
  types: schemaTypes,
};
