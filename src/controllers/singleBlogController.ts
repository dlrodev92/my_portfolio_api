import { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export const getBlogPostBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const blogPost = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        category: true,
        series: true,
        contentBlocks: { orderBy: { order: 'asc' } },
        blogPostTags: { include: { blogTag: true } },
      },
    });

    if (!blogPost) {
      res.status(404).json({ 
        error: 'Blog post not found',
        slug: slug 
      });
      return;
    }

    // Increment view count
    await prisma.blogPost.update({
      where: { id: blogPost.id },
      data: { views: { increment: 1 } },
    });

    res.json({
      success: true,
      data: blogPost,
    });

  } catch (error) {
    console.error('Get blog post by slug error:', error);
    res.status(500).json({
      error: 'Failed to fetch blog post',
    });
  }
};

export const getBlogPostById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const blogPost = await prisma.blogPost.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
        series: true,
        contentBlocks: { orderBy: { order: 'asc' } },
        blogPostTags: { include: { blogTag: true } },
      },
    });

    if (!blogPost) {
      res.status(404).json({ 
        error: 'Blog post not found',
        id: id 
      });
      return;
    }

    res.json({
      success: true,
      data: blogPost,
    });

  } catch (error) {
    console.error('Get blog post by ID error:', error);
    res.status(500).json({
      error: 'Failed to fetch blog post',
    });
  }
};