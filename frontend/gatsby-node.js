/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/
 */

/**
 * @type {import('gatsby').GatsbyNode['onCreatePage']}
 */
exports.onCreatePage = async ({ page, actions }) => {
  const { createPage } = actions

  // Create dynamic pages for expense editing
  if (page.path.match(/^\/account\/edit-expense$/)) {
    page.matchPath = "/account/edit-expense/*"
    createPage(page)
  }
}
