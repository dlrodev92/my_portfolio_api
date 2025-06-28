import { PrismaClient } from '../generated/prisma';
import { uploadFileToS3, uploadMultipleFilesToS3 } from './s3Upload';

const prisma = new PrismaClient();

export const handleBlogFileUploads = async (files: any, contentBlocks: any[]) => {
  let heroImageUrl = '';
  let socialImageUrl = '';
  let processedContentBlocks = [...contentBlocks];

  
  if (files.heroImage && files.heroImage[0]) {
    const heroResult = await uploadFileToS3({
      buffer: files.heroImage[0].buffer,
      originalname: files.heroImage[0].originalname,
      mimetype: files.heroImage[0].mimetype,
      size: files.heroImage[0].size,
    }, 'blog');

    if (!heroResult.success) {
      throw new Error(`Hero image upload failed: ${heroResult.error}`);
    }
    heroImageUrl = heroResult.url!;
  }

 
  if (files.socialImage && files.socialImage[0]) {
    const socialResult = await uploadFileToS3({
      buffer: files.socialImage[0].buffer,
      originalname: files.socialImage[0].originalname,
      mimetype: files.socialImage[0].mimetype,
      size: files.socialImage[0].size,
    }, 'blog');

    if (!socialResult.success) {
      throw new Error(`Social image upload failed: ${socialResult.error}`);
    }
    socialImageUrl = socialResult.url!;
  }


  if (files.contentImages && files.contentImages.length > 0) {
    const contentImageFiles = files.contentImages.map((file: any) => ({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    }));

    const contentImageResults = await uploadMultipleFilesToS3(contentImageFiles, 'blog');
    
    
    let imageIndex = 0;
    processedContentBlocks = contentBlocks.map(block => {
      if (block.type === 'IMAGE' && imageIndex < contentImageResults.length) {
        const uploadResult = contentImageResults[imageIndex];
        if (!uploadResult.success) {
          throw new Error(`Content image upload failed: ${uploadResult.error}`);
        }
        imageIndex++;
        return {
          ...block,
          imageUrl: uploadResult.url,
        };
      }
      return block;
    });
  }

  return { heroImageUrl, socialImageUrl, processedContentBlocks };
};

export const processContentBlocks = async (tx: any, blogPostId: number, contentBlocks: any[]) => {
  if (!contentBlocks || !Array.isArray(contentBlocks)) return;

  for (const block of contentBlocks) {
    const blockData: any = {
      blogPostId,
      type: block.type,
      order: block.order || 0,
      content: block.content || '',
    };

    
    switch (block.type) {
      case 'HEADING':
        blockData.level = block.level || 2;
        break;
      
      case 'CODE':
        blockData.language = block.language || 'javascript';
        blockData.codeTitle = block.codeTitle || null;
        break;
      
      case 'IMAGE':
        blockData.imageUrl = block.imageUrl || null;
        blockData.imageAlt = block.imageAlt || null;
        blockData.imageCaption = block.imageCaption || null;
        blockData.imageAlignment = block.imageAlignment || 'center';
        break;
      
      case 'CALLOUT':
        blockData.calloutVariant = block.calloutVariant || 'INFO';
        blockData.calloutTitle = block.calloutTitle || null;
        break;
      
      case 'QUOTE':
        blockData.quoteAuthor = block.quoteAuthor || null;
        break;
      
      case 'LIST':
        blockData.listStyle = block.listStyle || 'BULLET';
        blockData.listItems = block.listItems || [];
        break;
      
      case 'VIDEO':
        blockData.videoType = block.videoType || 'YOUTUBE';
        blockData.videoId = block.videoId || null;
        blockData.videoTitle = block.videoTitle || null;
        break;
      
      case 'PARAGRAPH':
        blockData.paragraphStyle = block.paragraphStyle || 'normal';
        break;
    }

    await tx.contentBlock.create({ data: blockData });
  }
};

export const manageBlogSeries = async (tx: any, blogPostId: number, seriesData: any) => {
  if (!seriesData || !seriesData.name) return null;

  const series = await tx.series.upsert({
    where: { name: seriesData.name },
    update: {},
    create: {
      name: seriesData.name,
      slug: seriesData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: seriesData.description || null,
    },
  });


  await tx.blogPost.update({
    where: { id: blogPostId },
    data: {
      seriesId: series.id,
      seriesPart: seriesData.part || null,
    },
  });

  const seriesPostsCount = await tx.blogPost.count({
    where: { seriesId: series.id },
  });

  await tx.series.update({
    where: { id: series.id },
    data: { totalParts: seriesPostsCount },
  });

  return series;
};

export const createBlogTags = async (tx: any, blogPostId: number, tags: any[]) => {
  if (!tags || !Array.isArray(tags)) return;

  for (const tagData of tags) {
 
    const tag = await tx.blogTag.upsert({
      where: { name: tagData.name },
      update: {},
      create: {
        name: tagData.name,
        slug: tagData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      },
    });

    await tx.blogPostTag.create({
      data: {
        blogPostId,
        blogTagId: tag.id,
      },
    });
  }
};

export const createBlogCategory = async (tx: any, categoryData: any) => {
  if (!categoryData || !categoryData.name) return null;

  
  const category = await tx.category.upsert({
    where: { name: categoryData.name },
    update: {},
    create: {
      name: categoryData.name,
      slug: categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    },
  });

  return category;
};

export const calculateWordCount = (contentBlocks: any[]): number => {
  if (!contentBlocks || !Array.isArray(contentBlocks)) return 0;

  return contentBlocks.reduce((total, block) => {
    if (block.content && typeof block.content === 'string') {
      const words = block.content.trim().split(/\s+/).length;
      return total + words;
    }
    return total;
  }, 0);
};