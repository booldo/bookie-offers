import { type SchemaTypeDefinition } from 'sanity'
import offer from './offer'
import article from "./article";

export const schemaTypes = [
  offer,
  article,
];

export const schema: { types: SchemaTypeDefinition[] } = {
  types: schemaTypes,
};
