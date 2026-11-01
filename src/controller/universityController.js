export function createUniversityController(service) {
  const handle = action => async (req, res, next) => {
    try {
      res.json(await action(req));
    }
    catch (error) {
      next(error);
    }
  };
  return {
    list: handle(req => service.list(req.query)),
    detail: handle(req => service.detail(req.params.id)),
    filters: handle(() => service.filters()),
    homepage: handle(req => service.homepage(req.query)),
  };
}
