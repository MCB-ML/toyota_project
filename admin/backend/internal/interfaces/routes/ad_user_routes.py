from internal.dto.ad_user_master_dto import GetUserDetailsRequest
from internal.infrastructure.httpserver.router.router import Router
from internal.interfaces.api.v1.ad_users.handler import ADUserHandler


def adUserRoutes(router: Router, handler: ADUserHandler):
    """AD User routes"""
    adUserPrefix = router.pathPrefix("/adUsers")

    adUserPrefix.post(
        "/sync",
        handler.syncUsers,
        summary="Sync AD Users",
        description="Sync users from Azure Active Directory",
        tags=["AD Users"],
    )

    adUserPrefix.get(
        "/getAllUsers",
        handler.getUsers,
        summary="Get AD Users",
        description="Get all synchronized AD users",
        tags=["AD Users"],
    )

    adUserPrefix.post(
        "/details",
        handler.getUserDetails,
        summary="Get AD User Details",
        description="Get detailed information for a specific AD user by email, including unread mail and profile data.",
        tags=["AD Users"],
        body=GetUserDetailsRequest,
    )

    router.includeRouter(adUserPrefix)


# end def
