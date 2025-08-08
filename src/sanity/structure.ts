import type {StructureResolver} from 'sanity/structure'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      // Nigeria Section
      S.listItem()
        .title('🇳🇬 Nigeria')
        .child(
          S.list()
            .title('Nigeria Content')
            .items([
              S.listItem()
                .title('Bookmakers')
                .child(
                  S.documentList()
                    .title('Nigeria Bookmakers')
                    .filter('_type == "bookmaker" && country == "Nigeria"')
                ),
              S.listItem()
                .title('Bonus Types')
                .child(
                  S.documentList()
                    .title('Nigeria Bonus Types')
                    .filter('_type == "bonusType" && country == "Nigeria"')
                ),
              S.listItem()
                .title('Offers')
                .child(
                  S.documentList()
                    .title('Nigeria Offers')
                    .filter('_type == "offers" && bookmaker->country == "Nigeria"')
                ),
              S.listItem()
                .title('Homepage Metadata')
                .child(
                  S.documentList()
                    .title('Nigeria Homepage Metadata')
                    .filter('_type == "seoSettings" && country == "Nigeria"')
                ),
              S.listItem()
                .title('Homepage Banners')
                .child(
                  S.documentList()
                    .title('Nigeria Homepage Banners')
                    .filter('_type == "banner" && country == "Nigeria"')
                ),
              S.listItem()
                .title('Homepage Content')
                .child(
                  S.documentList()
                    .title('Nigeria Homepage Content')
                    .filter('_type == "comparison" && country == "Nigeria"')
                ),
              S.listItem()
                .title('Affiliate Links')
                .child(
                  S.documentList()
                    .title('Nigeria Affiliate Links')
                    .filter('_type == "affiliate" && country == "Nigeria"')
                ),
            ])
        ),

      // Ghana Section
      S.listItem()
        .title('🇬🇭 Ghana')
        .child(
          S.list()
            .title('Ghana Content')
            .items([
              S.listItem()
                .title('Bookmakers')
                .child(
                  S.documentList()
                    .title('Ghana Bookmakers')
                    .filter('_type == "bookmaker" && country == "Ghana"')
                ),
              S.listItem()
                .title('Bonus Types')
                .child(
                  S.documentList()
                    .title('Ghana Bonus Types')
                    .filter('_type == "bonusType" && country == "Ghana"')
                ),
              S.listItem()
                .title('Offers')
                .child(
                  S.documentList()
                    .title('Ghana Offers')
                    .filter('_type == "offers" && bookmaker->country == "Ghana"')
                ),
              S.listItem()
                .title('Homepage Metadata')
                .child(
                  S.documentList()
                    .title('Ghana Homepage Metadata')
                    .filter('_type == "seoSettings" && country == "Ghana"')
                ),
              S.listItem()
                .title('Homepage Banners')
                .child(
                  S.documentList()
                    .title('Ghana Homepage Banners')
                    .filter('_type == "banner" && country == "Ghana"')
                ),
              S.listItem()
                .title('Homepage Content')
                .child(
                  S.documentList()
                    .title('Ghana Homepage Content')
                    .filter('_type == "comparison" && country == "Ghana"')
                ),
              S.listItem()
                .title('Affiliate Links')
                .child(
                  S.documentList()
                    .title('Ghana Affiliate Links')
                    .filter('_type == "affiliate" && country == "Ghana"')
                ),
            ])
        ),

      // Worldwide Section
      S.listItem()
        .title('🌍 Worldwide')
        .child(
          S.list()
            .title('Worldwide Content')
            .items([
              S.listItem()
                .title('Articles')
                .child(
                  S.documentList()
                    .title('Articles')
                    .filter('_type == "article"')
                ),

              S.listItem()
                .title('About')
                .child(
                  S.documentList()
                    .title('About')
                    .filter('_type == "about"')
                ),

              S.listItem()
                .title('Contact')
                .child(
                  S.documentList()
                    .title('Contact')
                    .filter('_type == "contact"')
                ),

              S.listItem()
                .title('FAQs')
                .child(
                  S.documentList()
                    .title('FAQs')
                    .filter('_type == "faq"')
                ),
              S.listItem()
                .title('Homepage Metadata')
                .child(
                  S.documentList()
                    .title('Homepage Metadata')
                    .filter('_type == "seoSettings"')
                ),
              S.listItem()
                .title('Click Tracking')
                .child(
                  S.documentList()
                    .title('Click Tracking')
                    .filter('_type == "clickTracking"')
                ),

            ])
        ),

      // Divider
      S.divider(),

      // All Documents (for admin purposes)
      S.listItem()
        .title('📋 All Documents')
        .child(
          S.list()
            .title('All Documents')
            .items(S.documentTypeListItems())
        ),
    ])
