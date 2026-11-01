import { Router } from 'express';
import { createUniversityController } from '../controller/universityController.js';
import { createUniversityService } from '../service/universityService.js';

export function createDiscoveryRoutes(service = createUniversityService()) {
  const router = Router();
  const controller = createUniversityController(service);
  router.get('/universities', controller.list);
  router.get('/universities/filters', controller.filters);
  router.get('/universities/:id', controller.detail);
  router.get('/homepage', controller.homepage);
  return router;
}
