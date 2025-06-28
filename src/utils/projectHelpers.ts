import { PrismaClient } from '../generated/prisma';
import { uploadFileToS3, uploadMultipleFilesToS3 } from './s3Upload';

const prisma = new PrismaClient();

export const handleProjectFileUploads = async (files: any, screenshots: any[]) => {
  let heroImageUrl = '';
  let screenshotUrls: any[] = [];

  // Upload hero image
  if (files.heroImage && files.heroImage[0]) {
    const heroResult = await uploadFileToS3({
      buffer: files.heroImage[0].buffer,
      originalname: files.heroImage[0].originalname,
      mimetype: files.heroImage[0].mimetype,
      size: files.heroImage[0].size,
    }, 'projects');

    if (!heroResult.success) {
      throw new Error(`Hero image upload failed: ${heroResult.error}`);
    }
    heroImageUrl = heroResult.url!;
  }

  // Upload multiple screenshots
  if (files.screenshots) {
    const screenshotFiles = files.screenshots.map((file: any) => ({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    }));

    const screenshotResults = await uploadMultipleFilesToS3(screenshotFiles, 'projects');
    
    screenshotUrls = screenshotResults.map((result, index) => ({
      url: result.url || '',
      description: screenshots?.[index]?.description || '',
      order: screenshots?.[index]?.order || index,
      success: result.success,
    }));

    const failedUploads = screenshotUrls.filter(s => !s.success);
    if (failedUploads.length > 0) {
      throw new Error('Some screenshot uploads failed');
    }
  }

  return { heroImageUrl, screenshotUrls };
};

export const createProjectOverview = async (tx: any, projectId: number, data: any) => {
  const { problem, solution, role, impact } = data;
  if (problem || solution || role || impact) {
    return await tx.projectOverview.create({
      data: {
        projectId,
        problem: problem || '',
        solution: solution || '',
        role: role || '',
        impact: impact || '',
      },
    });
  }
};

export const createProjectMetrics = async (tx: any, projectId: number, data: any) => {
  const { launchDate, duration, teamSize } = data;
  if (launchDate || duration || teamSize) {
    return await tx.projectMetrics.create({
      data: {
        projectId,
        launchDate: launchDate || '',
        duration: duration || '',
        teamSize: teamSize || '',
      },
    });
  }
};

export const createTechnicalDetails = async (tx: any, projectId: number, data: any) => {
  const { database, api, components } = data;
  if (database || api || components) {
    return await tx.technicalDetails.create({
      data: {
        projectId,
        database: database || '',
        api: api || '',
        components: components || '',
      },
    });
  }
};

export const createProjectArrayData = async (tx: any, projectId: number, data: any) => {
  const { 
    technologies, 
    lessons, 
    businessOutcomes, 
    improvements, 
    nextSteps, 
    futureTools, 
    performanceMetrics 
  } = data;

  // Create technologies
  if (technologies && Array.isArray(technologies)) {
    for (const tech of technologies) {
      await tx.technology.create({
        data: { projectId, name: tech.name, reason: tech.reason },
      });
    }
  }

  // Create lessons
  if (lessons && Array.isArray(lessons)) {
    for (const lesson of lessons) {
      await tx.lesson.create({
        data: { projectId, description: lesson.description },
      });
    }
  }

  // Create business outcomes
  if (businessOutcomes && Array.isArray(businessOutcomes)) {
    for (const outcome of businessOutcomes) {
      await tx.businessOutcome.create({
        data: { projectId, description: outcome.description },
      });
    }
  }

  // Create improvements
  if (improvements && Array.isArray(improvements)) {
    for (const improvement of improvements) {
      await tx.improvement.create({
        data: { projectId, description: improvement.description },
      });
    }
  }

  // Create next steps
  if (nextSteps && Array.isArray(nextSteps)) {
    for (const step of nextSteps) {
      await tx.nextStep.create({
        data: { projectId, description: step.description },
      });
    }
  }

  // Create future tools
  if (futureTools && Array.isArray(futureTools)) {
    for (const tool of futureTools) {
      await tx.futureTool.create({
        data: { projectId, name: tool.name },
      });
    }
  }

  // Create performance metrics
  if (performanceMetrics && Array.isArray(performanceMetrics)) {
    for (const metric of performanceMetrics) {
      await tx.performanceMetric.create({
        data: { projectId, description: metric.description },
      });
    }
  }
};

export const createProjectScreenshots = async (tx: any, projectId: number, screenshotUrls: any[]) => {
  if (screenshotUrls.length > 0) {
    for (const screenshot of screenshotUrls) {
      await tx.screenshot.create({
        data: {
          projectId,
          url: screenshot.url,
          description: screenshot.description,
          order: screenshot.order,
        },
      });
    }
  }
};

export const createProjectTags = async (tx: any, projectId: number, tags: any[]) => {
  if (tags && Array.isArray(tags)) {
    for (const tagData of tags) {
      // Create or find existing tag
      const tag = await tx.tag.upsert({
        where: { name: tagData.name },
        update: {},
        create: {
          name: tagData.name,
          slug: tagData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        },
      });

      // Connect tag to project
      await tx.projectTag.create({
        data: { projectId, tagId: tag.id },
      });
    }
  }
};