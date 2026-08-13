from typing import Any, Callable, List, Optional

from fastapi import APIRouter, Depends, FastAPI, Request
from fastapi.responses import JSONResponse

from internal.infrastructure.httpserver.handler.handler_context import (
    HandlerContext,
    createHandlerContext,
)
from pkg.main_lib import MainLib


class Router:
    LOG_TAG = "OSRouter"
    printDebugRouter = True

    def __init__(
        self,
        app: Optional[FastAPI] = None,
        mainLib: Optional[MainLib] = None,
        prefix: str = "",
    ):
        self.mainLib = mainLib
        self.prefix = prefix

        if app is not None:
            self.app = app
            self.router = None
        else:
            self.app = None
            self.router = APIRouter(prefix=prefix)
        # end if

        # Store middleware to be applied
        self.middlewares: List[Callable] = []

    # end def

    async def _executeHandler(self, handler, context):
        """Execute the handler with error handling"""
        try:
            result = handler(context)
            if hasattr(result, "__await__"):
                result = await result
            # end if
            await context.close()
            return result
        except Exception as e:
            self.mainLib.logPrint(
                f"Handler error: {str(e)}", self.LOG_TAG, self.printDebugRouter
            )
            await context.close()

            from internal.domain.entities.error_response import (
                ERROR_CODE_INTERNAL_SERVER_ERROR,
                ERROR_MSG_INTERNAL_SERVER_ERROR,
                ErrorResponse,
            )

            return context.sendErrorJson(
                500,
                ErrorResponse(
                    code=ERROR_CODE_INTERNAL_SERVER_ERROR,
                    message=ERROR_MSG_INTERNAL_SERVER_ERROR,
                ),
            )
        # end try

    # end def

    def _createWrapper(
        self,
        handler: Callable[[HandlerContext], JSONResponse],
        path_params: List[str] = None,
    ):
        """Create a standard wrapper"""

        async def wrapper(
            context: HandlerContext = Depends(createHandlerContext(self.mainLib)),
            **kwargs,  # Catch all path params
        ):
            return await self._executeHandler(handler, context)

        # end def

        # Clean up signature -> remove kwargs
        import inspect

        from fastapi import Path

        # Get original signature
        sig = inspect.signature(wrapper)
        # Filter out **kwargs from original params
        params = [
            p
            for p in sig.parameters.values()
            if p.kind != inspect.Parameter.VAR_KEYWORD
        ]

        # If we have path params, add them
        if path_params:
            for param_name in path_params:
                new_param = inspect.Parameter(
                    param_name,
                    inspect.Parameter.KEYWORD_ONLY,
                    annotation=str,
                    default=Path(...),
                )
                params.append(new_param)
            # end for
        # end if

        # Update signature
        wrapper.__signature__ = sig.replace(parameters=params)

        return wrapper

    # end def

    def _extractPathParams(self, path: str) -> List[str]:
        """Extract parameters from path string e.g. /users/{id} -> ['id']"""
        import re

        return re.findall(r"{([a-zA-Z0-9_]+)}", path)

    # end def

    def get(
        self,
        path: str,
        handler: Callable[[HandlerContext], JSONResponse],
        summary: str = None,
        description: str = None,
        tags: List[str] = None,
        response_model: Any = None,
    ):
        """Register GET endpoint"""
        path_params = self._extractPathParams(path)
        wrapper = self._createWrapper(handler, path_params)

        route_kwargs = {}
        if summary:
            route_kwargs["summary"] = summary
        if description:
            route_kwargs["description"] = description
        if tags:
            route_kwargs["tags"] = tags
        if response_model:
            route_kwargs["response_model"] = response_model

        if self.router is not None:
            self.router.get(path, **route_kwargs)(wrapper)
        else:
            self.app.get(path, **route_kwargs)(wrapper)
        # end if

    # end def

    def post(
        self,
        path: str,
        handler: Callable[[HandlerContext], JSONResponse],
        summary: str = None,
        description: str = None,
        tags: List[str] = None,
        body: Any = None,
        response_model: Any = None,
        params_dependency: Any = None,
    ):
        """Register POST endpoint"""
        path_params = self._extractPathParams(path)

        # If body model is provided -> add it to the wrapper signature
        if body:
            from fastapi import Body

            # Default to Body(...) if not provided (JSON)
            if params_dependency is None:
                params_dependency = Body
            # end if

            async def specialized_wrapper(
                context: HandlerContext = Depends(createHandlerContext(self.mainLib)),
                request_body: body = params_dependency(...),
                **kwargs,
            ):
                context.setParsedBody(request_body)
                return await self._executeHandler(handler, context)

            # end def

            # Clean signature to remove kwargs
            import inspect

            from fastapi import Path

            sig = inspect.signature(specialized_wrapper)
            # Filter out **kwargs from original params
            params = [
                p
                for p in sig.parameters.values()
                if p.kind != inspect.Parameter.VAR_KEYWORD
            ]

            # Add path params if any
            if path_params:
                for param_name in path_params:
                    new_param = inspect.Parameter(
                        param_name,
                        inspect.Parameter.KEYWORD_ONLY,
                        annotation=str,
                        default=Path(...),
                    )
                    params.append(new_param)
                # end for
            # end if

            specialized_wrapper.__signature__ = sig.replace(parameters=params)

            wrapper = specialized_wrapper
        else:
            wrapper = self._createWrapper(handler, path_params)
        # end if

        route_kwargs = {}
        if summary:
            route_kwargs["summary"] = summary
        if description:
            route_kwargs["description"] = description
        if tags:
            route_kwargs["tags"] = tags
        if response_model:
            route_kwargs["response_model"] = response_model

        if self.router is not None:
            self.router.post(path, **route_kwargs)(wrapper)
        else:
            self.app.post(path, **route_kwargs)(wrapper)
        # end if

    # end def

    def put(
        self,
        path: str,
        handler: Callable[[HandlerContext], JSONResponse],
        summary: str = None,
        description: str = None,
        tags: List[str] = None,
        body: Any = None,
        response_model: Any = None,
        params_dependency: Any = None,
    ):
        """Register PUT endpoint"""
        path_params = self._extractPathParams(path)

        if body:
            from fastapi import Body

            # Default to Body(...) if not provided (JSON)
            if params_dependency is None:
                params_dependency = Body
            # end if

            async def specialized_wrapper(
                context: HandlerContext = Depends(createHandlerContext(self.mainLib)),
                request_body: body = params_dependency(...),
                **kwargs,
            ):
                context.setParsedBody(request_body)
                return await self._executeHandler(handler, context)

            # end def

            # Clean signature to remove kwargs
            import inspect

            from fastapi import Path

            sig = inspect.signature(specialized_wrapper)
            # Filter out **kwargs from original params
            params = [
                p
                for p in sig.parameters.values()
                if p.kind != inspect.Parameter.VAR_KEYWORD
            ]

            # Add path params if any
            if path_params:
                for param_name in path_params:
                    new_param = inspect.Parameter(
                        param_name,
                        inspect.Parameter.KEYWORD_ONLY,
                        annotation=str,
                        default=Path(...),
                    )
                    params.append(new_param)
                # end for
            # end if

            specialized_wrapper.__signature__ = sig.replace(parameters=params)

            wrapper = specialized_wrapper
        else:
            wrapper = self._createWrapper(handler, path_params)
        # end if

        route_kwargs = {}
        if summary:
            route_kwargs["summary"] = summary
        if description:
            route_kwargs["description"] = description
        if tags:
            route_kwargs["tags"] = tags
        if response_model:
            route_kwargs["response_model"] = response_model

        if self.router is not None:
            self.router.put(path, **route_kwargs)(wrapper)
        else:
            self.app.put(path, **route_kwargs)(wrapper)
        # end if

    # end def

    def patch(
        self,
        path: str,
        handler: Callable[[HandlerContext], JSONResponse],
        summary: str = None,
        description: str = None,
        tags: List[str] = None,
        body: Any = None,
        response_model: Any = None,
        params_dependency: Any = None,
    ):
        """Register PATCH endpoint"""
        path_params = self._extractPathParams(path)

        if body:
            from fastapi import Body

            # Default to Body(...) if not provided (JSON)
            if params_dependency is None:
                params_dependency = Body
            # end if

            async def specialized_wrapper(
                context: HandlerContext = Depends(createHandlerContext(self.mainLib)),
                request_body: body = params_dependency(...),
                **kwargs,
            ):
                context.setParsedBody(request_body)
                return await self._executeHandler(handler, context)

            # end def

            # Clean signature to remove kwargs
            import inspect

            from fastapi import Path

            sig = inspect.signature(specialized_wrapper)
            # Filter out **kwargs from original params
            params = [
                p
                for p in sig.parameters.values()
                if p.kind != inspect.Parameter.VAR_KEYWORD
            ]

            # Add path params if any
            if path_params:
                for param_name in path_params:
                    new_param = inspect.Parameter(
                        param_name,
                        inspect.Parameter.KEYWORD_ONLY,
                        annotation=str,
                        default=Path(...),
                    )
                    params.append(new_param)
                # end for
            # end if

            specialized_wrapper.__signature__ = sig.replace(parameters=params)

            wrapper = specialized_wrapper
        else:
            wrapper = self._createWrapper(handler, path_params)
        # end if

        route_kwargs = {}
        if summary:
            route_kwargs["summary"] = summary
        if description:
            route_kwargs["description"] = description

        if self.router is not None:
            self.router.patch(path, **route_kwargs)(wrapper)
        else:
            self.app.patch(path, **route_kwargs)(wrapper)
        # end if

    # end def
    def delete(
        self,
        path: str,
        handler: Callable[[HandlerContext], JSONResponse],
        summary: str = None,
        description: str = None,
        tags: List[str] = None,
        response_model: Any = None,
    ):
        """Register DELETE endpoint"""
        path_params = self._extractPathParams(path)
        wrapper = self._createWrapper(handler, path_params)

        route_kwargs = {}
        if summary:
            route_kwargs["summary"] = summary
        if description:
            route_kwargs["description"] = description
        if tags:
            route_kwargs["tags"] = tags
        if response_model:
            route_kwargs["response_model"] = response_model

        if self.router is not None:
            self.router.delete(path, **route_kwargs)(wrapper)
        else:
            self.app.delete(path, **route_kwargs)(wrapper)
        # end if

    # end def

    def notFoundHandler(self, handler: Callable[[HandlerContext], JSONResponse]):
        """Register handler for 404 Not Found"""
        self._createWrapper(handler)

        if self.app is not None:

            @self.app.exception_handler(404)
            async def custom_404_handler(request: Request, exc):
                context = HandlerContext(request, self.mainLib)
                result = handler(context)
                if hasattr(result, "__await__"):
                    result = await result
                await context.close()
                return result

            # end def
        # end if

    # end def

    def pathPrefix(self, prefix: str) -> "Router":
        """Create a sub-router with the specified prefix"""
        newRouter = Router(mainLib=self.mainLib, prefix=prefix)
        newRouter.parentRouter = self
        newRouter._registered = False
        return newRouter

    # end def

    def _ensureRegistered(self):
        """Make sure sub router is registered with parent!"""
        if (
            hasattr(self, "parentRouter")
            and hasattr(self, "_registered")
            and not self._registered
        ):
            if self.router is not None:
                # Register parent first if it is not registered yet
                if hasattr(self.parentRouter, "_ensureRegistered"):
                    self.parentRouter._ensureRegistered()
                # end if

                # If parent has a router (sub-router) -> there
                # Otherwise include in the app
                if self.parentRouter.router is not None:
                    self.parentRouter.router.include_router(self.router)
                    self._registered = True
                elif self.parentRouter.app is not None:
                    self.parentRouter.app.include_router(self.router)
                    self._registered = True
                # end if
            # end if
        # end if

    # end def

    def addMiddleware(self, *middlewares):
        """Add middleware to the router"""
        for middleware in middlewares:
            if self.app is not None:
                self.app.middleware("http")(middleware)
            else:
                self.middlewares.append(middleware)
            # end if
        # end for

    # end def

    def getApp(self) -> FastAPI:
        """Get the underlying FastAPI app"""
        return self.app

    # end def

    def getRouter(self) -> Optional[APIRouter]:
        """Get the underlying APIRouter (for sub routers)"""
        return self.router

    # end def

    def includeRouter(self, subRouter: "Router"):
        """Include a sub router into this router"""
        if subRouter.router is not None:
            if self.router is not None:
                # Sub router -> sub router
                self.router.include_router(subRouter.router)
            elif self.app is not None:
                # Root app
                self.app.include_router(subRouter.router)
            # end if
        # end if

    # end def


# end class


def newFastApiRouter(mainLib: MainLib, **config) -> Router:
    """Create a new router"""
    app = FastAPI(**config)
    return Router(app=app, mainLib=mainLib)


# end def
