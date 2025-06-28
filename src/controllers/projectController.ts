import { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import {
  handleProjectFileUploads,
  createProjectOverview,
  createProjectMetrics,
  createTechnicalDetails,
  createProjectArrayData,
  createProjectScreenshots,
  createProjectTags
} from '../utils/projectHelpers';

const prisma = new PrismaClient();

export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, subtitle, status, liveDemo, github, caseStudy, publishedAt, screenshots, tags } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const { heroImageUrl, screenshotUrls } = await handleProjectFileUploads(files, screenshots);

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

   
    const project = await prisma.$transaction(async (tx) => {
     
      const newProject = await tx.project.create({
        data: {
          title,
          subtitle,
          slug,
          status: status.toUpperCase(),
          heroImage: heroImageUrl,
          liveDemo,
          github,
          caseStudy,
          publishedAt: publishedAt ? new Date(publishedAt) : null,
        },
      });

      await createProjectOverview(tx, newProject.id, req.body);
      await createProjectMetrics(tx, newProject.id, req.body);
      await createTechnicalDetails(tx, newProject.id, req.body);
      await createProjectArrayData(tx, newProject.id, req.body);
      await createProjectScreenshots(tx, newProject.id, screenshotUrls);
      await createProjectTags(tx, newProject.id, tags);

      return newProject;
    });

    res.status(201).json({
      success: true,
      data: project,
    });

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create project',
    });
  }
};

export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, tag, limit = '10', offset = '0' } = req.query;

    const projects = await prisma.project.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(tag && {
          projectTags: {
            some: {
              tag: { slug: tag as string },
            },
          },
        }),
      },
      include: {
        overview: true,
        metrics: true,
        technicalDetails: true,
        screenshots: { orderBy: { order: 'asc' } },
        technologies: true,
        projectTags: { include: { tag: true } },
        lessons: true,
        businessOutcomes: true,
        improvements: true,
        nextSteps: true,
        futureTools: true,
        performanceMetrics: true,
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.json({
      success: true,
      data: projects,
    });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      error: 'Failed to fetch projects',
    });
  }
};

export const getProjectBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        overview: true,
        metrics: true,
        technicalDetails: true,
        screenshots: { orderBy: { order: 'asc' } },
        technologies: true,
        projectTags: { include: { tag: true } },
        lessons: true,
        businessOutcomes: true,
        improvements: true,
        nextSteps: true,
        futureTools: true,
        performanceMetrics: true,
      },
    });

    if (!project) {
      res.status(404).json({ 
        error: 'Project not found',
        slug: slug 
      });
      return;
    }

    res.json({
      success: true,
      data: project,
    });

  } catch (error) {
    console.error('Get project by slug error:', error);
    res.status(500).json({
      error: 'Failed to fetch project',
    });
  }
};

export const getProjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: {
        overview: true,
        metrics: true,
        technicalDetails: true,
        screenshots: { orderBy: { order: 'asc' } },
        technologies: true,
        projectTags: { include: { tag: true } },
        lessons: true,
        businessOutcomes: true,
        improvements: true,
        nextSteps: true,
        futureTools: true,
        performanceMetrics: true,
      },
    });

    if (!project) {
      res.status(404).json({ 
        error: 'Project not found',
        id: id 
      });
      return;
    }

    res.json({
      success: true,
      data: project,
    });

  } catch (error) {
    console.error('Get project by ID error:', error);
    res.status(500).json({
      error: 'Failed to fetch project',
    });
  }
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const project = await prisma.project.update({
      where: { id: parseInt(id) },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        overview: true,
        metrics: true,
        technicalDetails: true,
        screenshots: { orderBy: { order: 'asc' } },
        technologies: true,
        projectTags: { include: { tag: true } },
        lessons: true,
        businessOutcomes: true,
        improvements: true,
        nextSteps: true,
        futureTools: true,
        performanceMetrics: true,
      },
    });

    res.json({
      success: true,
      data: project,
    });

  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      error: 'Failed to update project',
    });
  }
};

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.project.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      error: 'Failed to delete project',
    });
  }
};

export const getProjectsForCards = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, tag, limit = '10', offset = '0' } = req.query;

    const projects = await prisma.project.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(tag && {
          projectTags: {
            some: {
              tag: { slug: tag as string },
            },
          },
        }),
      },
      select: {
        id: true,
        title: true,
        subtitle: true,
        slug: true,
        status: true,
        heroImage: true,
        liveDemo: true,
        github: true,
        createdAt: true,
       
        technologies: {
          select: {
            name: true,
          },
        },
       
        projectTags: {
          select: {
            tag: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    
    const transformedProjects = projects.map(project => ({
      id: project.id,
      title: project.title,
      description: project.subtitle, 
      slug: project.slug,
      status: project.status,
      heroImage: project.heroImage,
      liveDemo: project.liveDemo,
      github: project.github,
      createdAt: project.createdAt,
      
      tech: project.technologies.map(t => t.name),
   
      tags: project.projectTags.map(pt => ({
        name: pt.tag.name,
        slug: pt.tag.slug,
      })),
    }));

    res.json({
      success: true,
      data: transformedProjects,
    });

  } catch (error) {
    console.error('Get projects for cards error:', error);
    res.status(500).json({
      error: 'Failed to fetch projects for cards',
    });
  }
};