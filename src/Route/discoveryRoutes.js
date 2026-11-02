
import { Router } from 'express';
import { createUniversityController } from '../controller/universityController.js';
import { createUniversityService } from '../service/universityService.js';

export function createDiscoveryRoutes(service = createUniversityService()) {
  const router = Router();
  const controller = createUniversityController(service);

  /**
   * @swagger
   * tags:
   *   name: Discovery
   *   description: University discovery and homepage APIs
   */

  /**
   * @swagger
   * /api/universities:
   *   get:
   *     summary: Get all universities
   *     description: Retrieve universities with pagination, search, filtering, and sorting.
   *     tags: [Discovery]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *           minimum: 1
   *           maximum: 1000000
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 12
   *           minimum: 1
   *           maximum: 100
   *         description: Number of universities per page
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *           maxLength: 150
   *         description: Search universities
   *       - in: query
   *         name: location
   *         schema:
   *           type: string
   *           maxLength: 100
   *         description: Filter by university location
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [public, private]
   *         description: Filter by university type
   *       - in: query
   *         name: sort
   *         schema:
   *           type: string
   *           enum: [name, name_desc, newest, tuition_asc]
   *           default: name
   *         description: Sort universities
   *       - in: query
   *         name: featured
   *         schema:
   *           type: boolean
   *         description: Filter featured universities
   *       - in: query
   *         name: majorId
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Filter by major ID
   *     responses:
   *       200:
   *         description: Universities retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     description: University information
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: integer
   *                       example: 1
   *                     limit:
   *                       type: integer
   *                       example: 12
   *                     total:
   *                       type: integer
   *                       example: 50
   *                     totalPages:
   *                       type: integer
   *                       example: 5
   *       400:
   *         description: Invalid query parameters
   *       500:
   *         description: Internal server error
   */
  router.get('/universities', controller.list);

  /**
   * @swagger
   * /api/universities/filters:
   *   get:
   *     summary: Get university filter options
   *     description: Retrieve available filter options for university discovery.
   *     tags: [Discovery]
   *     responses:
   *       200:
   *         description: Filter options retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   description: Available university filter options
   *       500:
   *         description: Internal server error
   */
  router.get('/universities/filters', controller.filters);

  /**
   * @swagger
   * /api/universities/{id}:
   *   get:
   *     summary: Get university details
   *     description: Retrieve detailed information about a university by ID.
   *     tags: [Discovery]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: University ID
   *     responses:
   *       200:
   *         description: University details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   description: University details
   *       400:
   *         description: Invalid university ID
   *       404:
   *         description: University not found
   *       500:
   *         description: Internal server error
   */
  router.get('/universities/:id', controller.detail);

  /**
   * @swagger
   * /api/homepage:
   *   get:
   *     summary: Get homepage data
   *     description: Retrieve featured homepage university data.
   *     tags: [Discovery]
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 4
   *           minimum: 1
   *           maximum: 12
   *         description: Number of universities to retrieve
   *     responses:
   *       200:
   *         description: Homepage data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   description: Homepage data
   *       400:
   *         description: Invalid limit parameter
   *       500:
   *         description: Internal server error
   */
  router.get('/homepage', controller.homepage);

  return router;
}
