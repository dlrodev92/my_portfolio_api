import { Router } from 'express';
import { 
  createBlogPost, 
  getBlogPosts,
  getBlogPostsForCards,
  updateBlogPost, 
  deleteBlogPost 
} from '../controllers/blogController';
import { getBlogPostBySlug, getBlogPostById } from '../controllers/singleBlogController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();


router.get('/', getBlogPosts);
router.get('/cards', getBlogPostsForCards);
router.get('/slug/:slug', getBlogPostBySlug);
router.get('/id/:id', getBlogPostById);


router.post('/', 
  authenticateToken, 
  upload.fields([
    { name: 'heroImage', maxCount: 1 },
    { name: 'socialImage', maxCount: 1 },
    { name: 'contentImages', maxCount: 20 } 
  ]), 
  createBlogPost
);

router.put('/:id', 
  authenticateToken,
  upload.fields([
    { name: 'heroImage', maxCount: 1 },
    { name: 'socialImage', maxCount: 1 },
    { name: 'contentImages', maxCount: 20 }
  ]),
  updateBlogPost
);

router.delete('/:id', authenticateToken, deleteBlogPost);

export default router;