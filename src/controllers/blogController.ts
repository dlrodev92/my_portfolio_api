import { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import {
  handleBlogFileUploads,
  processContentBlocks,
  manageBlogSeries,
  createBlogTags,
  createBlogCategory,
  calculateWordCount
} from '../utils/blogHelpers';

const prisma = new PrismaClient();

export const createBlogPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      subtitle,
      excerpt,
      metaDescription,
      heroImageAlt,
      heroImageCaption,
      readTime,
      publishedAt,
      author,
      contentBlocks,
      category,
      series,
      tags,
    } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Handle file uploads
    const { heroImageUrl, socialImageUrl, processedContentBlocks } = await handleBlogFileUploads(files, contentBlocks || []);

    // Generate slug
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Calculate word count
    const wordCount = calculateWordCount(processedContentBlocks);

    // Create blog post with all related data in a transaction
    const blogPost = await prisma.$transaction(async (tx) => {
      // Handle category
      const categoryRecord = await createBlogCategory(tx, category);

      // Create main blog post
      const newBlogPost = await tx.blogPost.create({
        data: {
          title,
          subtitle,
          slug,
          excerpt,
          metaDescription,
          socialImage: socialImageUrl,
          readTime: parseInt(readTime) || 5,
          wordCount,
          heroImage: heroImageUrl,
          heroImageAlt,
          heroImageCaption,
          publishedAt: publishedAt ? new Date(publishedAt) : null,
          author: author || { name: 'David Rodriguez', bio: 'Full-stack developer' },
          categoryId: categoryRecord?.id || null,
        },
      });

      // Process content blocks
      await processContentBlocks(tx, newBlogPost.id, processedContentBlocks);

      // Handle series
      await manageBlogSeries(tx, newBlogPost.id, series);

      // Handle tags
      await createBlogTags(tx, newBlogPost.id, tags);

      return newBlogPost;
    });

    res.status(201).json({
      success: true,
      data: blogPost,
    });

  } catch (error) {
    console.error('Create blog post error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create blog post',
    });
  }
};

export const getBlogPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, tag, series, limit = '10', offset = '0', published = 'true' } = req.query;

    const blogPosts = await prisma.blogPost.findMany({
      where: {
        ...(published === 'true' && { publishedAt: { not: null } }),
        ...(category && {
          category: {
            slug: category as string,
          },
        }),
        ...(tag && {
          blogPostTags: {
            some: {
              blogTag: {
                slug: tag as string,
              },
            },
          },
        }),
        ...(series && {
          series: {
            slug: series as string,
          },
        }),
      },
      include: {
        category: true,
        series: true,
        contentBlocks: { orderBy: { order: 'asc' } },
        blogPostTags: { include: { blogTag: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.json({
      success: true,
      data: blogPosts,
    });

  } catch (error) {
    console.error('Get blog posts error:', error);
    res.status(500).json({
      error: 'Failed to fetch blog posts',
    });
  }
};

export const getBlogPostsForCards = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, tag, limit = '10', offset = '0' } = req.query;

    const blogPosts = await prisma.blogPost.findMany({
      where: {
        publishedAt: { not: null },
        ...(category && {
          category: {
            slug: category as string,
          },
        }),
        ...(tag && {
          blogPostTags: {
            some: {
              blogTag: {
                slug: tag as string,
              },
            },
          },
        }),
      },
      select: {
        id: true,
        title: true,
        subtitle: true,
        excerpt: true,
        slug: true,
        heroImage: true,
        readTime: true,
        views: true,
        publishedAt: true,
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        blogPostTags: {
          select: {
            blogTag: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    // Transform for frontend
    const transformedPosts = blogPosts.map(post => ({
      id: post.id,
      title: post.title,
      subtitle: post.subtitle,
      excerpt: post.excerpt,
      slug: post.slug,
      heroImage: post.heroImage,
      readTime: post.readTime,
      views: post.views,
      publishedAt: post.publishedAt,
      category: post.category,
      tags: post.blogPostTags.map(bpt => bpt.blogTag),
    }));

    res.json({
      success: true,
      data: transformedPosts,
    });

  } catch (error) {
    console.error('Get blog posts for cards error:', error);
    res.status(500).json({
      error: 'Failed to fetch blog posts for cards',
    });
  }
};

export const updateBlogPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const blogPost = await prisma.blogPost.update({
      where: { id: parseInt(id) },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        category: true,
        series: true,
        contentBlocks: { orderBy: { order: 'asc' } },
        blogPostTags: { include: { blogTag: true } },
      },
    });

    res.json({
      success: true,
      data: blogPost,
    });

  } catch (error) {
    console.error('Update blog post error:', error);
    res.status(500).json({
      error: 'Failed to update blog post',
    });
  }
};

export const deleteBlogPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.blogPost.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: 'Blog post deleted successfully',
    });

  } catch (error) {
    console.error('Delete blog post error:', error);
    res.status(500).json({
      error: 'Failed to delete blog post',
    });
  }
};