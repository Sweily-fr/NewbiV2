import { gql } from '@apollo/client';

// Récupérer tous les articles
export const GET_ALL_BLOG_POSTS = gql`
  query GetAllBlogPosts($limit: Int, $offset: Int) {
    getAllBlogPosts(limit: $limit, offset: $offset) {
      success
      message
      posts {
        _id
        slug
        title
        summary
        author
        authorAvatar
        category
        tags
        image
        publishedAt
        views
        readTime
      }
      total
      hasMore
    }
  }
`;

// Récupérer un article par slug
export const GET_BLOG_POST_BY_SLUG = gql`
  query GetBlogPostBySlug($slug: String!) {
    getBlogPostBySlug(slug: $slug) {
      success
      message
      post {
        _id
        slug
        title
        metaTitle
        metaDescription
        summary
        author
        authorAvatar
        category
        tags
        image
        content
        publishedAt
        views
        readTime
        createdAt
        updatedAt
      }
    }
  }
`;

// Récupérer les articles par catégorie
export const GET_BLOG_POSTS_BY_CATEGORY = gql`
  query GetBlogPostsByCategory($category: String!, $limit: Int) {
    getBlogPostsByCategory(category: $category, limit: $limit) {
      success
      message
      posts {
        _id
        slug
        title
        summary
        category
        image
        publishedAt
        readTime
      }
      total
    }
  }
`;

// Récupérer les articles populaires
export const GET_POPULAR_BLOG_POSTS = gql`
  query GetPopularBlogPosts($limit: Int) {
    getPopularBlogPosts(limit: $limit) {
      success
      message
      posts {
        _id
        slug
        title
        summary
        category
        image
        views
        readTime
      }
    }
  }
`;

// Rechercher des articles
export const SEARCH_BLOG_POSTS = gql`
  query SearchBlogPosts($query: String!, $limit: Int) {
    searchBlogPosts(query: $query, limit: $limit) {
      success
      message
      posts {
        _id
        slug
        title
        summary
        category
        image
        publishedAt
        readTime
      }
      total
    }
  }
`;
