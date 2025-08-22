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
                .title('Country Management')
            .items([
                  // Country Settings
                  S.listItem()
                    .title('Add Country')
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
                  
                  // Homepage Content
              S.listItem()
                .title('Homepage Content')
                .child(
                  S.documentList()
                        .title('Homepage Content')
                        .filter('_type == "comparison" && country._ref == $countryId')
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

      // Page Contents (all documents)
      S.listItem()
        .title('Page Contents')
        .child(
          S.list()
            .title('Page Contents')
            .items(S.documentTypeListItems())
        ),
    ])
