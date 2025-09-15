import type {StructureResolver} from 'sanity/structure'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      // Dynamic Countries Section
      S.listItem()
        .title('Countries')
        .child(
          S.documentTypeList('countryPage')
            .title('Countries')
            .child((countryId) =>
          S.list()
                .title('Country Page Management')
            .items([
                  // Country Settings
                  S.listItem()
                    .title('Country Page')
                    .child(
                      S.document()
                        .documentId(countryId)
                        .schemaType('countryPage')
                    ),
                  
                  S.divider(),
                  
                  // Bookmakers
              S.listItem()
                .title('Bookmakers')
                .child(
                  S.documentList()
                        .title('Bookmakers')
                        .filter('_type == "bookmaker" && country._ref == $countryId')
                        .params({countryId})
                    ),
                  
                  // Offers
              S.listItem()
                .title('Offers')
                .child(
                  S.documentList()
                        .title('Offers')
                        .filter('_type == "offers" && bookmaker->country._ref == $countryId')
                        .params({countryId})
                    ),
                  
                  // Bonus Types
              S.listItem()
                .title('Bonus Types')
                .child(
                  S.documentList()
                        .title('Bonus Types')
                        .filter('_type == "bonusType" && country._ref == $countryId')
                        .params({countryId})
                    ),
                  
                  // Homepage Banners
              S.listItem()
                .title('Homepage Banners')
                .child(
                  S.documentList()
                        .title('Homepage Banners')
                        .filter('_type == "banner" && country._ref == $countryId')
                        .params({countryId})
                ),
                  
                  
                  // Pretty Links
              S.listItem()
                .title('Pretty Links')
                .child(
                  S.documentList()
                        .title('Pretty Links')
                        .filter('_type == "affiliate" && bookmaker->country._ref == $countryId')
                        .params({countryId})
                ),
            ])
            )
        ),

      // Divider
      S.divider(),

      // World Wide Pages
      S.listItem()
        .title('World Wide Pages')
        .child(
          S.list()
            .title('World Wide Pages')
            .items([
              S.listItem()
                .title('Menu Pages')
                .child(S.documentTypeList('hamburgerMenu').title('Menu Pages')),
              S.listItem()
                .title('Blog')
                .child(S.documentTypeList('article').title('Blog')),
              S.listItem()
                .title('Calculators')
                .child(S.documentTypeList('calculator').title('Calculators')),
              S.listItem()
                .title('Redirects')
                .child(S.documentTypeList('redirects').title('Redirects')),
              S.listItem()
                .title('Footer')
                .child(S.documentTypeList('footer').title('Footer')),
            ])
        ),

      // Page Contents (all documents)
      S.listItem()
        .title('All Pages')
        .child(
          S.list()
            .title('All Pages')
            .items(S.documentTypeListItems())
        ),
    ])
