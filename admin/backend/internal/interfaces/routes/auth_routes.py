from internal.infrastructure.httpserver.router.router import Router
from internal.interfaces.api.v1.auth.handler import AuthHandler


def authRoutes(router: Router, handler: AuthHandler):
    authRouter = router.pathPrefix("/auth")

    authRouter.post(
        "/login/microsoft",
        handler.handleMicrosoftLogin,
        summary="Microsoft Login",
        description="Login with Microsoft Access Token to get JWT and user details",
        tags=["Auth"],
    )
    
    authRouter.get(
        "/check/{token}",
        handler.handleToken,
        summary="Microsoft Login",
        description="Login with Microsoft Access Token to get JWT and user details",
        tags=["Auth"],
    )
    
    authRouter.post(
        "/login/credentials",
        handler.handleCredentialLogin,
        summary="Credential Login",
        description="Login with Email and Password",
        tags=["Auth"],
    )

    authRouter.post(
        "/login/teams",
        handler.handleTeamsLogin,
        summary="Teams SSO Login",
        description="Login with Teams SSO Token (OBO Flow)",
        tags=["Auth"],
    )

    router.includeRouter(authRouter)


# end def
