from internal.dto.user_dto import (
    UserCreateRequest,
    UserUpdateRequest,
)
from internal.infrastructure.httpserver.router.router import Router


def userRoutes(router: Router, handler):
    """User CRUD routes"""
    userPrefix = router.pathPrefix("/users")

    userPrefix.post(
        "/createUser",
        handler.createUser,
        summary="Create User",
        description="Create a new user",
        tags=["Users"],
        body=UserCreateRequest,
    )

    userPrefix.get(
        "/getAllUsers",
        handler.getAllUsers,
        summary="Get All Users",
        description="Retrieve list of all users",
        tags=["Users"],
    )

    userPrefix.get(
        "/getUserById/{id}",
        handler.getUserById,
        summary="Get User by ID",
        description="Retrieve a user by their ID",
        tags=["Users"],
    )

    userPrefix.put(
        "/updateUser/{id}",
        handler.updateUser,
        summary="Update User",
        description="Update user information",
        tags=["Users"],
        body=UserUpdateRequest,
    )

    userPrefix.delete(
        "/deleteUser/{id}",
        handler.deleteUser,
        summary="Delete User",
        description="Soft delete a user",
        tags=["Users"],
    )

    userPrefix.put(
        "/changePassword/{id}",
        handler.handleChangePassword,
        summary="Change Password",
        description="Change user password",
        tags=["Users"],
    )

    router.includeRouter(userPrefix)


# end def
