import { Router } from 'express';
import { 
  createProject, 
  getProjects, 
  updateProject, 
  deleteProject,
  getProjectBySlug,
  getProjectById,
  getProjectsForCards 
} from '../controllers/projectController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();


router.get('/', getProjects);
router.get('/cards', getProjectsForCards);
router.get('/slug/:slug', getProjectBySlug);
router.get('/id/:id', getProjectById);


router.post('/', 
  authenticateToken, 
  upload.fields([
    { name: 'heroImage', maxCount: 1 },
    { name: 'screenshots', maxCount: 10 }
  ]), 
  createProject
);

router.put('/:id', 
  authenticateToken,
  upload.fields([
    { name: 'heroImage', maxCount: 1 },
    { name: 'screenshots', maxCount: 10 }
  ]),
  updateProject
);

router.delete('/:id', authenticateToken, deleteProject);

export default router;