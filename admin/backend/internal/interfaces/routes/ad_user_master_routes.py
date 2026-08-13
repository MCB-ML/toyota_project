from internal.dto.ad_user_master_dto import ADUserCreateRequest, ADUserUpdateRequest
from internal.infrastructure.httpserver.router.router import Router
from internal.interfaces.api.v1.ad_users.handler import ADUserHandler


def adUserMasterRoutes(router: Router, handler: ADUserHandler):
    """AD User Master CRUD routes"""
    adUserMasterPrefix = router.pathPrefix("/adUserMaster")

    adUserMasterPrefix.post(
        "/createUser",
        handler.createADUser,
        summary="Onboard AD User",
        description="Add an AD User to Master table and assign workspace",
        tags=["AD User Master"],
        body=ADUserCreateRequest,
    )

    adUserMasterPrefix.get(
        "/getAllUsers",
        handler.getAllADUsers,
        summary="Get All Onboarded AD Users",
        description="Retrieve list of all onboarded AD users",
        tags=["AD User Master"],
    )

    adUserMasterPrefix.get(
        "/getUserById/{id}",
        handler.getADUserById,
        summary="Get Onboarded AD User by ID",
        description="Retrieve an onboarded AD user by their ID",
        tags=["AD User Master"],
    )

    adUserMasterPrefix.put(
        "/updateUser/{id}",
        handler.updateADUser,
        summary="Update Onboarded AD User",
        description="Update onboarded AD user information",
        tags=["AD User Master"],
        body=ADUserUpdateRequest,
    )

    adUserMasterPrefix.delete(
        "/deleteUser/{id}",
        handler.deleteADUser,
        summary="Delete Onboarded AD User",
        description="Soft delete an onboarded AD user",
        tags=["AD User Master"],
    )

    router.includeRouter(adUserMasterPrefix)


# end def
